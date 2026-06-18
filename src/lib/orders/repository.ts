import { sendOrderStageUpdateEmail } from "@/lib/email/send-order-stage-update";
import type { AdminOrderType } from "@/lib/admin/format";
import type { FulfillmentLineItem } from "@/lib/fulfillment/types";
import {
  mapRoastifyStatusToStage,
  resolveStageFromWebhookEvent,
  type RoastifyStageEmailStage,
} from "@/lib/roastify/stage-emails";
import type {
  ApplyRoastifyWebhookInput,
  ApplyRoastifyWebhookResult,
  OrderRecord,
  UpsertWebsiteOrderInput,
} from "@/lib/orders/types";
import { isOrdersDatabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

const ORDERS_TABLE = "orders";
const MAX_WEBHOOK_IDS = 20;

function normalizeStatus(value?: string | null): string | undefined {
  const normalized = value?.trim().toLowerCase();
  return normalized || undefined;
}

function parseItems(value: unknown): FulfillmentLineItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (item): item is FulfillmentLineItem =>
      Boolean(
        item &&
          typeof item === "object" &&
          typeof (item as FulfillmentLineItem).productId === "string" &&
          typeof (item as FulfillmentLineItem).quantity === "number" &&
          typeof (item as FulfillmentLineItem).purchaseType === "string"
      )
  );
}

