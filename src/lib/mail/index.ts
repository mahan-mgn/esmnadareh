import "server-only";

import { prisma } from "@/lib/prisma";
import {
  newOrderMail,
  orderConfirmationMail,
  orderStatusMail,
  type MailOrder,
} from "./templates";
import { sendMail, shopInbox } from "./transport";

export { sendMail } from "./transport";

const orderSelect = {
  id: true,
  number: true,
  locale: true,
  email: true,
  status: true,
  subtotal: true,
  shipping: true,
  discount: true,
  total: true,
  shipFullName: true,
  shipProvince: true,
  shipCity: true,
  shipLine1: true,
  shipPostalCode: true,
  createdAt: true,
  items: {
    select: {
      nameFa: true,
      nameEn: true,
      size: true,
      colorFa: true,
      colorEn: true,
      unitPrice: true,
      quantity: true,
    },
  },
} as const;

async function loadOrder(orderId: string): Promise<MailOrder | null> {
  return prisma.order.findUnique({
    where: { id: orderId },
    select: orderSelect,
  });
}

/**
 * Receipt to the buyer, plus a nudge to the shop.
 *
 * Called from the payment callback, where a thrown error would strand a buyer
 * who has already been charged — so nothing in here is allowed to escape.
 */
export async function sendOrderConfirmation(orderId: string) {
  try {
    const order = await loadOrder(orderId);
    if (!order) return;

    await sendMail(orderConfirmationMail(order));

    const inbox = shopInbox();
    if (inbox) await sendMail(newOrderMail(order, inbox));
  } catch (error) {
    console.error("[mail] order confirmation failed", error);
  }
}

/** Told when an admin moves the order along — shipped, delivered, refunded. */
export async function sendOrderStatusUpdate(orderId: string) {
  try {
    const order = await loadOrder(orderId);
    if (!order) return;

    await sendMail(orderStatusMail(order));
  } catch (error) {
    console.error("[mail] status update failed", error);
  }
}
