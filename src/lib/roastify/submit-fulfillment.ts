import type Stripe from "stripe";
import { isRoastifyConfigured } from "@/lib/roastify/config";
import { buildRoastifyOrder } from "@/lib/roastify/build-order";
import { createRoastifyOrder } from "@/lib/roastify/client";
import { resolveFulfillmentOrder } from "@/lib/roastify/resolve-fulfillment-order";
import {
  getOrderByStripePaymentIntentId,
  linkRoastifyOrderToWebsiteOrder,
  tryClaimRoastifySubmission,
  upsertWebsiteOrder,
} from "@/lib/orders/repository";
import { buildWebsiteOrderInput } from "@/lib/orders/from-stripe";
import { isOrdersDatabaseConfigured } from "@/lib/supabase/config";
import { getStripe } from "@/lib/stripe/server";

const ROASTIFY_SUBMIT_WAIT_MS = 15_000;
const ROASTIFY_SUBMIT_POLL_MS = 500;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForExistingRoastifyOrderId(
  paymentIntentId: string
): Promise<string | null> {
  const stripe = getStripe();
  const deadline = Date.now() + ROASTIFY_SUBMIT_WAIT_MS;

  while (Date.now() < deadline) {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    const metadataOrderId = paymentIntent.metadata?.ritl_roastify_order_id?.trim();
    if (metadataOrderId) {
      return metadataOrderId;
    }

    const order = await getOrderByStripePaymentIntentId(paymentIntentId);
    if (order?.roastify_order_id) {
      return order.roastify_order_id;
    }

    await sleep(ROASTIFY_SUBMIT_POLL_MS);
  }

  return null;
}

export async function submitRoastifyFulfillment(
  paymentIntent: Stripe.PaymentIntent
): Promise<void> {
  if (!isRoastifyConfigured()) {
    console.warn(
      "Roastify fulfillment skipped: ROASTIFY_API_KEY is not configured"
    );
    return;
  }

  const stripe = getStripe();
  const fullPaymentIntent = await stripe.paymentIntents.retrieve(paymentIntent.id);

  if (fullPaymentIntent.metadata?.ritl_roastify_order_id) {
    return;
  }

  const fulfillmentOrder = await resolveFulfillmentOrder(fullPaymentIntent);
  if (!fulfillmentOrder) {
    console.warn(
      `Roastify fulfillment skipped for ${fullPaymentIntent.id}: missing shipping or line items`
    );
    return;
  }

  if (isOrdersDatabaseConfigured()) {
    try {
      const orderInput = await buildWebsiteOrderInput(fullPaymentIntent);
      if (orderInput) {
        await upsertWebsiteOrder(orderInput);
      }
    } catch (error) {
      console.error(
        `Failed to persist order before Roastify submit for ${fullPaymentIntent.id}:`,
        error
      );
    }

    const claimed = await tryClaimRoastifySubmission(fullPaymentIntent.id);
    if (!claimed) {
      const existingOrderId = await waitForExistingRoastifyOrderId(
        fullPaymentIntent.id
      );
      if (existingOrderId) {
        console.info(
          `Roastify submission skipped for ${fullPaymentIntent.id}; existing order ${existingOrderId}`
        );
        return;
      }

      console.warn(
        `Roastify submission not claimed for ${fullPaymentIntent.id}; skipping duplicate create`
      );
      return;
    }
  }

  const roastifyOrder = buildRoastifyOrder(fulfillmentOrder);
  const response = await createRoastifyOrder(
    roastifyOrder,
    `ritl-${fullPaymentIntent.id}`
  );

  await stripe.paymentIntents.update(fullPaymentIntent.id, {
    metadata: {
      ...fullPaymentIntent.metadata,
      ritl_roastify_order_id: response.orderId,
      ritl_fulfillment_status: response.status ?? "created",
    },
  });

  if (isOrdersDatabaseConfigured()) {
    try {
      const orderInput = await buildWebsiteOrderInput(fullPaymentIntent, {
        roastifyOrderId: response.orderId,
        fulfillmentStatus: response.status ?? "created",
      });
      if (orderInput) {
        await upsertWebsiteOrder(orderInput);
      } else {
        await linkRoastifyOrderToWebsiteOrder({
          stripePaymentIntentId: fullPaymentIntent.id,
          roastifyOrderId: response.orderId,
          fulfillmentStatus: response.status ?? "created",
        });
      }
    } catch (error) {
      console.error(
        `Failed to persist Roastify order link for ${fullPaymentIntent.id}:`,
        error
      );
    }
  }

  console.info(
    `Roastify order ${response.orderId} created for payment ${fullPaymentIntent.id}`
  );
}
