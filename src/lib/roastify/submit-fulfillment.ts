import type Stripe from "stripe";
import { isRoastifyConfigured } from "@/lib/roastify/config";
import { buildRoastifyOrder } from "@/lib/roastify/build-order";
import { createRoastifyOrder } from "@/lib/roastify/client";
import { resolveFulfillmentOrder } from "@/lib/roastify/resolve-fulfillment-order";
import { getStripe } from "@/lib/stripe/server";

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

  console.info(
    `Roastify order ${response.orderId} created for payment ${fullPaymentIntent.id}`
  );
}
