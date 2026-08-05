import type { PaymentProvider } from "./types";

/**
 * The development stand-in for a bank.
 *
 * "Redirecting" to it means landing on the in-app gateway page, whose two
 * buttons link straight back to the same callback a real provider would send
 * the buyer to — with the same `Status` and `Authority` parameters. So the
 * path exercised in development is the production path; only the counterparty
 * changes.
 */
export function createSimulated(): PaymentProvider {
  return {
    id: "simulated",
    live: false,

    async start(order, callbackUrl) {
      const authority = `SIM${order.id.slice(-8).toUpperCase()}${Date.now()
        .toString()
        .slice(-6)}`;

      const url = new URL(callbackUrl);
      url.searchParams.set("Status", "OK");
      url.searchParams.set("Authority", authority);

      return { ok: true, authority, redirectUrl: url.toString() };
    },

    async verify(order, params) {
      if (params.get("Status") !== "OK") {
        return { ok: false, error: "Payment declined at the simulated gateway" };
      }
      // A real provider is asked whether the money moved; here the query
      // parameter is all there is, which is exactly why this must never be the
      // provider in production.
      return {
        ok: true,
        reference:
          order.paymentAuthority ?? `SIM-${Date.now().toString().slice(-9)}`,
      };
    },
  };
}
