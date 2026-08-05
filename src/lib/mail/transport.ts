import "server-only";

import nodemailer from "nodemailer";

/**
 * Mail has one job here: never to break the thing that triggered it. A receipt
 * that fails to send must not turn a paid order into an error page, so every
 * send is best-effort and failures are logged, not thrown.
 *
 * With no SMTP configured the message is written to the server log instead.
 * That keeps development honest — you can read exactly what a buyer would have
 * received — without a mail server or a silent no-op that hides broken copy.
 */

export type Mail = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

let cached: nodemailer.Transporter | null | undefined;

function transport() {
  if (cached !== undefined) return cached;

  const host = process.env.SMTP_HOST?.trim();
  if (!host) {
    cached = null;
    return cached;
  }

  const port = Number(process.env.SMTP_PORT ?? 587);
  cached = nodemailer.createTransport({
    host,
    port,
    // 465 is implicit TLS; 587 upgrades with STARTTLS.
    secure: port === 465,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD ?? "" }
      : undefined,
  });

  return cached;
}

export function mailFrom() {
  return (
    process.env.MAIL_FROM?.trim() ||
    process.env.SMTP_USER?.trim() ||
    "no-reply@esmnadareh.local"
  );
}

/** Where order notifications for the shop itself go. Empty disables them. */
export function shopInbox() {
  return process.env.SHOP_EMAIL?.trim() || "";
}

export async function sendMail(mail: Mail): Promise<boolean> {
  const mailer = transport();

  if (!mailer) {
    console.info(
      `[mail] ${mail.to} — ${mail.subject}\n${mail.text}\n(no SMTP_HOST configured; message not sent)`,
    );
    return false;
  }

  try {
    await mailer.sendMail({
      from: mailFrom(),
      to: mail.to,
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
    });
    return true;
  } catch (error) {
    console.error(`[mail] failed to send "${mail.subject}" to ${mail.to}`, error);
    return false;
  }
}
