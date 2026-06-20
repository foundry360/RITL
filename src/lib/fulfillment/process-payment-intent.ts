import { sendOrderConfirmationEmail } from "@/lib/email/send-order-confirmation";
import { buildWebsiteOrderInput } from "@/lib/orders/from-stripe";
import { upsertWebsiteOrder } from "@/lib/orders/repository";
import { submitRoastifyFulfillment } from "@/lib/roastify/submit-fulfillment";
import { syncCustomerFromPaymentIntent } from "@/lib/stripe/checkout-customer";
import { isOrdersDatabaseConfigured } from "@/lib/supabase/config";
import { getStripe } from "@/lib/stripe/server";

export interface ProcessPaymentIntentResult {
  roastifyOrderId: string | null;
  fulfillmentStatus: string | null;
}

export async function processSuccessfulPaymentIntent(
  paymentIntentId: string
): Promise<ProcessPaymentIntentResult> {
  if (!paymentIntentId.startsWith("pi_")) {
    throw new Error("A valid paymentIntentId is required");
  }

  const stripe = getStripe();
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

  if (paymentIntent.status !== "succeeded") {
    throw new Error("Payment has not succeeded");
  }

  await syncCustomerFromPaymentIntent(paymentIntent);

  if (isOrdersDatabaseConfigured()) {
    try {
      const fullPaymentIntent = await stripe.paymentIntents.retrieve(
        paymentIntentId,
        { expand: ["customer"] }
      );
      const orderInput = await buildWebsiteOrderInput(fullPaymentIntent);
      if (orderInput) {
        await upsertWebsiteOrder(orderInput);
      }
    } catch (error) {
      console.error("Failed to persist order in Supabase:", error);
    }
  }

  if (!paymentIntent.metadata?.ritl_roastify_order_id) {
    await submitRoastifyFulfillment(paymentIntent);
  }

  if (paymentIntent.metadata?.ritl_confirmation_email_sent !== "true") {
    try {
      await sendOrderConfirmationEmail(paymentIntent);
    } catch (error) {
      console.error("Order confirmation email failed:", error);
    }
  }

  if (process.env.GHL_API_TOKEN?.trim() && process.env.GHL_LOCATION_ID?.trim()) {
    try {
      const { syncGhlContactFromPaymentIntent } = await import(
        "@/lib/gohighlevel/sync-contact"
      );
      const { syncGhlOrderFromPaymentIntent } = await import(
        "@/lib/gohighlevel/sync-order"
      );
      const contactResult = await syncGhlContactFromPaymentIntent(paymentIntent);
      if (contactResult) {
        console.info(
          `GoHighLevel ${contactResult.created ? "created" : "updated"} contact ${contactResult.contactId}`
        );

        const orderPaymentIntent = await stripe.paymentIntents.retrieve(
          paymentIntentId
        );
        const orderResult = await syncGhlOrderFromPaymentIntent(
          orderPaymentIntent,
          contactResult.contactId
        );
        if (orderResult) {
          console.info(
            `GoHighLevel ${orderResult.created ? "created" : "updated"} order ${orderResult.orderRecordId}`
          );
        }
      }
    } catch (error) {
      console.error("GoHighLevel sync failed:", error);
    }
  }

  if (process.env.SALESFORCE_REFRESH_TOKEN?.trim()) {
    try {
      const { syncSalesforceCustomerFromPaymentIntent } = await import(
        "@/lib/salesforce/sync-customer"
      );
      const result = await syncSalesforceCustomerFromPaymentIntent(paymentIntent);
      if (result) {
        console.info(
          `Salesforce ${result.created ? "created" : "updated"} contact ${result.contactId}`
        );
      }
    } catch (error) {
      console.error("Salesforce customer sync failed:", error);
    }
  }

  const updated = await stripe.paymentIntents.retrieve(paymentIntentId);

  return {
    roastifyOrderId: updated.metadata?.ritl_roastify_order_id ?? null,
    fulfillmentStatus: updated.metadata?.ritl_fulfillment_status ?? null,
  };
}
