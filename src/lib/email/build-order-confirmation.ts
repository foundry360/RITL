import { formatPrice } from "@/lib/checkout/format";
import { EMAIL_BRAND_NAME, EMAIL_COLORS } from "@/lib/email/brand-tokens";
import { escapeHtml } from "@/lib/email/escape-html";
import { buildEmailShell, emailSectionLabel } from "@/lib/email/layout";
import type { FulfillmentOrder } from "@/lib/fulfillment/types";
import {
  getPriceLabel,
  getUnitPrice,
  type ProductPricingMap,
} from "@/lib/stripe/pricing";
import {
  getProduct,
  type ProductId,
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

function formatLineItemPriceLabel(
  pricing: ProductPricingMap,
  productId: ProductId,
  purchaseType: PurchaseType,
  quantity: number,
  subscriptionIntervalWeeks?: number
): string {
  const label = getPriceLabel(pricing, productId, purchaseType);

  if (purchaseType === "subscription" && subscriptionIntervalWeeks) {
    return `${label} every ${subscriptionIntervalWeeks} weeks`;
  }

  if (quantity > 1) {
    return `${label} each`;
  }

  return label;
}

function computeSubtotalCents(
  order: FulfillmentOrder,
  pricing: ProductPricingMap
): number {
  return order.items.reduce((sum, item) => {
    const unitCents = Math.round(
      getUnitPrice(pricing, item.productId, item.purchaseType) * 100
    );
    return sum + unitCents * item.quantity;
  }, 0);
}

function buildLineItemsHtml(
  order: FulfillmentOrder,
  pricing: ProductPricingMap
): string {
  const rows = order.items.map((item) => {
    const product = getProduct(item.productId);
    const name = product?.name ?? item.productId;
    const priceLabel = formatLineItemPriceLabel(
      pricing,
      item.productId,
      item.purchaseType,
      item.quantity,
      product?.subscriptionIntervalWeeks
    );

    return `
      <tr>
        <td style="padding: 12px 0; color: ${EMAIL_COLORS.textPrimary};">
          ${escapeHtml(name)} × ${item.quantity}
          <div style="margin-top: 4px; font-size: 13px; color: ${EMAIL_COLORS.textMuted};">
            ${escapeHtml(formatPurchaseTypeLabel(item.purchaseType))} · ${escapeHtml(priceLabel)}
          </div>
        </td>
      </tr>`;
  });

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows.join("")}</table>`;
}

function buildTotalsHtml(
  subtotalLabel: string | null,
  taxLabel: string | null,
  totalLabel: string
): string {
  if (!subtotalLabel) {
    return `<p style="margin: 16px 0 0; font-size: 16px; color: ${EMAIL_COLORS.textPrimary};">Total: <strong>${escapeHtml(totalLabel)}</strong></p>`;
  }

  const taxRow = taxLabel
    ? `<p style="margin: 8px 0 0; font-size: 15px; color: ${EMAIL_COLORS.textBody};">Tax: ${escapeHtml(taxLabel)}</p>`
    : "";

  return `
    <p style="margin: 16px 0 0; font-size: 15px; color: ${EMAIL_COLORS.textBody};">Subtotal: ${escapeHtml(subtotalLabel)}</p>
    ${taxRow}
    <p style="margin: 8px 0 0; font-size: 16px; color: ${EMAIL_COLORS.textPrimary};">Total: <strong>${escapeHtml(totalLabel)}</strong></p>`;
}

export function buildOrderConfirmationEmail(input: {
  customerName: string;
  order: FulfillmentOrder;
  pricing: ProductPricingMap;
  totalCents: number;
  orderReference: string;
}): { subject: string; text: string; html: string } {
  const shippingText = formatShippingAddress(input.order.shipping);
  const totalLabel = formatPrice(input.totalCents / 100);
  const subtotalCents = computeSubtotalCents(input.order, input.pricing);
  const taxCents = input.totalCents - subtotalCents;
  const subtotalLabel =
    subtotalCents > 0 && taxCents > 0 ? formatPrice(subtotalCents / 100) : null;
  const taxLabel = taxCents > 0 ? formatPrice(taxCents / 100) : null;

  const itemLines = input.order.items.map((item) => {
    const product = getProduct(item.productId);
    const name = product?.name ?? item.productId;
    const priceLabel = formatLineItemPriceLabel(
      input.pricing,
      item.productId,
      item.purchaseType,
      item.quantity,
      product?.subscriptionIntervalWeeks
    );
    return `- ${name} × ${item.quantity} (${formatPurchaseTypeLabel(item.purchaseType)}) — ${priceLabel}`;
  });

  const subject = `Your ${EMAIL_BRAND_NAME} order is confirmed`;
  const text = [
    `Hi ${input.customerName},`,
    "",
    `Thank you for your order. We are preparing your ${EMAIL_BRAND_NAME} order for fulfillment.`,
    "",
    "Order summary",
    ...itemLines,
    ...(subtotalLabel ? [`Subtotal: ${subtotalLabel}`] : []),
    ...(taxLabel ? [`Tax: ${taxLabel}`] : []),
    `Total: ${totalLabel}`,
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
    ${buildLineItemsHtml(input.order, input.pricing)}
    ${buildTotalsHtml(subtotalLabel, taxLabel, totalLabel)}
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
