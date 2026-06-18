import type Stripe from "stripe";
import { escapeHtml } from "@/lib/email/escape-html";
import { BRAND_NAME } from "@/lib/brand";
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
}): Promise<boolean> {
  const stageKey = input.stage.toLowerCase();
  const paymentIntent = await findPaymentIntentByRoastifyOrderId(
    input.roastifyOrderId
  );

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
}): Promise<void> {
  if (!isStripeSecretConfigured()) {
    return;
  }

  const stageKey = input.stage.toLowerCase();
  const stripe = getStripe();
  const paymentIntent = await findPaymentIntentByRoastifyOrderId(
    input.roastifyOrderId
  );

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
  stageLabel?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  carrier?: string;
}

export function buildTransactionalEmail(input: EmailLayoutInput): {
  text: string;
  html: string;
} {
  const textLines = [
    `Hi ${input.customerName},`,
    "",
    input.body,
    "",
    `Order reference: ${input.orderReference}`,
  ];

  if (input.stageLabel) {
    textLines.splice(3, 0, `Status: ${input.stageLabel}`);
  }

  if (input.trackingNumber) {
    textLines.push(
      "",
      "Tracking",
      input.trackingNumber,
      input.carrier ? `Carrier: ${input.carrier}` : "",
      input.trackingUrl ? `Track: ${input.trackingUrl}` : ""
    );
  }

  textLines.push("", `— ${BRAND_NAME}`);

  const trackingHtml = input.trackingNumber
    ? `
      <h2 style="margin: 28px 0 12px; font-size: 13px; letter-spacing: 0.12em; text-transform: uppercase; color: #a8a8a0;">Tracking</h2>
      <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #d4d4cc;">
        ${
          input.trackingUrl
            ? `<a href="${escapeHtml(input.trackingUrl)}" style="color: #edeff3;">${escapeHtml(input.trackingNumber)}</a>`
            : escapeHtml(input.trackingNumber)
        }
        ${input.carrier ? `<br /><span style="color: #a8a8a0;">${escapeHtml(input.carrier)}</span>` : ""}
      </p>`
    : "";

  const stageHtml = input.stageLabel
    ? `<p style="margin: 16px 0 0; font-size: 13px; letter-spacing: 0.12em; text-transform: uppercase; color: #a8a8a0;">${escapeHtml(input.stageLabel)}</p>`
    : "";

  const html = `
    <div style="margin: 0; padding: 32px 16px; background: #0f0f0f; font-family: Georgia, 'Times New Roman', serif; color: #f5f5f0;">
      <div style="max-width: 560px; margin: 0 auto; background: #171717; border: 1px solid #2a2a2a; border-radius: 8px; overflow: hidden;">
        <div style="padding: 32px 28px 20px;">
          <p style="margin: 0 0 8px; font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase; color: #a8a8a0;">${escapeHtml(BRAND_NAME)}</p>
          <h1 style="margin: 0 0 16px; font-size: 28px; font-weight: 400; line-height: 1.2;">${escapeHtml(input.headline)}</h1>
          <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #d4d4cc;">
            Hi ${escapeHtml(input.customerName)}, ${escapeHtml(input.body)}
          </p>
          ${stageHtml}
        </div>
        <div style="padding: 0 28px 28px;">
          ${trackingHtml}
          <p style="margin: 24px 0 0; font-size: 13px; color: #a8a8a0;">Order reference: ${escapeHtml(input.orderReference)}</p>
        </div>
      </div>
    </div>
  `;

  return {
    text: textLines.filter(Boolean).join("\n"),
    html,
  };
}
