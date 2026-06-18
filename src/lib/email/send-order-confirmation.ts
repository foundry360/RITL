import type Stripe from "stripe";
import { Resend } from "resend";
import { formatPrice } from "@/lib/checkout/format";
import {
  getContactFromAddress,
  isContactEmailConfigured,
} from "@/lib/contact/config";
import { escapeHtml } from "@/lib/email/escape-html";
import { BRAND_NAME } from "@/lib/brand";
import { resolveFulfillmentOrder } from "@/lib/roastify/resolve-fulfillment-order";
import {
  getProduct,
  getProductPriceLabel,
  type PurchaseType,
} from "@/lib/stripe/products";
import { markOrderConfirmationEmailSent } from "@/lib/orders/repository";
import { getStripe } from "@/lib/stripe/server";

function formatPurchaseTypeLabel(purchaseType: PurchaseType): string {
  return purchaseType === "subscription" ? "Subscription" : "One-time";
}

function formatShippingAddress(
  shipping: NonNullable<Awaited<ReturnType<typeof resolveFulfillmentOrder>>>["shipping"]
): string {
  const lines = [
    shipping.name,
    shipping.line1,
    shipping.line2,
    [shipping.city, shipping.state, shipping.postalCode].filter(Boolean).join(", "),
    shipping.country,
  ].filter(Boolean);

  return lines.join("\n");
}

function buildLineItemsHtml(
  order: NonNullable<Awaited<ReturnType<typeof resolveFulfillmentOrder>>>
): string {
  const rows = order.items.map((item) => {
    const product = getProduct(item.productId);
    const name = product?.name ?? item.productId;
    const unitLabel = product
      ? getProductPriceLabel(product, item.purchaseType)
      : "";
    const cadence =
      item.purchaseType === "subscription" && product
        ? ` · every ${product.subscriptionIntervalWeeks} weeks`
        : "";

    return `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #2a2a2a; color: #f5f5f0;">
          ${escapeHtml(name)} × ${item.quantity}
          <div style="margin-top: 4px; font-size: 13px; color: #a8a8a0;">
            ${escapeHtml(formatPurchaseTypeLabel(item.purchaseType))}${escapeHtml(cadence)}
            ${unitLabel ? ` · ${escapeHtml(unitLabel)} each` : ""}
          </div>
        </td>
      </tr>`;
  });

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows.join("")}</table>`;
}

function buildOrderConfirmationEmail(input: {
  customerName: string;
  order: NonNullable<Awaited<ReturnType<typeof resolveFulfillmentOrder>>>;
  totalLabel: string;
  orderReference: string;
}): { subject: string; text: string; html: string } {
  const shippingText = formatShippingAddress(input.order.shipping);
  const itemLines = input.order.items.map((item) => {
    const product = getProduct(item.productId);
    const name = product?.name ?? item.productId;
    return `- ${name} × ${item.quantity} (${formatPurchaseTypeLabel(item.purchaseType)})`;
  });

  const subject = `Your ${BRAND_NAME} order is confirmed`;
  const text = [
    `Hi ${input.customerName},`,
    "",
    "Thank you for your order. We are preparing your ritual for fulfillment.",
    "",
    "Order summary",
    ...itemLines,
    `Total: ${input.totalLabel}`,
    "",
    "Shipping to",
    shippingText,
    "",
    `Order reference: ${input.orderReference}`,
    "",
    "We will email you as your order moves through fulfillment, including tracking when it ships.",
    "",
    `— ${BRAND_NAME}`,
  ].join("\n");

  const html = `
    <div style="margin: 0; padding: 32px 16px; background: #0f0f0f; font-family: Georgia, 'Times New Roman', serif; color: #f5f5f0;">
      <div style="max-width: 560px; margin: 0 auto; background: #171717; border: 1px solid #2a2a2a; border-radius: 8px; overflow: hidden;">
        <div style="padding: 32px 28px 20px;">
          <p style="margin: 0 0 8px; font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase; color: #a8a8a0;">${escapeHtml(BRAND_NAME)}</p>
          <h1 style="margin: 0 0 16px; font-size: 28px; font-weight: 400; line-height: 1.2;">Your order is confirmed.</h1>
          <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #d4d4cc;">
            Hi ${escapeHtml(input.customerName)}, thank you for your order. We are preparing your ritual for fulfillment.
          </p>
        </div>
        <div style="padding: 0 28px 28px;">
          <h2 style="margin: 0 0 12px; font-size: 13px; letter-spacing: 0.12em; text-transform: uppercase; color: #a8a8a0;">Order summary</h2>
          ${buildLineItemsHtml(input.order)}
          <p style="margin: 16px 0 0; font-size: 16px; color: #f5f5f0;">Total: <strong>${escapeHtml(input.totalLabel)}</strong></p>
          <h2 style="margin: 28px 0 12px; font-size: 13px; letter-spacing: 0.12em; text-transform: uppercase; color: #a8a8a0;">Shipping to</h2>
          <p style="margin: 0; white-space: pre-line; font-size: 15px; line-height: 1.6; color: #d4d4cc;">${escapeHtml(shippingText)}</p>
          <p style="margin: 24px 0 0; font-size: 13px; color: #a8a8a0;">Order reference: ${escapeHtml(input.orderReference)}</p>
          <p style="margin: 16px 0 0; font-size: 14px; line-height: 1.6; color: #a8a8a0;">
            We will email you as your order moves through fulfillment, including tracking when it ships.
          </p>
        </div>
      </div>
    </div>
  `;

  return { subject, text, html };
}

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
