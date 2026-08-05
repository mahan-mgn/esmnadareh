/**
 * Every payment service does the same two things: it hands out a URL to send
 * the buyer to, and it answers "was this actually paid?" when they come back.
 * Keeping that behind one interface is what lets the simulated gateway and a
 * real bank share the whole checkout, settlement and refund path below it.
 */

export type PaymentOrder = {
  id: string;
  number: string;
  /** Whole toman, as stored. Providers convert to their own unit. */
  total: number;
  email: string;
  phone: string;
};

export type StartResult =
  | { ok: true; redirectUrl: string; authority: string }
  | { ok: false; error: string };

export type VerifyResult =
  | { ok: true; reference: string }
  | { ok: false; error: string; alreadyVerified?: boolean };

export type PaymentProvider = {
  id: string;
  /** False for the built-in simulator, so the UI can label it honestly. */
  live: boolean;
  /**
   * Opens a payment at the provider and returns where to send the buyer.
   * `callbackUrl` is absolute — the provider redirects the browser back to it.
   */
  start(order: PaymentOrder, callbackUrl: string): Promise<StartResult>;
  /**
   * Confirms with the provider that the money moved. `params` is the callback
   * query string; the provider decides what it needs from it.
   */
  verify(
    order: PaymentOrder & { paymentAuthority: string | null },
    params: URLSearchParams,
  ): Promise<VerifyResult>;
};
