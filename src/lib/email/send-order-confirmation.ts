import type Stripe from "stripe";
import { Resend } from "resend";
import { formatPrice } from "@/lib/checkout/format";
import {
  getContactFromAddress,
  isContactEmailConfigured,
} from "@/lib/contact/config";
import { buildOrderConfirmationEmail } from "@/lib/email/build-order-confirmation";
import { resolveFulfillmentOrder } from "@/lib/roastify/resolve-fulfillment-order";
import { markOrderConfirmationEmailSent } from "@/lib/orders/repository";
import { getStripe } from "@/lib/stripe/server";

export async function sendOrderConfirmationEmail(
  paymentIntent: Stripe.PaymentIntent
): Promise<void> {
  if (!isContactEmailConfigured()) {
    console.warn(
      "Order confirmation email skipped: RESEND_API_KEY is not configured"
    );
    return;
  }

  const stripe = getStripe();
  const fullPaymentIntent = await stripe.paymentIntents.retrieve(paymentIntent.id);

  if (fullPaymentIntent.metadata?.ritl_confirmation_email_sent === "true") {
    return;
  }

  const order = await resolveFulfillmentOrder(fullPaymentIntent);
  if (!order) {
    console.warn(
      `Order confirmation email skipped for ${fullPaymentIntent.id}: missing shipping or line items`
    );
    return;
  }

  const recipientEmail = order.shipping.email?.trim().toLowerCase();
  if (!recipientEmail) {
    console.warn(
      `Order confirmation email skipped for ${fullPaymentIntent.id}: no customer email`
    );
    return;
  }

  const customerName = order.shipping.name.trim() || "there";
  const totalLabel = formatPrice(fullPaymentIntent.amount / 100);
  const { subject, text, html } = buildOrderConfirmationEmail({
    customerName,
    order,
    totalLabel,
    orderReference: fullPaymentIntent.id,
  });

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: getContactFromAddress(),
    to: [recipientEmail],
    subject,
    text,
    html,
  });

  if (error) {
    throw new Error(error.message);
  }

  await stripe.paymentIntents.update(fullPaymentIntent.id, {
    metadata: {
      ...fullPaymentIntent.metadata,
      ritl_confirmation_email_sent: "true",
    },
  });

  try {
    await markOrderConfirmationEmailSent(fullPaymentIntent.id);
  } catch (error) {
    console.error("Failed to mark confirmation email in orders database:", error);
  }

  console.info(
    `Order confirmation email sent for payment ${fullPaymentIntent.id} to ${recipientEmail}`
  );
}
