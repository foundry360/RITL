import { buildAbandonedCheckoutEmail, getAbandonedCheckoutUrl } from "@/lib/email/build-abandoned-checkout";
import { buildOrderConfirmationEmail } from "@/lib/email/build-order-confirmation";
import { buildTransactionalEmail } from "@/lib/email/order-notifications";
import {
  formatStageLabel,
  getStageEmailCopy,
  ROASTIFY_STAGE_EMAIL_STAGES,
  type RoastifyStageEmailStage,
} from "@/lib/roastify/stage-emails";

const SAMPLE_ORDER = {
  stripePaymentIntentId: "pi_preview_123",
  stripeCustomerId: "cus_preview",
  items: [
    { productId: "focus-coffee" as const, quantity: 1, purchaseType: "one-time" as const },
    { productId: "matcha" as const, quantity: 1, purchaseType: "subscription" as const },
  ],
  shipping: {
    name: "Alex Morgan",
    line1: "3046 Oatland Ct",
    city: "Orange Park",
    state: "FL",
    postalCode: "32065",
    country: "US",
    email: "customer@example.com",
  },
};

export const EMAIL_PREVIEW_TEMPLATES = [
  { id: "confirmation", label: "Order confirmation" },
  { id: "abandoned-checkout", label: "Abandoned checkout" },
  ...ROASTIFY_STAGE_EMAIL_STAGES.map((stage) => ({
    id: stage,
    label: `Stage: ${formatStageLabel(stage)}`,
  })),
] as const;

export type EmailPreviewTemplateId =
  | "confirmation"
  | "abandoned-checkout"
  | RoastifyStageEmailStage;

export function renderEmailPreview(templateId: EmailPreviewTemplateId): {
  subject: string;
  html: string;
} {
  if (templateId === "confirmation") {
    const email = buildOrderConfirmationEmail({
      customerName: "Alex",
      order: SAMPLE_ORDER,
      totalLabel: "$89.00",
      orderReference: "pi_preview_123",
    });
    return { subject: email.subject, html: email.html };
  }

  if (templateId === "abandoned-checkout") {
    const email = buildAbandonedCheckoutEmail({
      items: SAMPLE_ORDER.items,
      totalLabel: "$89.00",
      checkoutUrl: getAbandonedCheckoutUrl(),
    });
    return { subject: email.subject, html: email.html };
  }

  const copy = getStageEmailCopy(templateId);
  const email = buildTransactionalEmail({
    headline: copy.headline,
    body: copy.body,
    paragraphs: copy.paragraphs,
    closingLines: copy.closingLines,
    showStageBadge: copy.showStageBadge,
    trackingLayout: copy.trackingLayout,
    customerName: "Alex",
    orderReference: "pi_preview_123",
    stageLabel: formatStageLabel(templateId),
    trackingNumber:
      templateId === "shipped" || templateId === "tracking"
        ? "TEST-9401234567890"
        : undefined,
    trackingUrl:
      templateId === "shipped" || templateId === "tracking"
        ? "https://tools.usps.com/go/TrackConfirmAction?tLabels=TEST-9401234567890"
        : undefined,
    carrier: templateId === "shipped" || templateId === "tracking" ? "USPS" : undefined,
  });

  return { subject: copy.subject, html: email.html };
}
