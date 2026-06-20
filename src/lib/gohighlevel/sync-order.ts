import type Stripe from "stripe";
import type { AdminOrderType } from "@/lib/admin/format";
import type { FulfillmentLineItem } from "@/lib/fulfillment/types";
import type { OrderRecord } from "@/lib/orders/types";
import { normalizeFulfillmentStatus } from "@/lib/roastify/status";
import { ghlRequest } from "@/lib/gohighlevel/client";
import {
  getGhlContactOrdersAssociationId,
  getGhlCustomerOrdersSchemaKey,
  getGhlLocationId,
  isGhlOrdersConfigured,
} from "@/lib/gohighlevel/config";
import { resolveFulfillmentOrder } from "@/lib/roastify/resolve-fulfillment-order";
import { products } from "@/lib/stripe/products";

async function resolvePaymentIntentIdForGhlLookup(
  paymentIntentId?: string | null,
  roastifyOrderId?: string | null
): Promise<string | undefined> {
  const direct = paymentIntentId?.trim();
  if (direct) {
    return direct;
  }

  const roastifyId = roastifyOrderId?.trim();
  if (!roastifyId) {
    return undefined;
  }

  const { findPaymentIntentByRoastifyOrderId } = await import(
    "@/lib/roastify/sync-stripe-metadata"
  );
  const paymentIntent = await findPaymentIntentByRoastifyOrderId(roastifyId);
  return paymentIntent?.id;
}

export interface GhlOrderSyncResult {
  orderRecordId: string;
  created: boolean;
}

interface GhlOrderRecord {
  id: string;
  properties?: Record<string, unknown>;
  relations?: Array<{ recordId?: string; objectKey?: string }>;
}

interface GhlOrderSearchResponse {
  records?: GhlOrderRecord[];
  total?: number;
}

interface GhlCreateOrderResponse {
  record?: GhlOrderRecord;
}

function formatProductsLine(items: FulfillmentLineItem[]): string {
  return items
    .map((item) => {
      const name = products[item.productId]?.name ?? item.productId;
      const typeLabel =
        item.purchaseType === "subscription" ? " (subscription)" : "";
      return `${name} x${item.quantity}${typeLabel}`;
    })
    .join("\n");
}

function formatShippingAddress(
  shipping: NonNullable<Awaited<ReturnType<typeof resolveFulfillmentOrder>>>["shipping"]
): string {
  return [
    shipping.name,
    shipping.line1,
    shipping.line2,
    [shipping.city, shipping.state, shipping.postalCode].filter(Boolean).join(", "),
    shipping.country,
  ]
    .filter(Boolean)
    .join("\n");
}

function resolveOrderType(items: FulfillmentLineItem[]): AdminOrderType | undefined {
  const purchaseTypes = new Set(items.map((item) => item.purchaseType));

  if (purchaseTypes.size === 0) {
    return undefined;
  }

  if (purchaseTypes.size > 1) {
    return "mixed";
  }

  return items[0]?.purchaseType === "subscription" ? "subscription" : "one-time";
}

function toGhlOrderType(orderType?: AdminOrderType): string | undefined {
  if (orderType === "one-time") {
    return "one_time";
  }
  if (orderType === "subscription") {
    return "subscription";
  }
  if (orderType === "mixed") {
    return "mixed";
  }
  return undefined;
}

function formatOrderDate(paymentIntent: Stripe.PaymentIntent): string {
  const timestamp = paymentIntent.created * 1000;
  return new Date(timestamp).toISOString().slice(0, 10);
}

async function findOrderRecordByQuery(
  query: string,
  match: (record: GhlOrderRecord) => boolean
): Promise<GhlOrderRecord | undefined> {
  const schemaKey = getGhlCustomerOrdersSchemaKey();
  const result = await ghlRequest<GhlOrderSearchResponse>(
    `/objects/${encodeURIComponent(schemaKey)}/records/search`,
    {
      method: "POST",
      body: {
        locationId: getGhlLocationId(),
        query,
        page: 1,
        pageLimit: 5,
      },
    }
  );

  return result.records?.find(match);
}

async function findOrderRecordByPaymentIntentId(
  paymentIntentId: string
): Promise<GhlOrderRecord | undefined> {
  return findOrderRecordByQuery(
    paymentIntentId,
    (record) => record.properties?.order_id === paymentIntentId
  );
}

