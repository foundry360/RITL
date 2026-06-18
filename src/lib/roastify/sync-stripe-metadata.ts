import type Stripe from "stripe";
import { sendOrderStageUpdateEmail } from "@/lib/email/send-order-stage-update";
import {
  getRoastifyOrderStatus,
  getRoastifyOrderTracking,
} from "@/lib/roastify/parse-order";
import { mapRoastifyStatusToStage } from "@/lib/roastify/stage-emails";
import type { RoastifyOrderDetail } from "@/lib/roastify/types";
import { isStripeSecretConfigured } from "@/lib/stripe/config";
import { getStripe } from "@/lib/stripe/server";

export interface SyncRoastifyMetadataOptions {
  notifyCustomer?: boolean;
  webhookId?: string;
}

export async function notifyRoastifyStageEmailIfNeeded(
  roastifyOrder: RoastifyOrderDetail,
  options?: Pick<SyncRoastifyMetadataOptions, "webhookId">
): Promise<"sent" | "skipped" | "failed" | "not_applicable"> {
  const stage = mapRoastifyStatusToStage(getRoastifyOrderStatus(roastifyOrder));
  if (!stage) {
    return "not_applicable";
  }

  return sendOrderStageUpdateEmail({
    roastifyOrderId: roastifyOrder.orderId,
    stage,
    roastifyOrder,
    webhookId: options?.webhookId,
  });
}

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
  roastifyOrder: RoastifyOrderDetail,
  options?: SyncRoastifyMetadataOptions
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

  if (Object.keys(updates).length > 0) {
    const stripe = getStripe();
    await stripe.paymentIntents.update(paymentIntent.id, {
      metadata: {
        ...metadata,
        ...updates,
      },
    });
  }

  if (options?.notifyCustomer === false) {
    return;
  }

  try {
    const emailResult = await notifyRoastifyStageEmailIfNeeded(roastifyOrder, {
      webhookId: options?.webhookId,
    });
    if (emailResult === "sent") {
      console.info(
        `Stage email sent during Roastify sync for order ${roastifyOrder.orderId}`
      );
    }
  } catch (error) {
    console.error(
      `Stage email failed during Roastify sync for order ${roastifyOrder.orderId}:`,
      error
    );
  }
}
