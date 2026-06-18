import type Stripe from "stripe";
import {
  getRoastifyOrderStatus,
  getRoastifyOrderTracking,
} from "@/lib/roastify/parse-order";
import type { RoastifyOrderDetail } from "@/lib/roastify/types";
import { isStripeSecretConfigured } from "@/lib/stripe/config";
import { getStripe } from "@/lib/stripe/server";

export async function findPaymentIntentByRoastifyOrderId(
  roastifyOrderId: string
): Promise<Stripe.PaymentIntent | null> {
  if (!isStripeSecretConfigured()) {
    return null;
  }

  const stripe = getStripe();
  const escapedOrderId = roastifyOrderId.replaceAll("'", "\\'");
  const result = await stripe.paymentIntents.search({
    query: `metadata['ritl_roastify_order_id']:'${escapedOrderId}'`,
    limit: 1,
  });

  return result.data[0] ?? null;
}

export async function syncRoastifyMetadataToStripe(
  paymentIntent: Stripe.PaymentIntent,
  roastifyOrder: RoastifyOrderDetail
): Promise<void> {
  const roastifyStatus = getRoastifyOrderStatus(roastifyOrder);
  if (!roastifyStatus) {
    return;
  }

  const metadata = paymentIntent.metadata ?? {};
  const tracking = getRoastifyOrderTracking(roastifyOrder);
  const updates: Record<string, string> = {};

  if (metadata.ritl_fulfillment_status !== roastifyStatus) {
    updates.ritl_fulfillment_status = roastifyStatus;
  }

  if (
    roastifyOrder.orderId &&
    metadata.ritl_roastify_order_id !== roastifyOrder.orderId
  ) {
    updates.ritl_roastify_order_id = roastifyOrder.orderId;
  }

  if (
    tracking.trackingNumber &&
    metadata.ritl_tracking_number !== tracking.trackingNumber
  ) {
    updates.ritl_tracking_number = tracking.trackingNumber;
  }

  if (tracking.trackingUrl && metadata.ritl_tracking_url !== tracking.trackingUrl) {
    updates.ritl_tracking_url = tracking.trackingUrl;
  }

  if (tracking.carrier && metadata.ritl_carrier !== tracking.carrier) {
    updates.ritl_carrier = tracking.carrier;
  }

  if (Object.keys(updates).length === 0) {
    return;
  }

  const stripe = getStripe();
  await stripe.paymentIntents.update(paymentIntent.id, {
    metadata: {
      ...metadata,
      ...updates,
    },
  });
}