async function findOrderRecordByRoastifyOrderId(
  roastifyOrderId: string
): Promise<GhlOrderRecord | undefined> {
  return findOrderRecordByQuery(
    roastifyOrderId,
    (record) => record.properties?.roastify_order_id === roastifyOrderId
  );
}

async function createOrderRecord(
  properties: Record<string, unknown>
): Promise<GhlOrderRecord> {
  const schemaKey = getGhlCustomerOrdersSchemaKey();
  const result = await ghlRequest<GhlCreateOrderResponse>(
    `/objects/${encodeURIComponent(schemaKey)}/records`,
    {
      method: "POST",
      body: {
        locationId: getGhlLocationId(),
        properties,
      },
    }
  );

  const record = result.record;
  if (!record?.id) {
    throw new Error("GoHighLevel order create did not return a record id");
  }

  return record;
}

async function updateOrderRecord(
  recordId: string,
  properties: Record<string, unknown>
): Promise<void> {
  const schemaKey = getGhlCustomerOrdersSchemaKey();
  const locationId = encodeURIComponent(getGhlLocationId());
  await ghlRequest(
    `/objects/${encodeURIComponent(schemaKey)}/records/${encodeURIComponent(recordId)}?locationId=${locationId}`,
    {
      method: "PUT",
      body: {
        properties,
      },
    }
  );
}

async function ensureContactOrderRelation(
  contactId: string,
  orderRecordId: string,
  existingRecord?: GhlOrderRecord
): Promise<void> {
  const alreadyLinked = existingRecord?.relations?.some(
    (relation) =>
      relation.objectKey === "contact" && relation.recordId === contactId
  );

  if (alreadyLinked) {
    return;
  }

  await ghlRequest("/associations/relations", {
    method: "POST",
    body: {
      locationId: getGhlLocationId(),
      associationId: getGhlContactOrdersAssociationId(),
      firstRecordId: contactId,
      secondRecordId: orderRecordId,
    },
  });
}

export async function syncGhlOrderFromPaymentIntent(
  paymentIntent: Stripe.PaymentIntent,
  contactId: string
): Promise<GhlOrderSyncResult | null> {
  if (!isGhlOrdersConfigured()) {
    return null;
  }

  const fulfillmentOrder = await resolveFulfillmentOrder(paymentIntent);
  if (!fulfillmentOrder) {
    return null;
  }

  const orderType = resolveOrderType(fulfillmentOrder.items);
  const properties: Record<string, unknown> = {
    order_id: paymentIntent.id,
    order_date: formatOrderDate(paymentIntent),
    order_total: {
      currency: "default",
      value: (paymentIntent.amount_received || paymentIntent.amount) / 100,
    },
    currency: paymentIntent.currency,
    products: formatProductsLine(fulfillmentOrder.items),
    fulfillment_status:
      normalizeFulfillmentStatus(
        paymentIntent.metadata?.ritl_fulfillment_status
      ) ?? "created",
    roastify_order_id: paymentIntent.metadata?.ritl_roastify_order_id,
    shipping_address: formatShippingAddress(fulfillmentOrder.shipping),
    stripe_customer_id: fulfillmentOrder.stripeCustomerId,
  };

  const ghlOrderType = toGhlOrderType(orderType);
  if (ghlOrderType) {
    properties.order_type = ghlOrderType;
  }

  const cleanedProperties = Object.fromEntries(
    Object.entries(properties).filter(
      ([, value]) => value !== undefined && value !== ""
    )
  );

  const existing = await findOrderRecordByPaymentIntentId(paymentIntent.id);
  let orderRecordId: string;
  let created = false;

  if (existing?.id) {
    orderRecordId = existing.id;
    await updateOrderRecord(orderRecordId, cleanedProperties);
    await ensureContactOrderRelation(contactId, orderRecordId, existing);
  } else {
    const record = await createOrderRecord(cleanedProperties);
    orderRecordId = record.id;
    created = true;
    await ensureContactOrderRelation(contactId, orderRecordId);
  }

  return { orderRecordId, created };
}

export interface GhlOrderFulfillmentSyncInput {
  stripePaymentIntentId?: string | null;
  roastifyOrderId?: string | null;
  fulfillmentStatus?: string | null;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  carrier?: string | null;
}

