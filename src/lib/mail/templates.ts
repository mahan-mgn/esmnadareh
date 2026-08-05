import "server-only";

import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { formatPrice } from "@/lib/format";
import { pick } from "@/lib/utils";
import type { OrderStatus } from "@/generated/prisma/enums";
import type { Mail } from "./transport";

/**
 * Mail is written by hand rather than with a component library: an inbox is
 * not a browser. Tables, inline styles and no external assets — that is what
 * survives Gmail, Outlook and the Iranian webmail clients this shop's buyers
 * actually use.
 *
 * Persian mail is laid out right-to-left from the `<html dir>` down, because
 * clients that strip CSS still honour the attribute.
 */

const PAPER = "#F4F1ED";
const INK = "#0B0A0A";
const RUST = "#A8412E";
const MUTED = "#6B6560";
const LINE = "#DDD8D1";

export type MailOrder = {
  id: string;
  number: string;
  locale: string;
  email: string;
  status: OrderStatus;
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  shipFullName: string;
  shipProvince: string;
  shipCity: string;
  shipLine1: string;
  shipPostalCode: string;
  createdAt: Date;
  items: {
    nameFa: string;
    nameEn: string;
    size: string | null;
    colorFa: string | null;
    colorEn: string | null;
    unitPrice: number;
    quantity: number;
  }[];
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function siteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "http://localhost:3000"
  );
}

function layout(options: {
  locale: Locale;
  title: string;
  intro: string;
  body: string;
  cta?: { label: string; href: string };
}) {
  const rtl = options.locale === "fa";
  const dir = rtl ? "rtl" : "ltr";
  const align = rtl ? "right" : "left";
  const font = rtl
    ? "Tahoma, 'Segoe UI', sans-serif"
    : "'Helvetica Neue', Helvetica, Arial, sans-serif";

  return `<!doctype html>
<html dir="${dir}" lang="${options.locale}">
<body style="margin:0;padding:32px 16px;background:${PAPER};font-family:${font};color:${INK};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#fff;border:1px solid ${LINE};">
    <tr>
      <td style="background:${INK};padding:20px 24px;text-align:${align};">
        <span style="color:${PAPER};font-size:13px;letter-spacing:0.18em;text-transform:uppercase;">ESM NADAREH</span>
      </td>
    </tr>
    <tr>
      <td style="padding:32px 24px;text-align:${align};">
        <h1 style="margin:0 0 12px;font-size:20px;font-weight:500;">${escapeHtml(options.title)}</h1>
        <p style="margin:0 0 24px;font-size:14px;line-height:1.9;color:${MUTED};">${escapeHtml(options.intro)}</p>
        ${options.body}
        ${
          options.cta
            ? `<p style="margin:28px 0 0;"><a href="${options.cta.href}" style="display:inline-block;background:${RUST};color:#fff;padding:12px 28px;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;text-decoration:none;">${escapeHtml(options.cta.label)}</a></p>`
            : ""
        }
      </td>
    </tr>
    <tr>
      <td style="border-top:1px solid ${LINE};padding:18px 24px;text-align:${align};font-size:11px;color:${MUTED};">
        ${escapeHtml(siteUrl().replace(/^https?:\/\//, ""))}
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function itemsTable(order: MailOrder, locale: Locale) {
  const dict = getDictionary(locale);
  const align = locale === "fa" ? "right" : "left";
  const end = locale === "fa" ? "left" : "right";

  const rows = order.items
    .map((item) => {
      const name = pick(locale, item.nameFa, item.nameEn);
      const variant = [pick(locale, item.colorFa, item.colorEn), item.size]
        .filter(Boolean)
        .join(" · ");

      return `<tr>
        <td style="padding:10px 0;border-bottom:1px solid ${LINE};text-align:${align};font-size:13px;">
          ${escapeHtml(name)}
          ${variant ? `<br><span style="color:${MUTED};font-size:11px;">${escapeHtml(variant)}</span>` : ""}
          <span style="color:${MUTED};font-size:11px;"> × ${item.quantity}</span>
        </td>
        <td style="padding:10px 0;border-bottom:1px solid ${LINE};text-align:${end};font-size:13px;white-space:nowrap;">
          ${escapeHtml(formatPrice(item.unitPrice * item.quantity, locale))}
        </td>
      </tr>`;
    })
    .join("");

  const totalRow = (label: string, value: string, strong = false) =>
    `<tr>
      <td style="padding:6px 0;text-align:${align};font-size:13px;${strong ? "font-weight:600;" : `color:${MUTED};`}">${escapeHtml(label)}</td>
      <td style="padding:6px 0;text-align:${end};font-size:13px;white-space:nowrap;${strong ? "font-weight:600;" : ""}">${escapeHtml(value)}</td>
    </tr>`;

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    ${rows}
    <tr><td colspan="2" style="height:12px;"></td></tr>
    ${totalRow(dict.common.subtotal, formatPrice(order.subtotal, locale))}
    ${order.discount > 0 ? totalRow(dict.common.discount, `−${formatPrice(order.discount, locale)}`) : ""}
    ${totalRow(dict.common.shipping, order.shipping === 0 ? dict.common.free : formatPrice(order.shipping, locale))}
    ${totalRow(dict.common.total, formatPrice(order.total, locale), true)}
  </table>

  <p style="margin:24px 0 0;font-size:12px;line-height:1.9;color:${MUTED};text-align:${align};">
    ${escapeHtml(dict.checkout.shippingAddress)}<br>
    <span style="color:${INK};">${escapeHtml(order.shipFullName)} — ${escapeHtml(order.shipProvince)}، ${escapeHtml(order.shipCity)}، ${escapeHtml(order.shipLine1)} (${escapeHtml(order.shipPostalCode)})</span>
  </p>`;
}

