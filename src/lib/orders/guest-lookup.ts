import { getOrderById } from "@/lib/orders/repository";
import { getProduct } from "@/lib/stripe/products";
import type { OrderRecord } from "@/lib/orders/types";

export interface PublicOrderLineItem {
  name: string;
  quantity: number;
  purchaseType: string;
}

export interface PublicOrderStatus {
  orderReference: string;
  customerName: string;
  itemsSummary: string;
  lineItems: PublicOrderLineItem[];
  orderDate: string;
  amount: number;
  currency: string;
  fulfillmentStatus?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  carrier?: string;
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeName(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function buildItemsSummary(order: OrderRecord): string {
  if (!order.items.length) {
    return "—";
  }

  return order.items
    .map((item) => {
      const product = getProduct(item.productId);
      const name = product?.name ?? item.productId;
      return `${name} × ${item.quantity}`;
    })
    .join(", ");
}

function buildLineItems(order: OrderRecord): PublicOrderLineItem[] {
  return order.items.map((item) => {
    const product = getProduct(item.productId);
    return {
      name: product?.name ?? item.productId,
      quantity: item.quantity,
      purchaseType: item.purchaseType,
    };
  });
}

function toPublicOrderStatus(order: OrderRecord): PublicOrderStatus {
  return {
    orderReference: order.stripe_payment_intent_id ?? order.roastify_order_id ?? order.id,
    customerName: order.customer_name ?? "Customer",
    itemsSummary: buildItemsSummary(order),
    lineItems: buildLineItems(order),
    orderDate: order.created_at,
    amount: order.amount_cents / 100,
    currency: order.currency,
    fulfillmentStatus: order.fulfillment_status ?? undefined,
    trackingNumber: order.tracking_number ?? undefined,
    trackingUrl: order.tracking_url ?? undefined,
    carrier: order.carrier ?? undefined,
  };
}

export async function lookupGuestOrder(input: {
  email: string;
  name: string;
  orderNumber: string;
}): Promise<PublicOrderStatus | null> {
  const email = normalizeEmail(input.email);
  const name = normalizeName(input.name);
  const orderNumber = input.orderNumber.trim();

  if (!email || !name || !orderNumber) {
    return null;
  }

  const order = await getOrderById(orderNumber);
  if (!order) {
    return null;
  }

  if (!order.customer_email || normalizeEmail(order.customer_email) !== email) {
    return null;
  }

  if (!order.customer_name || normalizeName(order.customer_name) !== name) {
    return null;
  }

  return toPublicOrderStatus(order);
}
