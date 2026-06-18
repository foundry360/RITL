import type Stripe from "stripe";
import { EMAIL_BRAND_NAME, EMAIL_COLORS } from "@/lib/email/brand-tokens";
import { escapeHtml } from "@/lib/email/escape-html";
import {
  buildEmailShell,
  emailSectionLabel,
  emailStageBadge,
} from "@/lib/email/layout";
import type { RoastifyStageEmailStage } from "@/lib/roastify/stage-emails";
import { isStripeSecretConfigured } from "@/lib/stripe/config";
import { getStripe } from "@/lib/stripe/server";
import { findPaymentIntentByRoastifyOrderId } from "@/lib/roastify/sync-stripe-metadata";

const STAGE_EMAILS_METADATA_KEY = "ritl_stage_emails_sent";
const WEBHOOK_IDS_METADATA_KEY = "ritl_webhook_ids_processed";

function parseStageList(value?: string | null): Set<string> {
  if (!value?.trim()) {
    return new Set();
  }

  return new Set(
    value
      .split(",")
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean)
  );
}

function serializeStageList(stages: Set<string>): string {
  return [...stages].sort().join(",");
}

function notificationMetadataKey(roastifyOrderId: string): string {
  return `ns_${roastifyOrderId.replaceAll(/[^a-zA-Z0-9_-]/g, "").slice(0, 32)}`;
}

async function findStripeCustomerByEmail(
  email: string
): Promise<Stripe.Customer | null> {
  if (!isStripeSecretConfigured()) {
    return null;
  }

  const stripe = getStripe();
  const customers = await stripe.customers.list({
    email: email.trim().toLowerCase(),
    limit: 1,
  });

  const customer = customers.data[0];
  if (!customer || ("deleted" in customer && customer.deleted)) {
    return null;
  }

  return customer;
}

export async function hasStageEmailBeenSent(input: {
  roastifyOrderId: string;
  stage: RoastifyStageEmailStage;
  customerEmail?: string;
  paymentIntent?: Stripe.PaymentIntent | null;
}): Promise<boolean> {
  const stageKey = input.stage.toLowerCase();
  const paymentIntent =
    input.paymentIntent ??
    (await findPaymentIntentByRoastifyOrderId(input.roastifyOrderId));

  if (paymentIntent) {
    const sentStages = parseStageList(
      paymentIntent.metadata?.[STAGE_EMAILS_METADATA_KEY]
    );
    return sentStages.has(stageKey);
  }

  if (!input.customerEmail) {
    return false;
  }

  const customer = await findStripeCustomerByEmail(input.customerEmail);
  if (!customer) {
    return false;
  }

  const sentStages = parseStageList(
    customer.metadata?.[notificationMetadataKey(input.roastifyOrderId)]
  );
  return sentStages.has(stageKey);
}

export async function markStageEmailSent(input: {
  roastifyOrderId: string;
  stage: RoastifyStageEmailStage;
  customerEmail?: string;
  webhookId?: string;
  paymentIntent?: Stripe.PaymentIntent | null;
}): Promise<void> {
  if (!isStripeSecretConfigured()) {
    return;
  }

  const stageKey = input.stage.toLowerCase();
  const stripe = getStripe();
  const paymentIntent =
    input.paymentIntent ??
    (await findPaymentIntentByRoastifyOrderId(input.roastifyOrderId));

  if (paymentIntent) {
    const metadata = paymentIntent.metadata ?? {};
    const sentStages = parseStageList(metadata[STAGE_EMAILS_METADATA_KEY]);
    sentStages.add(stageKey);

    const webhookIds = metadata[WEBHOOK_IDS_METADATA_KEY]?.trim()
      ? metadata[WEBHOOK_IDS_METADATA_KEY].split(",").filter(Boolean)
      : [];

    if (input.webhookId && !webhookIds.includes(input.webhookId)) {
      webhookIds.push(input.webhookId);
    }

    await stripe.paymentIntents.update(paymentIntent.id, {
      metadata: {
        ...metadata,
        [STAGE_EMAILS_METADATA_KEY]: serializeStageList(sentStages),
        ...(webhookIds.length > 0
          ? {
              [WEBHOOK_IDS_METADATA_KEY]: webhookIds
                .slice(-20)
                .join(","),
            }
          : {}),
      },
    });
    return;
  }

  if (!input.customerEmail) {
    return;
  }

  const customer = await findStripeCustomerByEmail(input.customerEmail);
  if (!customer) {
    return;
  }

  const metadataKey = notificationMetadataKey(input.roastifyOrderId);
  const sentStages = parseStageList(customer.metadata?.[metadataKey]);
  sentStages.add(stageKey);

  await stripe.customers.update(customer.id, {
    metadata: {
      ...customer.metadata,
      [metadataKey]: serializeStageList(sentStages),
    },
  });
}

interface EmailLayoutInput {
  headline: string;
  body: string;
  customerName: string;
  orderReference: string;
  paragraphs?: string[];
  closingLines?: string[];
  showStageBadge?: boolean;
  stageLabel?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  carrier?: string;
  trackingLayout?: "inline" | "section";
}

