import type { PaymentProvider } from "./types";

/**
 * ZarinPal REST v4.
 *
 * Docs: https://docs.zarinpal.com/paymentGateway/
 *
 * Two things bite people here:
 *
 *  - **Units.** The API takes rial; this shop stores toman. Sending toman
 *    unconverted charges the buyer a tenth of the price.
 *  - **Trust.** The browser comes back from the bank with `Status=OK`, but that
 *    is just a query parameter and anyone can type it. Only the verify call —
 *    with the amount *we* hold, not the one in the URL — settles an order.
 */

const LIVE = "https://payment.zarinpal.com/pg";
const SANDBOX = "https://sandbox.zarinpal.com/pg";

type RequestResponse = {
  data?: { code?: number; authority?: string; message?: string };
  errors?: { code?: number; message?: string } | unknown[];
};

type VerifyResponse = {
  data?: { code?: number; ref_id?: number; message?: string };
  errors?: { code?: number; message?: string } | unknown[];
};

function errorMessage(payload: { errors?: unknown }, fallback: string) {
  const errors = payload.errors;
  if (errors && !Array.isArray(errors) && typeof errors === "object") {
    const message = (errors as { message?: string }).message;
    if (message) return message;
  }
  return fallback;
}

export function createZarinpal(options: {
  merchantId: string;
  sandbox: boolean;
}): PaymentProvider {
  const base = options.sandbox ? SANDBOX : LIVE;

  return {
    id: "zarinpal",
    live: !options.sandbox,

    async start(order, callbackUrl) {
      const response = await fetch(`${base}/v4/payment/request.json`, {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({
          merchant_id: options.merchantId,
          // toman → rial
          amount: order.total * 10,
          description: `سفارش ${order.number}`,
          callback_url: callbackUrl,
          metadata: { email: order.email, mobile: order.phone },
        }),
        cache: "no-store",
      });

      const payload = (await response.json().catch(() => ({}))) as RequestResponse;
      const authority = payload.data?.authority;

      if (payload.data?.code !== 100 || !authority) {
        return {
          ok: false,
          error: errorMessage(payload, `ZarinPal request failed (${response.status})`),
        };
      }

      return {
        ok: true,
        authority,
        redirectUrl: `${base}/StartPay/${authority}`,
      };
    },

    async verify(order, params) {
      // The authority we stored at request time is the one that belongs to this
      // order. Taking it from the URL instead would let a paid authority from
      // one order settle another.
      const authority = order.paymentAuthority ?? params.get("Authority");
      if (!authority) return { ok: false, error: "Missing authority" };

      if (params.get("Status") !== "OK") {
        return { ok: false, error: "Payment was cancelled at the gateway" };
      }

      const response = await fetch(`${base}/v4/payment/verify.json`, {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({
          merchant_id: options.merchantId,
          amount: order.total * 10,
          authority,
        }),
        cache: "no-store",
      });

      const payload = (await response.json().catch(() => ({}))) as VerifyResponse;
      const code = payload.data?.code;

      // 100 = verified now, 101 = verified earlier. A repeated callback is
      // normal, so 101 counts as success rather than an error.
      if (code === 100 || code === 101) {
        return {
          ok: true,
          reference: String(payload.data?.ref_id ?? authority),
        };
      }

      return {
        ok: false,
        error: errorMessage(payload, `ZarinPal verification failed (code ${code})`),
      };
    },
  };
}
