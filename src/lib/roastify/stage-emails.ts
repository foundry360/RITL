import { BRAND_NAME } from "@/lib/brand";

export const ROASTIFY_STAGE_EMAIL_STAGES = [
  "created",
  "picked",
  "printed",
  "packaged",
  "shipped",
  "canceled",
  "tracking",
] as const;

export type RoastifyStageEmailStage = (typeof ROASTIFY_STAGE_EMAIL_STAGES)[number];

export const ROASTIFY_WEBHOOK_EVENT_TYPES = [
  "fulfillment.created",
  "fulfillment.picked",
  "fulfillment.printed",
  "fulfillment.packaged",
  "fulfillment.shipped",
  "fulfillment.canceled",
  "fulfillment.cancelation_requested",
  "fulfillment.declined",
  "tracking.updated",
] as const;

export type RoastifyWebhookEventType = (typeof ROASTIFY_WEBHOOK_EVENT_TYPES)[number];

const WEBHOOK_EVENT_TO_STAGE: Partial<
  Record<RoastifyWebhookEventType, RoastifyStageEmailStage>
> = {
  "fulfillment.created": "created",
  "fulfillment.picked": "picked",
  "fulfillment.printed": "printed",
  "fulfillment.packaged": "packaged",
  "fulfillment.shipped": "shipped",
  "fulfillment.canceled": "canceled",
  "tracking.updated": "tracking",
};

export type StageEmailCopy = {
  subject: string;
  headline: string;
  body: string;
  paragraphs?: string[];
  closingLines?: string[];
  showStageBadge?: boolean;
  trackingLayout?: "inline" | "section";
};

const STAGE_COPY: Record<RoastifyStageEmailStage, StageEmailCopy> = {
  created: {
    subject: "Your order is being prepared",
    headline: "Your Order is Being Prepared",
    body: "Thanks for your order — we've got it. Your order has been received and is now in our system. Our team will begin preparing it shortly. We'll keep you updated as it moves through fulfillment.",
    paragraphs: [
      "Thanks for your order — we've got it.",
      "Your order has been received and is now in our system. Our team will begin preparing it shortly.",
      "We'll keep you updated as it moves through fulfillment.",
    ],
    closingLines: [
      "If you have any questions, feel free to reach out.",
      "Best regards,",
      `${BRAND_NAME} Fulfillment`,
    ],
    showStageBadge: false,
  },
  picked: {
    subject: "Your order has been picked",
    headline: "Your Order Has Been Picked",
    body: "Your order is moving along. All items have been picked and are now being prepared for the next step in fulfillment. We'll keep you updated as it progresses.",
    paragraphs: [
      "Your order is moving along.",
      "All items have been picked and are now being prepared for the next step in fulfillment.",
      "We'll keep you updated as it progresses.",
    ],
    closingLines: [
      "If you have any questions, feel free to reach out.",
      "Best regards,",
      `${BRAND_NAME} Fulfillment`,
    ],
    showStageBadge: false,
  },
  printed: {
    subject: "Your order is ready to ship",
    headline: "Your Order is Ready to Ship",
    body: "Your order is one step closer. The shipping label has been created, and your order is now being prepared for dispatch. We'll notify you as soon as it's on the way.",
    paragraphs: [
      "Your order is one step closer.",
      "The shipping label has been created, and your order is now being prepared for dispatch.",
      "We'll notify you as soon as it's on the way.",
    ],
    closingLines: [
      "If you have any questions, feel free to reach out.",
      "Best regards,",
      `${BRAND_NAME} Fulfillment`,
    ],
    showStageBadge: false,
  },
  packaged: {
    subject: "Your order is packed",
    headline: "Your Order is Packed",
    body: "Your order is packed and ready. Everything has been carefully prepared and is now set for shipment. It will be on its way shortly.",
    paragraphs: [
      "Your order is packed and ready.",
      "Everything has been carefully prepared and is now set for shipment. It will be on its way shortly.",
    ],
    closingLines: [
      "We'll notify you as soon as it ships.",
      "Best regards,",
      `${BRAND_NAME} Fulfillment`,
    ],
    showStageBadge: false,
  },
  shipped: {
    subject: "Your order has shipped",
    headline: "Your Order is On Its Way",
    body: "Your order is on its way. Your package has shipped, and you can track its journey below.",
    paragraphs: [
      "Your order is on its way.",
      "Your package has shipped, and you can track its journey below.",
    ],
    closingLines: [
      "We'll see you soon.",
      "Best regards,",
      `${BRAND_NAME} Fulfillment`,
    ],
    showStageBadge: false,
    trackingLayout: "inline",
  },
  canceled: {
    subject: "Your order has been canceled",
    headline: "Your Order Has Been Canceled",
    body: "Your order has been canceled. If this was unexpected or you need assistance, feel free to reply to this email — we're here to help.",
    paragraphs: [
      "Your order has been canceled.",
      "If this was unexpected or you need assistance, feel free to reply to this email — we're here to help.",
    ],
    closingLines: ["Best regards,", `${BRAND_NAME} Fulfillment`],
    showStageBadge: false,
  },
  tracking: {
    subject: "Update on your shipment",
    headline: "There's an Update on Your Shipment",
    body: "There's an update on your shipment. Your tracking details have been updated — you can follow the latest status below.",
    paragraphs: [
      "There's an update on your shipment.",
      "Your tracking details have been updated — you can follow the latest status below.",
    ],
    closingLines: [
      "We'll continue to keep you updated along the way.",
      "Best regards,",
      `${BRAND_NAME} Fulfillment`,
    ],
    showStageBadge: false,
    trackingLayout: "inline",
  },
};

