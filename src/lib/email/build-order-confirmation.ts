import { EMAIL_BRAND_NAME, EMAIL_COLORS } from "@/lib/email/brand-tokens";
import { escapeHtml } from "@/lib/email/escape-html";
import { buildEmailShell, emailSectionLabel } from "@/lib/email/layout";
import type { FulfillmentOrder } from "@/lib/fulfillment/types";
import {
  getProduct,
  getProductPriceLabel,
  type PurchaseType,
} from "@/lib/stripe/products";

function formatPurchaseTypeLabel(purchaseType: PurchaseType): string {
  return purchaseType === "subscription" ? "Subscription" : "One-time";
}

function formatShippingAddress(shipping: FulfillmentOrder["shipping"]): string {
  const lines = [
    shipping.name,
    shipping.line1,
    shipping.line2,
    [shipping.city, shipping.state, shipping.postalCode].filter(Boolean).join(", "),
    shipping.country,
  ].filter(Boolean);

  return lines.join("\n");
}

function buildLineItemsHtml(order: FulfillmentOrder): string {
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
        <td style="padding: 12px 0; color: ${EMAIL_COLORS.textPrimary};">
          ${escapeHtml(name)} × ${item.quantity}
          <div style="margin-top: 4px; font-size: 13px; color: ${EMAIL_COLORS.textMuted};">
            ${escapeHtml(formatPurchaseTypeLabel(item.purchaseType))}${escapeHtml(cadence)}
            ${unitLabel ? ` · ${escapeHtml(unitLabel)} each` : ""}
          </div>
        </td>
      </tr>`;
  });

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows.join("")}</table>`;
}

export function buildOrderConfirmationEmail(input: {
  customerName: string;
  order: FulfillmentOrder;
  totalLabel: string;
  orderReference: string;
}): { subject: string; text: string; html: string } {
  const shippingText = formatShippingAddress(input.order.shipping);
  const itemLines = input.order.items.map((item) => {
    const product = getProduct(item.productId);
    const name = product?.name ?? item.productId;
    return `- ${name} × ${item.quantity} (${formatPurchaseTypeLabel(item.purchaseType)})`;
  });

  const subject = `Your ${EMAIL_BRAND_NAME} order is confirmed`;
  const text = [
    `Hi ${input.customerName},`,
    "",
    `Thank you for your order. We are preparing your ${EMAIL_BRAND_NAME} order for fulfillment.`,
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
    "Best regards,",
    `${EMAIL_BRAND_NAME} Fulfillment`,
  ].join("\n");

  const bodyHtml = `
    ${emailSectionLabel("Order summary", { first: true })}
    ${buildLineItemsHtml(input.order)}
    <p style="margin: 16px 0 0; font-size: 16px; color: ${EMAIL_COLORS.textPrimary};">Total: <strong>${escapeHtml(input.totalLabel)}</strong></p>
    ${emailSectionLabel("Shipping to")}
    <p style="margin: 0; white-space: pre-line; font-size: 15px; line-height: 1.6; color: ${EMAIL_COLORS.textBody};">${escapeHtml(shippingText)}</p>
  `;

  const footerHtml = `
    <p style="margin: 24px 0 0; font-size: 13px; color: ${EMAIL_COLORS.textLabel};">Order reference: ${escapeHtml(input.orderReference)}</p>
    <p style="margin: 16px 0 0; font-size: 14px; line-height: 1.6; color: ${EMAIL_COLORS.textMuted};">
      We will email you as your order moves through fulfillment, including tracking when it ships.
    </p>
    <p style="margin: 16px 0 4px; font-size: 14px; line-height: 1.6; color: ${EMAIL_COLORS.textBody};">Best regards,</p>
    <p style="margin: 0; font-size: 14px; line-height: 1.6; color: ${EMAIL_COLORS.textBody};">${escapeHtml(EMAIL_BRAND_NAME)} Fulfillment</p>
  `;

  const html = buildEmailShell({
    headline: "Your order is confirmed.",
    introHtml: `Hi ${escapeHtml(input.customerName)}, thank you for your order. We are preparing your ${escapeHtml(EMAIL_BRAND_NAME)} order for fulfillment.`,
    bodyHtml,
    footerHtml,
  });

  return { subject, text, html };
}
