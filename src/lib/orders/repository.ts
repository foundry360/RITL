import { sendOrderStageUpdateEmail } from "@/lib/email/send-order-stage-update";
import {
  syncGhlOrderFulfillmentFromOrderRecord,
  syncGhlOrderFulfillmentProgressSafe,
} from "@/lib/gohighlevel/sync-order";
import type { AdminOrderType } from "@/lib/admin/format";
import type { FulfillmentLineItem } from "@/lib/fulfillment/types";
import { getRoastifyOrder } from "@/lib/roastify/client";
import { isRoastifyConfigured } from "@/lib/roastify/config";
import {
  getRoastifyOrderStatus,
  getRoastifyOrderTracking,
} from "@/lib/roastify/parse-order";
import type { RoastifyOrderDetail } from "@/lib/roastify/types";
import {
  normalizeFulfillmentStatus,
  resolveForwardFulfillmentStatus,
  shouldAdvanceFulfillmentStatus,
} from "@/lib/roastify/status";
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
import { findPaymentIntentByRoastifyOrderId } from "@/lib/roastify/sync-stripe-metadata";
import { buildWebsiteOrderInputFromMetadata } from "@/lib/orders/from-stripe";
import { isStripeSecretConfigured } from "@/lib/stripe/config";
import { getStripe } from "@/lib/stripe/server";

const ORDERS_TABLE = "orders";
const MAX_WEBHOOK_IDS = 20;

function normalizeStatus(value?: string | null): string | undefined {
  return normalizeFulfillmentStatus(value);
}

function resolveStoredFulfillmentStatus(
  previousStatus: string | undefined,
  apiStatus: string | undefined,
  eventType: string
): string | undefined {
  const eventStage = resolveStageFromWebhookEvent(eventType);
  const eventStatus =
    eventStage && eventStage !== "tracking" ? eventStage : undefined;

  let resolved = previousStatus;
  for (const candidate of [apiStatus, eventStatus]) {
    const normalized = normalizeStatus(candidate);
    if (!normalized) {
      continue;
    }
    resolved =
      resolveForwardFulfillmentStatus(resolved, normalized) ?? resolved;
  }

  return resolved;
}

async function resolveStripePaymentIntentIdForOrder(
  roastifyOrderId: string,
  existing?: string | null
): Promise<string | null> {
  const current = existing?.trim();
  if (current) {
    return current;
  }

  const paymentIntent = await findPaymentIntentByRoastifyOrderId(roastifyOrderId);
  return paymentIntent?.id ?? null;
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
    roastify_submit_claimed_at:
      typeof row.roastify_submit_claimed_at === "string"
        ? row.roastify_submit_claimed_at
        : null,
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

  if (result === "sent") {
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

  const existing = await getOrderByStripePaymentIntentId(input.stripePaymentIntentId);
  const fulfillment_status =
    normalizeStatus(input.fulfillmentStatus) ??
    normalizeStatus(existing?.fulfillment_status) ??
    "created";

  const supabase = createSupabaseServiceClient();
  const payload = {
    source: "website" as const,
    stripe_payment_intent_id: input.stripePaymentIntentId,
    stripe_customer_id: input.stripeCustomerId ?? existing?.stripe_customer_id ?? null,
    amount_cents: input.amountCents,
    currency: input.currency,
    order_type: input.orderType ?? existing?.order_type ?? null,
    customer_name: input.customerName ?? existing?.customer_name ?? null,
    customer_email: input.customerEmail ?? existing?.customer_email ?? null,
    shipping_address: input.shippingAddress ?? existing?.shipping_address ?? null,
    items: input.items,
    roastify_order_id:
      input.roastifyOrderId ?? existing?.roastify_order_id ?? null,
    fulfillment_status,
    confirmation_email_sent_at: input.confirmationEmailSent
      ? new Date().toISOString()
      : existing?.confirmation_email_sent_at ?? null,
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
      fulfillment_status: normalizeStatus(input.fulfillmentStatus) ?? "created",
    })
    .eq("stripe_payment_intent_id", input.stripePaymentIntentId)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapRow(data);
}

