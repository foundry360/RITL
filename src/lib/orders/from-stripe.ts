import type Stripe from "stripe";
import type { AdminOrderType } from "@/lib/admin/format";
import { parseFulfillmentLineItems } from "@/lib/fulfillment/parse-items";
import type { FulfillmentLineItem } from "@/lib/fulfillment/types";
import { resolveFulfillmentOrder } from "@/lib/roastify/resolve-fulfillment-order";
import type { UpsertWebsiteOrderInput } from "@/lib/orders/types";

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

export async function buildWebsiteOrderInput(
  paymentIntent: Stripe.PaymentIntent,
  options?: {
    roastifyOrderId?: string;
    fulfillmentStatus?: string;
    confirmationEmailSent?: boolean;
  }
): Promise<UpsertWebsiteOrderInput | null> {
  const fulfillmentOrder = await resolveFulfillmentOrder(paymentIntent);
  if (!fulfillmentOrder) {
    return null;
  }

  const customer =
    paymentIntent.customer && typeof paymentIntent.customer !== "string"
      ? paymentIntent.customer
      : null;
  const activeCustomer =
    customer && !("deleted" in customer && customer.deleted) ? customer : null;

  return {
    stripePaymentIntentId: paymentIntent.id,
    stripeCustomerId: fulfillmentOrder.stripeCustomerId ?? activeCustomer?.id,
    amountCents: paymentIntent.amount,
    currency: paymentIntent.currency,
    orderType: resolveOrderType(fulfillmentOrder.items),
    customerName:
      fulfillmentOrder.shipping.name ||
      activeCustomer?.name ||
      activeCustomer?.email ||
      undefined,
    customerEmail: fulfillmentOrder.shipping.email,
    shippingAddress: formatShippingAddress(fulfillmentOrder.shipping),
    items: fulfillmentOrder.items,
    roastifyOrderId:
      options?.roastifyOrderId ??
      paymentIntent.metadata?.ritl_roastify_order_id,
    fulfillmentStatus:
      options?.fulfillmentStatus ??
      paymentIntent.metadata?.ritl_fulfillment_status ??
      "created",
    confirmationEmailSent: options?.confirmationEmailSent,
  };
}

export function buildWebsiteOrderInputFromMetadata(
  paymentIntent: Stripe.PaymentIntent
): UpsertWebsiteOrderInput | null {
  const items = parseFulfillmentLineItems(paymentIntent.metadata?.ritl_items);
  if (items.length === 0) {
    return null;
  }

  const customer =
    paymentIntent.customer && typeof paymentIntent.customer !== "string"
      ? paymentIntent.customer
      : null;
  const activeCustomer =
    customer && !("deleted" in customer && customer.deleted) ? customer : null;

  const shipping = paymentIntent.shipping;
  const shippingAddress = shipping?.address?.line1
    ? [
        shipping.name,
        shipping.address.line1,
        shipping.address.line2,
        [shipping.address.city, shipping.address.state, shipping.address.postal_code]
          .filter(Boolean)
          .join(", "),
        shipping.address.country,
      ]
        .filter(Boolean)
        .join("\n")
    : undefined;

  return {
    stripePaymentIntentId: paymentIntent.id,
    stripeCustomerId:
      typeof paymentIntent.customer === "string"
        ? paymentIntent.customer
        : paymentIntent.customer?.id,
    amountCents: paymentIntent.amount,
    currency: paymentIntent.currency,
    orderType: resolveOrderType(items),
    customerName:
      shipping?.name ??
      activeCustomer?.name ??
      activeCustomer?.email ??
      undefined,
    customerEmail:
      paymentIntent.receipt_email ?? activeCustomer?.email ?? undefined,
    shippingAddress,
    items,
    roastifyOrderId: paymentIntent.metadata?.ritl_roastify_order_id,
    fulfillmentStatus:
      paymentIntent.metadata?.ritl_fulfillment_status ?? "created",
    confirmationEmailSent:
      paymentIntent.metadata?.ritl_confirmation_email_sent === "true",
  };
}
