import { EMAIL_BRAND_NAME, EMAIL_COLORS, getEmailAppUrl } from "@/lib/email/brand-tokens";
import { escapeHtml } from "@/lib/email/escape-html";
import { buildEmailShell, emailSectionLabel } from "@/lib/email/layout";
import type { AbandonedCheckoutItem } from "@/lib/abandoned-checkout/types";
import {
  getProduct,
  getProductPriceLabel,
  type PurchaseType,
} from "@/lib/stripe/products";

function formatPurchaseTypeLabel(purchaseType: PurchaseType): string {
  return purchaseType === "subscription" ? "Subscription" : "One-time";
}

function buildLineItemsHtml(items: AbandonedCheckoutItem[]): string {
  const rows = items.map((item) => {
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

export function buildAbandonedCheckoutEmail(input: {
  items: AbandonedCheckoutItem[];
  totalLabel: string;
  checkoutUrl: string;
}): { subject: string; text: string; html: string } {
  const itemLines = input.items.map((item) => {
    const product = getProduct(item.productId);
    const name = product?.name ?? item.productId;
    return `- ${name} × ${item.quantity} (${formatPurchaseTypeLabel(item.purchaseType)})`;
  });

  const subject = `Complete your ${EMAIL_BRAND_NAME} order`;
  const text = [
    "Hi there,",
    "",
    `You started an order with ${EMAIL_BRAND_NAME} but didn't finish checkout.`,
    "",
    "Your cart",
    ...itemLines,
    `Total: ${input.totalLabel}`,
    "",
    `Complete your order: ${input.checkoutUrl}`,
    "",
    "If you've already completed your purchase, you can ignore this email.",
    "",
    "Best regards,",
    EMAIL_BRAND_NAME,
  ].join("\n");

  const bodyHtml = `
    ${emailSectionLabel("Your cart", { first: true })}
    ${buildLineItemsHtml(input.items)}
    <p style="margin: 16px 0 0; font-size: 16px; color: ${EMAIL_COLORS.textPrimary};">Total: <strong>${escapeHtml(input.totalLabel)}</strong></p>
    <p style="margin: 24px 0 0;">
      <a href="${escapeHtml(input.checkoutUrl)}" style="display: inline-block; padding: 12px 20px; border-radius: 8px; background: ${EMAIL_COLORS.pageBg}; border: 1px solid ${EMAIL_COLORS.cardBorder}; color: ${EMAIL_COLORS.textPrimary}; font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; text-decoration: none;">
        Complete your order
      </a>
    </p>
  `;

  const footerHtml = `
    <p style="margin: 24px 0 0; font-size: 14px; line-height: 1.6; color: ${EMAIL_COLORS.textMuted};">
      If you've already completed your purchase, you can ignore this email.
    </p>
    <p style="margin: 16px 0 4px; font-size: 14px; line-height: 1.6; color: ${EMAIL_COLORS.textBody};">Best regards,</p>
    <p style="margin: 0; font-size: 14px; line-height: 1.6; color: ${EMAIL_COLORS.textBody};">${escapeHtml(EMAIL_BRAND_NAME)}</p>
  `;

  const html = buildEmailShell({
    headline: "Your ritual is waiting.",
    introHtml:
      "Hi there, you started an order but didn't finish checkout. Your selections are still available when you're ready.",
    bodyHtml,
    footerHtml,
  });

  return { subject, text, html };
}

export function getAbandonedCheckoutUrl(): string {
  return `${getEmailAppUrl()}/checkout`;
}
