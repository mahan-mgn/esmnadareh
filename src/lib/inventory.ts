import "server-only";

import { prisma } from "./prisma";
import type { Prisma } from "@/generated/prisma/client";

/**
 * Stock is held from the moment an order is placed, not from the moment it is
 * paid. Between those two points the buyer is away at the bank gateway, and
 * without a hold the last unit can be sold to somebody else in the meantime —
 * leaving a paid order with nothing to ship.
 *
 * The hold is the decrement itself: `ProductVariant.stock` drops when the order
 * is created, and a `StockReservation` row remembers how much to give back. So
 * every existing "is it in stock" query stays correct without knowing about any
 * of this. Payment consumes the reservation (the stock is already gone); a
 * failed payment, a cancellation, or the window running out gives it back.
 */

/** How long a buyer has to come back from the gateway before the hold lapses. */
export const RESERVATION_MINUTES = 20;

type Tx = Prisma.TransactionClient;

export function reservationDeadline(from = new Date()) {
  return new Date(from.getTime() + RESERVATION_MINUTES * 60_000);
}

/**
 * Takes the stock for an order's lines. Returns false — leaving the
 * transaction to be rolled back by the caller — when any line cannot be
 * covered, so a checkout never half-reserves.
 */
export async function reserveForOrder(
  tx: Tx,
  orderId: string,
  lines: { variantId: string; quantity: number }[],
  expiresAt = reservationDeadline(),
): Promise<boolean> {
  // Merge duplicate variants: two cart lines of the same variant must not be
  // checked against the same stock twice.
  const wanted = new Map<string, number>();
  for (const line of lines) {
    wanted.set(line.variantId, (wanted.get(line.variantId) ?? 0) + line.quantity);
  }

  for (const [variantId, quantity] of wanted) {
    // Conditional decrement — the database, not a prior read, decides whether
    // the units are still there.
    const taken = await tx.productVariant.updateMany({
      where: { id: variantId, stock: { gte: quantity } },
      data: { stock: { decrement: quantity } },
    });
    if (taken.count === 0) return false;

    await tx.stockReservation.create({
      data: { orderId, variantId, quantity, expiresAt },
    });
  }

  return true;
}

/** Payment went through: the units are sold, so the hold simply disappears. */
export async function consumeReservations(tx: Tx, orderId: string) {
  await tx.stockReservation.deleteMany({ where: { orderId } });
}

/**
 * Puts an order's units back on the shelf: failed payment, lapsed hold,
 * cancellation, or a refund after the goods came back.
 *
 * An unpaid order still holds a reservation, so the rows say exactly what to
 * return. A paid order consumed its reservation long ago, so the order lines
 * are the record instead. `stockReturnedAt` makes both paths idempotent —
 * moving an order CANCELLED → REFUNDED must not credit the stock twice.
 */
export async function returnStock(tx: Tx, orderId: string): Promise<boolean> {
  const order = await tx.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      stockReturnedAt: true,
      items: { select: { variantId: true, quantity: true } },
    },
  });
  if (!order || order.stockReturnedAt) return false;

  const held = await tx.stockReservation.findMany({
    where: { orderId },
    select: { id: true, variantId: true, quantity: true },
  });

  const giveBack = held.length
    ? held.map((row) => ({ variantId: row.variantId, quantity: row.quantity }))
    : order.items
        .filter((item) => item.variantId)
        .map((item) => ({
          variantId: item.variantId as string,
          quantity: item.quantity,
        }));

  if (held.length) {
    await tx.stockReservation.deleteMany({
      where: { id: { in: held.map((row) => row.id) } },
    });
  }

  for (const row of giveBack) {
    await tx.productVariant.updateMany({
      where: { id: row.variantId },
      data: { stock: { increment: row.quantity } },
    });
  }

  await tx.order.update({
    where: { id: orderId },
    data: { stockReturnedAt: new Date() },
  });

  return true;
}

/**
 * Sweeps holds whose window has closed and cancels the orders behind them.
 *
 * There is no scheduler in this project, so this runs opportunistically: on
 * checkout, when a gateway page is opened, and from `/api/inventory/sweep` for
 * a real cron. It is cheap when there is nothing to release.
 */
export async function releaseExpiredReservations() {
  const expired = await prisma.stockReservation.findMany({
    where: { expiresAt: { lte: new Date() } },
    select: { orderId: true },
    distinct: ["orderId"],
    take: 100,
  });
  if (!expired.length) return 0;

  let released = 0;
  for (const { orderId } of expired) {
    await prisma.$transaction(async (tx) => {
      // Re-check inside the transaction: the buyer may have paid between the
      // scan above and this write, and a paid order must keep its stock.
      const order = await tx.order.findUnique({
        where: { id: orderId },
        select: { id: true, paymentStatus: true, status: true },
      });
      if (!order) return;

      if (order.paymentStatus === "PAID") {
        await consumeReservations(tx, orderId);
        return;
      }

      if (!(await returnStock(tx, orderId))) return;

      // An order whose hold has lapsed can no longer be paid — say so, rather
      // than leaving it PENDING forever and taking money for missing stock.
      if (order.status === "PENDING") {
        await tx.order.update({
          where: { id: orderId },
          data: { status: "CANCELLED" },
        });
      }
      released += 1;
    });
  }

  return released;
}

/** True while the order still holds its stock and may be paid. */
export async function orderIsPayable(order: {
  id: string;
  status: string;
  paymentStatus: string;
}) {
  if (order.paymentStatus === "PAID") return false;
  if (order.status === "CANCELLED" || order.status === "REFUNDED") return false;

  const hold = await prisma.stockReservation.findFirst({
    where: { orderId: order.id, expiresAt: { gt: new Date() } },
    select: { expiresAt: true },
    orderBy: { expiresAt: "asc" },
  });

  return hold !== null;
}

/** Earliest expiry across an order's holds — drives the gateway countdown. */
export async function reservationExpiry(orderId: string) {
  const hold = await prisma.stockReservation.findFirst({
    where: { orderId },
    select: { expiresAt: true },
    orderBy: { expiresAt: "asc" },
  });
  return hold?.expiresAt ?? null;
}
