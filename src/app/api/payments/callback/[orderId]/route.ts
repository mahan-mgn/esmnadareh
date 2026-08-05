import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCart } from "@/lib/cart";
import {
  ORDER_GRANT_COOKIE,
  ORDER_GRANT_OPTIONS,
  orderGrantValue,
} from "@/lib/orders";
import { orderIsPayable, releaseExpiredReservations } from "@/lib/inventory";
import {
  getPaymentProvider,
  markOrderFailed,
  markOrderPaid,
} from "@/lib/payments";
import { sendOrderConfirmation } from "@/lib/mail";
import { defaultLocale, isLocale } from "@/i18n/config";

export const dynamic = "force-dynamic";

/**
 * Where the buyer lands on the way back from the bank.
 *
 * The browser's query string is a claim, not evidence: `Status=OK` is one
 * keystroke away for anyone who has seen a receipt URL. So nothing here trusts
 * it — the provider is asked directly, against the authority and the amount
 * this server stored when the payment was opened.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const { orderId } = await params;
  const url = new URL(request.url);
  const query = url.searchParams;

  const localeParam = query.get("locale");
  const locale = isLocale(localeParam) ? localeParam : defaultLocale;
  const resultUrl = new URL(
    `/${locale}/checkout/result/${orderId}`,
    url.origin,
  );

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      number: true,
      total: true,
      email: true,
      phone: true,
      userId: true,
      status: true,
      paymentStatus: true,
      paymentAuthority: true,
    },
  });
  if (!order) return NextResponse.redirect(new URL(`/${locale}`, url.origin));

  // Already settled — a duplicate callback, or a refreshed tab.
  if (order.paymentStatus === "PAID") {
    return NextResponse.redirect(resultUrl);
  }

  // Clear any lapsed holds first, so an order whose window closed while the
  // buyer was at the bank is seen for what it is.
  await releaseExpiredReservations();

  const provider = getPaymentProvider();
  const verified = await provider.verify(order, query);

  if (!verified.ok) {
    await markOrderFailed(order.id);
    return NextResponse.redirect(resultUrl);
  }

  // The payment is real, but the goods may not be: if the hold lapsed the
  // units have been sold to someone else. Settling anyway would promise stock
  // that no longer exists, so the order is left unpaid for a human to refund.
  if (!(await orderIsPayable(order))) {
    return NextResponse.redirect(resultUrl);
  }

  const paid = await markOrderPaid(order.id, verified.reference);

  if (paid) {
    // The receipt is the buyer's proof of purchase, but a mail server having a
    // bad day must not cost them the confirmation page.
    await sendOrderConfirmation(order.id);
  }

  if (paid && !order.userId) {
    // Guest baskets live on a cookie, so they cannot be emptied from inside
    // the settlement transaction.
    const cart = await getCart();
    if (cart) {
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
      await prisma.cart.update({
        where: { id: cart.id },
        data: { couponId: null },
      });
    }
  }

  const response = NextResponse.redirect(resultUrl);
  // A guest who came back from the bank in a fresh tab still needs to be able
  // to open the receipt. The cookie goes on this response directly — writes
  // through `next/headers` do not survive a redirect.
  response.cookies.set(
    ORDER_GRANT_COOKIE,
    await orderGrantValue(order.id),
    ORDER_GRANT_OPTIONS,
  );
  return response;
}