function plainText(order: MailOrder, locale: Locale, heading: string) {
  const dict = getDictionary(locale);
  const lines = [
    heading,
    `${dict.checkout.orderNumber}: ${order.number}`,
    "",
    ...order.items.map((item) => {
      const name = pick(locale, item.nameFa, item.nameEn);
      return `- ${name} × ${item.quantity} — ${formatPrice(item.unitPrice * item.quantity, locale)}`;
    }),
    "",
    `${dict.common.total}: ${formatPrice(order.total, locale)}`,
    `${siteUrl()}/${locale}/checkout/result/${order.id}`,
  ];
  return lines.join("\n");
}

export function orderConfirmationMail(order: MailOrder): Mail {
  const locale = (order.locale === "en" ? "en" : "fa") as Locale;
  const dict = getDictionary(locale);
  const title = dict.mail.orderPaidTitle;

  return {
    to: order.email,
    subject: `${title} — ${order.number}`,
    html: layout({
      locale,
      title,
      intro: dict.mail.orderPaidIntro,
      body: itemsTable(order, locale),
      cta: {
        label: dict.checkout.trackOrder,
        href: `${siteUrl()}/${locale}/checkout/result/${order.id}`,
      },
    }),
    text: plainText(order, locale, title),
  };
}

export function orderStatusMail(order: MailOrder): Mail {
  const locale = (order.locale === "en" ? "en" : "fa") as Locale;
  const dict = getDictionary(locale);
  const statusLabel = dict.orderStatus[order.status];
  const title = dict.mail.statusTitle.replace("{status}", statusLabel);

  return {
    to: order.email,
    subject: `${title} — ${order.number}`,
    html: layout({
      locale,
      title,
      intro: dict.mail.statusIntro.replace("{status}", statusLabel),
      body: itemsTable(order, locale),
      cta: {
        label: dict.checkout.trackOrder,
        href: `${siteUrl()}/${locale}/checkout/result/${order.id}`,
      },
    }),
    text: plainText(order, locale, title),
  };
}

/** Sent to the shop, not the buyer — always in the shop's own language. */
export function newOrderMail(order: MailOrder, to: string): Mail {
  const locale: Locale = "fa";
  const dict = getDictionary(locale);
  const title = dict.mail.shopNewOrderTitle;

  return {
    to,
    subject: `${title} — ${order.number}`,
    html: layout({
      locale,
      title,
      intro: `${order.shipFullName} · ${order.email}`,
      body: itemsTable(order, locale),
      cta: {
        label: dict.admin.orders,
        href: `${siteUrl()}/${locale}/admin/orders`,
      },
    }),
    text: plainText(order, locale, title),
  };
}