export function mapRoastifyStatusToStage(
  status?: string | null
): RoastifyStageEmailStage | null {
  const normalized = status?.trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  const statusToStage: Record<string, RoastifyStageEmailStage> = {
    created: "created",
    picked: "picked",
    printed: "printed",
    packaged: "packaged",
    shipped: "shipped",
    canceled: "canceled",
    cancelled: "canceled",
  };

  return statusToStage[normalized] ?? null;
}

export function resolveStageFromWebhookEvent(
  eventType: string
): RoastifyStageEmailStage | null {
  return WEBHOOK_EVENT_TO_STAGE[eventType as RoastifyWebhookEventType] ?? null;
}

export function getStageEmailCopy(stage: RoastifyStageEmailStage): StageEmailCopy {
  return STAGE_COPY[stage];
}

const FULFILLMENT_STATUS_TO_EVENT: Record<string, RoastifyWebhookEventType> = {
  created: "fulfillment.created",
  picked: "fulfillment.picked",
  printed: "fulfillment.printed",
  packaged: "fulfillment.packaged",
  shipped: "fulfillment.shipped",
  canceled: "fulfillment.canceled",
  cancelled: "fulfillment.canceled",
};

function readStringField(
  record: Record<string, unknown>,
  ...keys: string[]
): string {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
}

function inferEventTypeFromFulfillmentData(
  data: Record<string, unknown>
): string {
  const status = readStringField(data, "status", "orderStatus", "order_status");
  if (status) {
    const mapped = FULFILLMENT_STATUS_TO_EVENT[status.toLowerCase()];
    if (mapped) {
      return mapped;
    }
  }

  if (
    readStringField(data, "trackingNumber", "tracking_number", "trackingUrl", "tracking_url")
  ) {
    return "tracking.updated";
  }

  return "";
}

export function parseRoastifyWebhookPayload(
  payload: unknown,
  options?: { headerEventType?: string | null }
): {
  eventType: string;
  orderId?: string;
} {
  const record =
    payload && typeof payload === "object"
      ? (payload as Record<string, unknown>)
      : {};

  const payloadBody =
    record.payload && typeof record.payload === "object"
      ? (record.payload as Record<string, unknown>)
      : null;

  const data =
    record.data && typeof record.data === "object"
      ? (record.data as Record<string, unknown>)
      : payloadBody ?? record;

  const eventType =
    readStringField(record, "type", "event", "eventType", "event_type") ||
    readStringField(data, "type", "event", "eventType", "event_type") ||
    readStringField(
      { eventType: options?.headerEventType ?? "" },
      "eventType"
    ) ||
    inferEventTypeFromFulfillmentData(data);

  const nestedData =
    data.data && typeof data.data === "object"
      ? (data.data as Record<string, unknown>)
      : data;

  const orderId =
    readStringField(
      nestedData,
      "orderId",
      "order_id",
      "id"
    ) ||
    readStringField(data, "orderId", "order_id", "id") ||
    readStringField(record, "orderId", "order_id") ||
    undefined;

  return { eventType, orderId: orderId || undefined };
}

export function formatStageLabel(stage: RoastifyStageEmailStage): string {
  if (stage === "tracking") {
    return "Tracking updated";
  }

  return stage.charAt(0).toUpperCase() + stage.slice(1);
}