function buildIntroHtml(input: EmailLayoutInput): string {
  const salutation = `<p style="margin: 0 0 16px;">Hi ${escapeHtml(input.customerName)},</p>`;

  if (input.paragraphs?.length) {
    const paragraphs = input.paragraphs
      .map(
        (paragraph) =>
          `<p style="margin: 0 0 16px;">${escapeHtml(paragraph)}</p>`
      )
      .join("");
    return salutation + paragraphs;
  }

  return `<p style="margin: 0;">Hi ${escapeHtml(input.customerName)}, ${escapeHtml(input.body)}</p>`;
}

function buildClosingHtml(closingLines?: string[]): string {
  if (!closingLines?.length) {
    return "";
  }

  return closingLines
    .map((line, index) => {
      const isLast = index === closingLines.length - 1;
      const marginBottom = isLast ? "0" : "4px";
      const marginTop = line === "Best regards," ? "16px" : "0";
      return `<p style="margin: ${marginTop} 0 ${marginBottom}; font-size: 14px; line-height: 1.6; color: ${EMAIL_COLORS.textBody};">${escapeHtml(line)}</p>`;
    })
    .join("");
}

function buildTrackingHtml(input: EmailLayoutInput): string {
  if (!input.trackingNumber) {
    return "";
  }

  const trackingNumberHtml = input.trackingUrl
    ? `<a href="${escapeHtml(input.trackingUrl)}" style="color: ${EMAIL_COLORS.link}; text-decoration: underline;">${escapeHtml(input.trackingNumber)}</a>`
    : escapeHtml(input.trackingNumber);

  if (input.trackingLayout === "inline") {
    return `
      <p style="margin: 0 0 8px; font-size: 15px; line-height: 1.6; color: ${EMAIL_COLORS.textBody};">
        ${input.carrier ? `Carrier: <span style="color: ${EMAIL_COLORS.textPrimary};">${escapeHtml(input.carrier)}</span>` : ""}
      </p>
      <p style="margin: 0; font-size: 15px; line-height: 1.6; color: ${EMAIL_COLORS.textBody};">
        Tracking number: <span style="color: ${EMAIL_COLORS.textPrimary};">${trackingNumberHtml}</span>
      </p>`;
  }

  return `
    ${emailSectionLabel("Tracking", { first: true })}
    <p style="margin: 0; font-size: 15px; line-height: 1.6; color: ${EMAIL_COLORS.textBody};">
      ${trackingNumberHtml}
      ${input.carrier ? `<br /><span style="color: ${EMAIL_COLORS.textMuted};">${escapeHtml(input.carrier)}</span>` : ""}
    </p>`;
}

function buildTrackingText(input: EmailLayoutInput): string[] {
  if (!input.trackingNumber) {
    return [];
  }

  if (input.trackingLayout === "inline") {
    return [
      "",
      input.carrier ? `Carrier: ${input.carrier}` : "",
      `Tracking number: ${input.trackingNumber}`,
      input.trackingUrl ? `Track: ${input.trackingUrl}` : "",
    ].filter(Boolean);
  }

  return [
    "",
    "Tracking",
    input.trackingNumber,
    input.carrier ? `Carrier: ${input.carrier}` : "",
    input.trackingUrl ? `Track: ${input.trackingUrl}` : "",
  ].filter(Boolean);
}

export function buildTransactionalEmail(input: EmailLayoutInput): {
  text: string;
  html: string;
} {
  const bodyText = input.paragraphs?.length
    ? input.paragraphs.join("\n\n")
    : input.body;

  const textLines = [
    `Hi ${input.customerName},`,
    "",
    bodyText,
    ...buildTrackingText(input),
    "",
    `Order reference: ${input.orderReference}`,
  ];

  if (input.closingLines?.length) {
    const closingTextLines: string[] = [""];
    for (const line of input.closingLines) {
      if (line === "Best regards,") {
        closingTextLines.push("");
      }
      closingTextLines.push(line);
    }
    textLines.push(...closingTextLines);
  }

  if (input.stageLabel && input.showStageBadge !== false) {
    textLines.splice(3, 0, `Status: ${input.stageLabel}`);
  }

  if (!input.closingLines?.length) {
    textLines.push("", `— ${EMAIL_BRAND_NAME}`);
  }

  const stageHtml =
    input.stageLabel && input.showStageBadge !== false
      ? emailStageBadge(input.stageLabel)
      : "";

  const trackingHtml = buildTrackingHtml(input);
  const bodyHtml = trackingHtml || undefined;
  const closingHtml = buildClosingHtml(input.closingLines);
  const trackingTopMargin = input.trackingLayout === "inline" ? "24px" : "0";
  const footerHtml = `
    <div style="margin-top: ${bodyHtml ? "24px" : trackingTopMargin};">
      <p style="margin: 0 0 ${closingHtml ? "20px" : "0"}; font-size: 13px; color: ${EMAIL_COLORS.textLabel};">Order reference: ${escapeHtml(input.orderReference)}</p>
      ${closingHtml}
    </div>
  `;

  const html = buildEmailShell({
    headline: input.headline,
    introHtml: `${buildIntroHtml(input)}${stageHtml}`,
    bodyHtml,
    footerHtml,
  });

  return {
    text: textLines.filter(Boolean).join("\n"),
    html,
  };
}
