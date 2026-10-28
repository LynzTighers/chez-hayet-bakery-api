// Sends email through any SMTP server, configured with environment variables:
//   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS  - the SMTP server (e.g. Resend)
//   MAIL_FROM      - who the email is from, e.g. "Chez Hayet Bakery <orders@chezhayetoh.com>"
//   MAIL_REPLY_TO  - where customer replies go (Hayet's own inbox)
// Locally, Docker's Mailpit catches every email instead (see compose.yaml).
import nodemailer, { type Transporter } from "nodemailer";

let transporter: Transporter | undefined;

export class EmailNotConfiguredError extends Error {}

function getTransporter(): Transporter {
  const host = process.env.SMTP_HOST;
  if (!host) throw new EmailNotConfiguredError("SMTP_HOST is not set");

  // Created once and reused, so repeat emails don't reconnect from scratch.
  transporter ??= nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT) || 587,
    // Port 465 uses TLS from the start; other ports upgrade with STARTTLS.
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });
  return transporter;
}

export async function sendEmail(message: { to: string; subject: string; text: string; html: string }) {
  const from = process.env.MAIL_FROM;
  if (!from) throw new EmailNotConfiguredError("MAIL_FROM is not set");

  await getTransporter().sendMail({
    from,
    replyTo: process.env.MAIL_REPLY_TO || undefined,
    ...message,
  });
}