function mapRow(row: Record<string, unknown>): OrderRecord {
  return {
    id: String(row.id),
    source: row.source === "wholesale" ? "wholesale" : "website",
    stripe_payment_intent_id:
      typeof row.stripe_payment_intent_id === "string"
        ? row.stripe_payment_intent_id
        : null,
    stripe_customer_id:
      typeof row.stripe_customer_id === "string" ? row.stripe_customer_id : null,
    amount_cents:
      typeof row.amount_cents === "number" ? row.amount_cents : Number(row.amount_cents ?? 0),
    currency: typeof row.currency === "string" ? row.currency : "usd",
    order_type:
      row.order_type === "one-time" ||
      row.order_type === "subscription" ||
      row.order_type === "mixed"
        ? row.order_type
        : null,
    customer_name:
      typeof row.customer_name === "string" ? row.customer_name : null,
    customer_email:
      typeof row.customer_email === "string" ? row.customer_email : null,
    shipping_address:
      typeof row.shipping_address === "string" ? row.shipping_address : null,
    items: parseItems(row.items),
    roastify_order_id:
      typeof row.roastify_order_id === "string" ? row.roastify_order_id : null,
    fulfillment_status:
      typeof row.fulfillment_status === "string" ? row.fulfillment_status : null,
    tracking_number:
      typeof row.tracking_number === "string" ? row.tracking_number : null,
    tracking_url: typeof row.tracking_url === "string" ? row.tracking_url : null,
    carrier: typeof row.carrier === "string" ? row.carrier : null,
    roastify_updated_at:
      typeof row.roastify_updated_at === "string" ? row.roastify_updated_at : null,
    confirmation_email_sent_at:
      typeof row.confirmation_email_sent_at === "string"
        ? row.confirmation_email_sent_at
        : null,
    stage_emails_sent: Array.isArray(row.stage_emails_sent)
      ? row.stage_emails_sent.filter((entry): entry is string => typeof entry === "string")
      : [],
    webhook_ids_processed: Array.isArray(row.webhook_ids_processed)
      ? row.webhook_ids_processed.filter((entry): entry is string => typeof entry === "string")
      : [],
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

function hasStageBeenSent(order: OrderRecord, stage: RoastifyStageEmailStage): boolean {
  return order.stage_emails_sent
    .map((entry) => entry.toLowerCase())
    .includes(stage.toLowerCase());
}

async function markStageEmailSentInDatabase(
  orderId: string,
  stage: RoastifyStageEmailStage,
  webhookId?: string,
  current?: OrderRecord
): Promise<void> {
  const supabase = createSupabaseServiceClient();
  const stageEmails = new Set(
    (current?.stage_emails_sent ?? []).map((entry) => entry.toLowerCase())
  );
  stageEmails.add(stage.toLowerCase());

  const webhookIds = [...(current?.webhook_ids_processed ?? [])];
  if (webhookId && !webhookIds.includes(webhookId)) {
    webhookIds.push(webhookId);
  }

  await supabase
    .from(ORDERS_TABLE)
    .update({
      stage_emails_sent: [...stageEmails],
      webhook_ids_processed: webhookIds.slice(-MAX_WEBHOOK_IDS),
    })
    .eq("id", orderId);
}

async function sendStageEmailForOrder(
  order: OrderRecord,
  stage: RoastifyStageEmailStage,
  webhookId?: string
): Promise<"sent" | "skipped" | "failed"> {
  if (stage === "created" && order.confirmation_email_sent_at) {
    await markStageEmailSentInDatabase(order.id, stage, webhookId, order);
    return "skipped";
  }

  if (hasStageBeenSent(order, stage) && stage !== "tracking") {
    if (webhookId) {
      await markStageEmailSentInDatabase(order.id, stage, webhookId, order);
    }
    return "skipped";
  }

  const result = await sendOrderStageUpdateEmail({
    roastifyOrderId: order.roastify_order_id ?? order.id,
    stage,
    webhookId,
    orderRecord: order,
  });

  if (result === "sent" || result === "skipped") {
    await markStageEmailSentInDatabase(order.id, stage, webhookId, order);
  }

  return result;
}

export async function upsertWebsiteOrder(
  input: UpsertWebsiteOrderInput
): Promise<OrderRecord | null> {
  if (!isOrdersDatabaseConfigured()) {
    return null;
  }

  const supabase = createSupabaseServiceClient();
  const payload = {
    source: "website" as const,
    stripe_payment_intent_id: input.stripePaymentIntentId,
    stripe_customer_id: input.stripeCustomerId ?? null,
    amount_cents: input.amountCents,
    currency: input.currency,
    order_type: input.orderType ?? null,
    customer_name: input.customerName ?? null,
    customer_email: input.customerEmail ?? null,
    shipping_address: input.shippingAddress ?? null,
    items: input.items,
    roastify_order_id: input.roastifyOrderId ?? null,
    fulfillment_status: input.fulfillmentStatus ?? null,
    confirmation_email_sent_at: input.confirmationEmailSent
      ? new Date().toISOString()
      : null,
  };

  const { data, error } = await supabase
    .from(ORDERS_TABLE)
    .upsert(payload, { onConflict: "stripe_payment_intent_id" })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapRow(data);
}

export async function markOrderConfirmationEmailSent(
  stripePaymentIntentId: string
): Promise<void> {
  if (!isOrdersDatabaseConfigured()) {
    return;
  }

  const supabase = createSupabaseServiceClient();
  await supabase
    .from(ORDERS_TABLE)
    .update({ confirmation_email_sent_at: new Date().toISOString() })
    .eq("stripe_payment_intent_id", stripePaymentIntentId);
}

export async function linkRoastifyOrderToWebsiteOrder(input: {
  stripePaymentIntentId: string;
  roastifyOrderId: string;
  fulfillmentStatus?: string;
}): Promise<OrderRecord | null> {
  if (!isOrdersDatabaseConfigured()) {
    return null;
  }

  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from(ORDERS_TABLE)
    .update({
      roastify_order_id: input.roastifyOrderId,
      fulfillment_status: input.fulfillmentStatus ?? "created",
    })
    .eq("stripe_payment_intent_id", input.stripePaymentIntentId)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapRow(data);
}

export async function getOrderByStripePaymentIntentId(
  stripePaymentIntentId: string
): Promise<OrderRecord | null> {
  if (!isOrdersDatabaseConfigured()) {
    return null;
  }

  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from(ORDERS_TABLE)
    .select("*")
    .eq("stripe_payment_intent_id", stripePaymentIntentId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapRow(data) : null;
}

export async function getOrderByRoastifyOrderId(
  roastifyOrderId: string
): Promise<OrderRecord | null> {
  if (!isOrdersDatabaseConfigured()) {
    return null;
  }

  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from(ORDERS_TABLE)
    .select("*")
    .eq("roastify_order_id", roastifyOrderId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapRow(data) : null;
}

export async function applyRoastifyWebhookUpdate(
  input: ApplyRoastifyWebhookInput
): Promise<ApplyRoastifyWebhookResult> {
  if (!isOrdersDatabaseConfigured()) {
    return {
      order: null,
      stage: null,
      email: "not_applicable",
      duplicate: false,
    };
  }

  const supabase = createSupabaseServiceClient();
  let order = await getOrderByRoastifyOrderId(input.roastifyOrderId);

  if (!order) {
    const { data, error } = await supabase
      .from(ORDERS_TABLE)
      .insert({
        source: "wholesale",
        roastify_order_id: input.roastifyOrderId,
        customer_name: input.customerName ?? null,
        customer_email: input.customerEmail ?? null,
        shipping_address: input.shippingAddress ?? null,
        fulfillment_status: input.fulfillmentStatus ?? null,
        tracking_number: input.trackingNumber ?? null,
        tracking_url: input.trackingUrl ?? null,
        carrier: input.carrier ?? null,
        roastify_updated_at: input.roastifyUpdatedAt ?? null,
      })
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    order = mapRow(data);
  }

  if (order.webhook_ids_processed.includes(input.webhookId)) {
    return {
      order,
      stage: resolveStageFromWebhookEvent(input.eventType),
      email: "skipped",
      duplicate: true,
    };
  }

  const previousStatus = normalizeStatus(order.fulfillment_status);
  const nextStatus = normalizeStatus(input.fulfillmentStatus) ?? previousStatus;

  const { data, error } = await supabase
    .from(ORDERS_TABLE)
    .update({
      fulfillment_status: input.fulfillmentStatus ?? order.fulfillment_status,
      tracking_number: input.trackingNumber ?? order.tracking_number,
      tracking_url: input.trackingUrl ?? order.tracking_url,
      carrier: input.carrier ?? order.carrier,
      roastify_updated_at: input.roastifyUpdatedAt ?? order.roastify_updated_at,
      customer_name: input.customerName ?? order.customer_name,
      customer_email: input.customerEmail ?? order.customer_email,
      shipping_address: input.shippingAddress ?? order.shipping_address,
      webhook_ids_processed: [...order.webhook_ids_processed, input.webhookId].slice(
        -MAX_WEBHOOK_IDS
      ),
    })
    .eq("id", order.id)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const updatedOrder = mapRow(data);
  const eventStage = resolveStageFromWebhookEvent(input.eventType);
  const statusStage =
    nextStatus && nextStatus !== previousStatus
      ? mapRoastifyStatusToStage(nextStatus)
      : null;
  const stage = eventStage ?? statusStage;

  if (!stage) {
    return {
      order: updatedOrder,
      stage: null,
      email: "not_applicable",
      duplicate: false,
    };
  }

  const email = await sendStageEmailForOrder(
    updatedOrder,
    stage,
    input.webhookId
  );

  return {
    order: updatedOrder,
    stage,
    email,
    duplicate: false,
  };
}

export interface ListOrdersOptions {
  query?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  source?: "website" | "wholesale";
}

const SORT_COLUMN_MAP: Record<string, string> = {
  customerName: "customer_name",
  itemsSummary: "created_at",
  createdAt: "created_at",
  amount: "amount_cents",
  orderType: "order_type",
  roastifyStatus: "fulfillment_status",
  trackingNumber: "tracking_number",
  roastifyOrderId: "roastify_order_id",
};

export async function listOrders(
  options: ListOrdersOptions = {}
): Promise<{ orders: OrderRecord[]; total: number }> {
  if (!isOrdersDatabaseConfigured()) {
    return { orders: [], total: 0 };
  }

  const supabase = createSupabaseServiceClient();
  const page = Math.max(1, options.page ?? 1);
  const pageSize = options.pageSize ?? 25;
  const sortColumn = SORT_COLUMN_MAP[options.sortBy ?? "createdAt"] ?? "created_at";
  const ascending = options.sortDir === "asc";
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from(ORDERS_TABLE)
    .select("*", { count: "exact" })
    .order(sortColumn, { ascending, nullsFirst: false })
    .range(from, to);

  if (options.source) {
    query = query.eq("source", options.source);
  }

  const normalizedQuery = options.query?.trim().replace(/[,()]/g, " ");
  if (normalizedQuery) {
    const pattern = `%${normalizedQuery}%`;
    query = query.or(
      [
        `customer_name.ilike.${pattern}`,
        `customer_email.ilike.${pattern}`,
        `fulfillment_status.ilike.${pattern}`,
        `tracking_number.ilike.${pattern}`,
        `roastify_order_id.ilike.${pattern}`,
        `stripe_payment_intent_id.ilike.${pattern}`,
      ].join(",")
    );
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return {
    orders: (data ?? []).map((row) => mapRow(row)),
    total: count ?? 0,
  };
}

export async function getOrderById(orderId: string): Promise<OrderRecord | null> {
  if (!isOrdersDatabaseConfigured()) {
    return null;
  }

  const supabase = createSupabaseServiceClient();
  const byUuid = await supabase
    .from(ORDERS_TABLE)
    .select("*")
    .eq("id", orderId)
    .maybeSingle();

  if (byUuid.data) {
    return mapRow(byUuid.data);
  }

  const byStripe = await supabase
    .from(ORDERS_TABLE)
    .select("*")
    .eq("stripe_payment_intent_id", orderId)
    .maybeSingle();

  if (byStripe.data) {
    return mapRow(byStripe.data);
  }

  const byRoastify = await supabase
    .from(ORDERS_TABLE)
    .select("*")
    .eq("roastify_order_id", orderId)
    .maybeSingle();

  if (byRoastify.data) {
    return mapRow(byRoastify.data);
  }

  return null;
}
