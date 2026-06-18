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

const STAGE_COPY: Record<
  RoastifyStageEmailStage,
  { subject: string; headline: string; body: string }
> = {
  created: {
    subject: "Your order is in fulfillment",
    headline: "Fulfillment has started.",
    body: "Your order has entered our fulfillment queue and is being prepared.",
  },
  picked: {
    subject: "Your order has been picked",
    headline: "Your order is being prepared.",
    body: "Your items have been picked and are moving through production.",
  },
  printed: {
    subject: "Your order label is ready",
    headline: "Your shipping label is printed.",
    body: "Your order is progressing through fulfillment and is one step closer to shipping.",
  },
  packaged: {
    subject: "Your order is packaged",
    headline: "Your order is packaged.",
    body: "Your ritual is packed and ready to ship.",
  },
  shipped: {
    subject: "Your order has shipped",
    headline: "Your order is on the way.",
    body: "Your package has shipped. Tracking details are included below.",
  },
  canceled: {
    subject: "Your order was canceled",
    headline: "Your order was canceled.",
    body: "This fulfillment was canceled. If you have questions, reply to this email.",
  },
  tracking: {
    subject: "Your tracking information was updated",
    headline: "Tracking updated.",
    body: "Your shipment tracking details have been updated.",
  },
};

export function resolveStageFromWebhookEvent(
  eventType: string
): RoastifyStageEmailStage | null {
  return WEBHOOK_EVENT_TO_STAGE[eventType as RoastifyWebhookEventType] ?? null;
}

export function getStageEmailCopy(stage: RoastifyStageEmailStage): {
  subject: string;
  headline: string;
  body: string;
} {
  return STAGE_COPY[stage];
}

export function parseRoastifyWebhookPayload(payload: unknown): {
  eventType: string;
  orderId?: string;
} {
  const record =
    payload && typeof payload === "object"
      ? (payload as Record<string, unknown>)
      : {};

  const eventType =
    (typeof record.type === "string" && record.type) ||
    (typeof record.event === "string" && record.event) ||
    "";

  const data =
    record.data && typeof record.data === "object"
      ? (record.data as Record<string, unknown>)
      : record;

  const orderId =
    (typeof data.orderId === "string" && data.orderId) ||
    (typeof data.order_id === "string" && data.order_id) ||
    (typeof data.id === "string" && data.id) ||
    (typeof record.orderId === "string" && record.orderId) ||
    undefined;

  return { eventType, orderId };
}

export function formatStageLabel(stage: RoastifyStageEmailStage): string {
  if (stage === "tracking") {
    return "Tracking updated";
  }

  return stage.charAt(0).toUpperCase() + stage.slice(1);
}