function buildFulfillmentPropertyUpdates(
  input: GhlOrderFulfillmentSyncInput
): Record<string, unknown> {
  const updates: Record<string, unknown> = {};

  if (input.fulfillmentStatus) {
    updates.fulfillment_status =
      normalizeFulfillmentStatus(input.fulfillmentStatus) ??
      input.fulfillmentStatus;
  }
  if (input.roastifyOrderId) {
    updates.roastify_order_id = input.roastifyOrderId;
  }
  if (input.trackingNumber) {
    updates.tracking_number = input.trackingNumber;
  }
  if (input.trackingUrl) {
    updates.tracking_url = input.trackingUrl;
  }
  if (input.carrier) {
    updates.carrier = input.carrier;
  }

  return updates;
}

export async function syncGhlOrderFulfillmentProgress(
  input: GhlOrderFulfillmentSyncInput
): Promise<{ updated: boolean; orderRecordId?: string } | null> {
  if (!isGhlOrdersConfigured()) {
    return null;
  }

  const paymentIntentId = await resolvePaymentIntentIdForGhlLookup(
    input.stripePaymentIntentId,
    input.roastifyOrderId
  );
  const roastifyOrderId = input.roastifyOrderId?.trim();
  if (!paymentIntentId && !roastifyOrderId) {
    return null;
  }

  let existing: GhlOrderRecord | undefined;
  if (paymentIntentId) {
    existing = await findOrderRecordByPaymentIntentId(paymentIntentId);
  }
  if (!existing?.id && roastifyOrderId) {
    existing = await findOrderRecordByRoastifyOrderId(roastifyOrderId);
  }
  if (!existing?.id) {
    console.warn(
      `GHL order record not found (pi=${paymentIntentId ?? "none"}, roastify=${roastifyOrderId ?? "none"})`
    );
    return { updated: false };
  }

  const updates = buildFulfillmentPropertyUpdates({
    ...input,
    stripePaymentIntentId: paymentIntentId,
  });
  if (Object.keys(updates).length === 0) {
    return { updated: false, orderRecordId: existing.id };
  }

  try {
    await updateOrderRecord(existing.id, updates);
  } catch (error) {
    const hasTrackingFields = Boolean(
      updates.tracking_number || updates.tracking_url || updates.carrier
    );
    if (!hasTrackingFields) {
      throw error;
    }

    const statusOnlyUpdates = Object.fromEntries(
      Object.entries(updates).filter(
        ([key]) => key !== "tracking_number" && key !== "tracking_url" && key !== "carrier"
      )
    );
    if (Object.keys(statusOnlyUpdates).length === 0) {
      throw error;
    }

    await updateOrderRecord(existing.id, statusOnlyUpdates);
    console.warn(
      `GHL order fulfillment synced without tracking fields for ${paymentIntentId ?? roastifyOrderId}`
    );
  }

  return { updated: true, orderRecordId: existing.id };
}

export async function syncGhlOrderFulfillmentProgressSafe(
  input: GhlOrderFulfillmentSyncInput
): Promise<void> {
  try {
    const result = await syncGhlOrderFulfillmentProgress(input);
    if (result?.updated) {
      console.info(
        `GHL order fulfillment synced for ${input.stripePaymentIntentId ?? input.roastifyOrderId}`
      );
    } else if (result && !result.updated) {
      console.warn(
        `GHL order fulfillment not updated for ${input.stripePaymentIntentId ?? input.roastifyOrderId}`
      );
    }
  } catch (error) {
    console.error(
      `GHL order fulfillment sync failed for ${input.stripePaymentIntentId ?? input.roastifyOrderId}:`,
      error
    );
  }
}

export function toGhlFulfillmentSyncInput(
  order: Pick<
    OrderRecord,
    | "stripe_payment_intent_id"
    | "roastify_order_id"
    | "fulfillment_status"
    | "tracking_number"
    | "tracking_url"
    | "carrier"
  >
): GhlOrderFulfillmentSyncInput {
  return {
    stripePaymentIntentId: order.stripe_payment_intent_id,
    roastifyOrderId: order.roastify_order_id,
    fulfillmentStatus: order.fulfillment_status,
    trackingNumber: order.tracking_number,
    trackingUrl: order.tracking_url,
    carrier: order.carrier,
  };
}

export async function syncGhlOrderFulfillmentFromOrderRecord(
  order: Pick<
    OrderRecord,
    | "stripe_payment_intent_id"
    | "roastify_order_id"
    | "fulfillment_status"
    | "tracking_number"
    | "tracking_url"
    | "carrier"
  >
): Promise<void> {
  await syncGhlOrderFulfillmentProgressSafe(toGhlFulfillmentSyncInput(order));
}
