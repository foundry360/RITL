import type {
  AdminOrderDetail,
  AdminOrderLineItem,
  AdminOrderRow,
} from "@/lib/admin/orders";
import { getProduct } from "@/lib/stripe/products";
import type { OrderRecord } from "@/lib/orders/types";

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

function buildLineItems(order: OrderRecord): AdminOrderLineItem[] {
  return order.items.map((item) => {
    const product = getProduct(item.productId);
    return {
      name: product?.name ?? item.productId,
      quantity: item.quantity,
      purchaseType: item.purchaseType,
      unitLabel: "—",
    };
  });
}

export function orderRecordToAdminRow(order: OrderRecord): AdminOrderRow {
  return {
    id: order.stripe_payment_intent_id ?? order.id,
    stripeCustomerId: order.stripe_customer_id ?? undefined,
    customerName: order.customer_name ?? "Customer",
    customerEmail: order.customer_email ?? "—",
    amount: order.amount_cents,
    currency: order.currency,
    createdAt: order.created_at,
    itemsSummary: buildItemsSummary(order),
    orderType: order.order_type ?? undefined,
    roastifyOrderId: order.roastify_order_id ?? undefined,
    roastifyStatus: order.fulfillment_status ?? undefined,
    trackingNumber: order.tracking_number ?? undefined,
    trackingUrl: order.tracking_url ?? undefined,
    carrier: order.carrier ?? undefined,
    roastifyUpdatedAt: order.roastify_updated_at ?? undefined,
  };
}

export function orderRecordToAdminDetail(order: OrderRecord): AdminOrderDetail {
  return {
    ...orderRecordToAdminRow(order),
    shippingAddress: order.shipping_address ?? undefined,
    lineItems: buildLineItems(order),
  };
}
