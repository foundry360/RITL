import { Resend } from "resend";
import type { AbandonedCheckoutRecord } from "@/lib/abandoned-checkout/types";
import {
  buildAbandonedCheckoutEmail,
  getAbandonedCheckoutUrl,
} from "@/lib/email/build-abandoned-checkout";
import { formatPrice } from "@/lib/checkout/format";
import {
  getContactFromAddress,
  isContactEmailConfigured,
} from "@/lib/contact/config";

export async function sendAbandonedCheckoutEmail(
  record: AbandonedCheckoutRecord
): Promise<void> {
  if (!isContactEmailConfigured()) {
    console.warn(
      "Abandoned checkout email skipped: RESEND_API_KEY is not configured"
    );
    return;
  }

  if (!record.items.length) {
    return;
  }

  const totalLabel = formatPrice(record.amountCents / 100);
  const { subject, text, html } = buildAbandonedCheckoutEmail({
    items: record.items,
    totalLabel,
    checkoutUrl: getAbandonedCheckoutUrl(),
  });

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: getContactFromAddress(),
    to: record.email,
    subject,
    text,
    html,
  });

  if (error) {
    throw new Error(error.message);
  }
}