const ROASTIFY_SUBMIT_CLAIM_STALE_MS = 5 * 60 * 1000;

export async function tryClaimRoastifySubmission(
  stripePaymentIntentId: string
): Promise<boolean> {
  if (!isOrdersDatabaseConfigured()) {
    return true;
  }

  const existing = await getOrderByStripePaymentIntentId(stripePaymentIntentId);
  if (existing?.roastify_order_id) {
    return false;
  }

  const supabase = createSupabaseServiceClient();
  const claimedAt = new Date().toISOString();

  const { data: freshClaim } = await supabase
    .from(ORDERS_TABLE)
    .update({ roastify_submit_claimed_at: claimedAt })
    .eq("stripe_payment_intent_id", stripePaymentIntentId)
    .is("roastify_order_id", null)
    .is("roastify_submit_claimed_at", null)
    .select("id")
    .maybeSingle();

  if (freshClaim) {
    return true;
  }

  const staleCutoff = new Date(
    Date.now() - ROASTIFY_SUBMIT_CLAIM_STALE_MS
  ).toISOString();

  const { data: staleClaim } = await supabase
    .from(ORDERS_TABLE)
    .update({ roastify_submit_claimed_at: claimedAt })
    .eq("stripe_payment_intent_id", stripePaymentIntentId)
    .is("roastify_order_id", null)
    .lt("roastify_submit_claimed_at", staleCutoff)
    .select("id")
    .maybeSingle();

  return Boolean(staleClaim);
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

async function mergeWholesaleOrderIntoWebsite(
  website: OrderRecord,
  wholesale: OrderRecord
): Promise<OrderRecord> {
  const supabase = createSupabaseServiceClient();
  const mergedStatus =
    resolveForwardFulfillmentStatus(
      normalizeStatus(website.fulfillment_status),
      normalizeStatus(wholesale.fulfillment_status)
    ) ??
    normalizeStatus(website.fulfillment_status) ??
    normalizeStatus(wholesale.fulfillment_status) ??
    "created";

  const { error: deleteError } = await supabase
    .from(ORDERS_TABLE)
    .delete()
    .eq("id", wholesale.id);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  const { data, error } = await supabase
    .from(ORDERS_TABLE)
    .update({
      roastify_order_id: wholesale.roastify_order_id ?? website.roastify_order_id,
      fulfillment_status: mergedStatus,
      tracking_number: wholesale.tracking_number ?? website.tracking_number,
      tracking_url: wholesale.tracking_url ?? website.tracking_url,
      carrier: wholesale.carrier ?? website.carrier,
      roastify_updated_at:
        wholesale.roastify_updated_at ?? website.roastify_updated_at,
      stage_emails_sent: [
        ...new Set([...website.stage_emails_sent, ...wholesale.stage_emails_sent]),
      ],
      webhook_ids_processed: [
        ...new Set([
          ...website.webhook_ids_processed,
          ...wholesale.webhook_ids_processed,
        ]),
      ].slice(-MAX_WEBHOOK_IDS),
    })
    .eq("id", website.id)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  console.info(
    `Merged wholesale order ${wholesale.id} into website order ${website.id}`
  );

  return mapRow(data);
}

async function resolveCanonicalOrderForRoastifyWebhook(
  roastifyOrderId: string
): Promise<OrderRecord | null> {
  const roastifyLinked = await getOrderByRoastifyOrderId(roastifyOrderId);
  const stripePaymentIntentId = await resolveStripePaymentIntentIdForOrder(
    roastifyOrderId,
    roastifyLinked?.stripe_payment_intent_id
  );
  const websiteOrder = stripePaymentIntentId
    ? await getOrderByStripePaymentIntentId(stripePaymentIntentId)
    : null;

  if (websiteOrder && roastifyLinked && websiteOrder.id !== roastifyLinked.id) {
    return mergeWholesaleOrderIntoWebsite(websiteOrder, roastifyLinked);
  }

  return websiteOrder ?? roastifyLinked;
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
  let order = await resolveCanonicalOrderForRoastifyWebhook(input.roastifyOrderId);

  if (!order) {
    const stripePaymentIntentId = await resolveStripePaymentIntentIdForOrder(
      input.roastifyOrderId
    );
    const initialStatus =
      resolveStoredFulfillmentStatus(
        undefined,
        input.fulfillmentStatus,
        input.eventType
      ) ?? "created";

    const { data, error } = await supabase
      .from(ORDERS_TABLE)
      .insert({
        source: stripePaymentIntentId ? "website" : "wholesale",
        stripe_payment_intent_id: stripePaymentIntentId,
        roastify_order_id: input.roastifyOrderId,
        customer_name: input.customerName ?? null,
        customer_email: input.customerEmail ?? null,
        shipping_address: input.shippingAddress ?? null,
        fulfillment_status: initialStatus,
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
  const storedStatus = resolveStoredFulfillmentStatus(
    previousStatus,
    input.fulfillmentStatus,
    input.eventType
  );
  const statusAdvanced = Boolean(storedStatus && storedStatus !== previousStatus);
  const stripePaymentIntentId = await resolveStripePaymentIntentIdForOrder(
    input.roastifyOrderId,
    order.stripe_payment_intent_id
  );

  const { data, error } = await supabase
    .from(ORDERS_TABLE)
    .update({
      fulfillment_status:
        storedStatus ?? order.fulfillment_status ?? "created",
      roastify_order_id: input.roastifyOrderId ?? order.roastify_order_id,
      stripe_payment_intent_id:
        stripePaymentIntentId ?? order.stripe_payment_intent_id,
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
  await syncGhlOrderFulfillmentFromOrderRecord(updatedOrder);

  const eventStage = resolveStageFromWebhookEvent(input.eventType);
  const statusStage =
    statusAdvanced && storedStatus
      ? mapRoastifyStatusToStage(storedStatus)
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

export interface SyncOrderFulfillmentResult {
  order: OrderRecord;
  stage: RoastifyStageEmailStage | null;
  email: "sent" | "skipped" | "failed" | "not_applicable";
  statusChanged: boolean;
}

export async function syncOrderFulfillmentFromRoastify(
  order: OrderRecord,
  roastifyOrder: RoastifyOrderDetail
): Promise<SyncOrderFulfillmentResult> {
  const roastifyStatus = getRoastifyOrderStatus(roastifyOrder);
  const tracking = getRoastifyOrderTracking(roastifyOrder);
  const previousStatus = normalizeStatus(order.fulfillment_status);
  const incomingStatus = normalizeStatus(roastifyStatus);
  const storedStatus =
    resolveForwardFulfillmentStatus(previousStatus, incomingStatus) ??
    previousStatus;
  const statusAdvanced = Boolean(
    storedStatus && storedStatus !== previousStatus
  );

  const trackingChanged =
    (tracking.trackingNumber ?? null) !== (order.tracking_number ?? null) ||
    (tracking.trackingUrl ?? null) !== (order.tracking_url ?? null) ||
    (tracking.carrier ?? null) !== (order.carrier ?? null);
  const roastifyUpdatedAt = roastifyOrder.updatedAt ?? null;
  const roastifyTimestampChanged =
    roastifyUpdatedAt !== (order.roastify_updated_at ?? null);
  const ignoredStaleStatus =
    Boolean(
      incomingStatus &&
        previousStatus &&
        incomingStatus !== previousStatus &&
        !shouldAdvanceFulfillmentStatus(previousStatus, incomingStatus)
    );

  if (ignoredStaleStatus) {
    console.warn(
      `Ignoring stale Roastify status "${incomingStatus}" for order ${order.id}; keeping "${previousStatus}"`
    );
  }

  let currentOrder = order;

  if (
    statusAdvanced ||
    trackingChanged ||
    (roastifyTimestampChanged && !ignoredStaleStatus)
  ) {
    const supabase = createSupabaseServiceClient();
    const { data, error } = await supabase
      .from(ORDERS_TABLE)
      .update({
        fulfillment_status: storedStatus ?? order.fulfillment_status,
        tracking_number: tracking.trackingNumber ?? order.tracking_number,
        tracking_url: tracking.trackingUrl ?? order.tracking_url,
        carrier: tracking.carrier ?? order.carrier,
        roastify_updated_at: roastifyUpdatedAt ?? order.roastify_updated_at,
        customer_name: roastifyOrder.toAddress?.name ?? order.customer_name,
        customer_email: roastifyOrder.toAddress?.email ?? order.customer_email,
      })
      .eq("id", order.id)
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    currentOrder = mapRow(data);
  }

  const ghlFulfillmentStatus = ignoredStaleStatus
    ? currentOrder.fulfillment_status
    : storedStatus ?? incomingStatus;

  if (ghlFulfillmentStatus) {
    await syncGhlOrderFulfillmentProgressSafe({
      stripePaymentIntentId: currentOrder.stripe_payment_intent_id,
      roastifyOrderId:
        currentOrder.roastify_order_id ?? roastifyOrder.orderId ?? null,
      fulfillmentStatus: ghlFulfillmentStatus,
      trackingNumber: tracking.trackingNumber ?? currentOrder.tracking_number,
      trackingUrl: tracking.trackingUrl ?? currentOrder.tracking_url,
      carrier: tracking.carrier ?? currentOrder.carrier,
    });
  }

  if (!statusAdvanced || !storedStatus) {
    return {
      order: currentOrder,
      stage: null,
      email: "not_applicable",
      statusChanged: false,
    };
  }

  const stage = mapRoastifyStatusToStage(storedStatus);
  if (!stage) {
    return {
      order: currentOrder,
      stage: null,
      email: "not_applicable",
      statusChanged: true,
    };
  }

  const email = await sendStageEmailForOrder(currentOrder, stage);

  if (email === "sent") {
    console.info(
      `Fulfillment sync sent ${stage} email for order ${currentOrder.id} (${currentOrder.roastify_order_id})`
    );
  }

  const refreshed = await getOrderById(currentOrder.id);

  return {
    order: refreshed ?? currentOrder,
    stage,
    email,
    statusChanged: true,
  };
}

export async function syncOrdersFromRoastify(
  orders: OrderRecord[]
): Promise<OrderRecord[]> {
  if (!isRoastifyConfigured() || orders.length === 0) {
    return orders;
  }

  return Promise.all(
    orders.map(async (order) => {
      if (!order.roastify_order_id) {
        return order;
      }

      try {
        const roastifyOrder = await getRoastifyOrder(order.roastify_order_id);
        const result = await syncOrderFulfillmentFromRoastify(order, roastifyOrder);
        return result.order;
      } catch (error) {
        console.error(`Roastify sync failed for order ${order.id}:`, error);
        return order;
      }
    })
  );
}

export async function syncActiveWebsiteOrdersFromRoastify(options?: {
  limit?: number;
}): Promise<{
  checked: number;
  statusChanges: number;
  emailsSent: number;
  errors: number;
}> {
  if (!isOrdersDatabaseConfigured() || !isRoastifyConfigured()) {
    return { checked: 0, statusChanges: 0, emailsSent: 0, errors: 0 };
  }

  const supabase = createSupabaseServiceClient();
  const limit = options?.limit ?? 50;
  const { data, error } = await supabase
    .from(ORDERS_TABLE)
    .select("*")
    .eq("source", "website")
    .not("roastify_order_id", "is", null)
    .order("updated_at", { ascending: false })
    .limit(limit * 3);

  if (error) {
    throw new Error(error.message);
  }

  const activeStatuses = new Set(["created", "picked", "printed", "packaged"]);
  const orders = (data ?? [])
    .map((row) => mapRow(row))
    .filter((order) => {
      const status = normalizeStatus(order.fulfillment_status);
      return status ? activeStatuses.has(status) : false;
    })
    .slice(0, limit);

  let statusChanges = 0;
  let emailsSent = 0;
  let errors = 0;

  for (const order of orders) {
    if (!order.roastify_order_id) {
      continue;
    }

    try {
      const roastifyOrder = await getRoastifyOrder(order.roastify_order_id);
      const result = await syncOrderFulfillmentFromRoastify(order, roastifyOrder);
      if (result.statusChanged) {
        statusChanges += 1;
      }
      if (result.email === "sent") {
        emailsSent += 1;
      }
    } catch (syncError) {
      errors += 1;
      console.error(
        `Active order sync failed for ${order.roastify_order_id}:`,
        syncError
      );
    }
  }

  return {
    checked: orders.length,
    statusChanges,
    emailsSent,
    errors,
  };
}

export interface ListOrdersOptions {
  query?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  source?: "website" | "wholesale";
  progress?: string;
  productId?: string;
  orderType?: string;
  dateFrom?: string;
  dateTo?: string;
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

  if (options.progress === "awaiting") {
    query = query.or("fulfillment_status.is.null,fulfillment_status.eq.");
  } else if (options.progress === "canceled") {
    query = query.in("fulfillment_status", ["canceled", "cancelled"]);
  } else if (options.progress) {
    query = query.eq("fulfillment_status", options.progress);
  }

  if (options.productId) {
    query = query.contains("items", [{ productId: options.productId }]);
  }

  if (options.orderType === "unknown") {
    query = query.is("order_type", null);
  } else if (options.orderType) {
    query = query.eq("order_type", options.orderType);
  }

  if (options.dateFrom) {
    query = query.gte("created_at", `${options.dateFrom}T00:00:00.000Z`);
  }

  if (options.dateTo) {
    query = query.lte("created_at", `${options.dateTo}T23:59:59.999Z`);
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

export async function repairOrdersInDatabase(): Promise<{
  merged: number;
  backfilled: number;
}> {
  if (!isOrdersDatabaseConfigured()) {
    return { merged: 0, backfilled: 0 };
  }

  let merged = 0;
  let backfilled = 0;
  const supabase = createSupabaseServiceClient();

  const { data: wholesaleOrders } = await supabase
    .from(ORDERS_TABLE)
    .select("id, roastify_order_id")
    .eq("source", "wholesale")
    .not("roastify_order_id", "is", null);

  for (const row of wholesaleOrders ?? []) {
    if (!row.roastify_order_id) {
      continue;
    }

    const before = await getOrderByRoastifyOrderId(row.roastify_order_id);
    const canonical = await resolveCanonicalOrderForRoastifyWebhook(
      row.roastify_order_id
    );
    if (before && canonical && before.id !== canonical.id) {
      merged += 1;
    }
  }

  const { data: nullStatusOrders } = await supabase
    .from(ORDERS_TABLE)
    .select("id, stripe_payment_intent_id")
    .is("fulfillment_status", null);

  for (const row of nullStatusOrders ?? []) {
    if (row.stripe_payment_intent_id && isStripeSecretConfigured()) {
      const paymentIntent = await getStripe().paymentIntents.retrieve(
        row.stripe_payment_intent_id
      );
      const orderInput = buildWebsiteOrderInputFromMetadata(paymentIntent);
      if (orderInput) {
        await upsertWebsiteOrder(orderInput);
        backfilled += 1;
        continue;
      }
    }

    await supabase
      .from(ORDERS_TABLE)
      .update({ fulfillment_status: "created" })
      .eq("id", row.id);
    backfilled += 1;
  }

  return { merged, backfilled };
}
