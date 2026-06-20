import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { markAbandonedCheckoutConverted } from "@/lib/abandoned-checkout/repository";
import { revalidateStripePricing } from "@/lib/stripe/fetch-prices";
import { syncCustomerFromPaymentIntent } from "@/lib/stripe/checkout-customer";
import { readPaymentIntentCustomerEmail } from "@/lib/stripe/payment-intent-email";
import { sendOrderConfirmationEmail } from "@/lib/email/send-order-confirmation";
import { submitRoastifyFulfillment } from "@/lib/roastify/submit-fulfillment";
import { buildWebsiteOrderInput } from "@/lib/orders/from-stripe";
import { upsertWebsiteOrder } from "@/lib/orders/repository";
import { isOrdersDatabaseConfigured } from "@/lib/supabase/config";
import { getStripe } from "@/lib/stripe/server";

const PRICE_EVENTS = new Set([
  "price.created",
  "price.updated",
  "price.deleted",
  "product.updated",
]);

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();

  if (!webhookSecret) {
    return NextResponse.json(
      { error: "STRIPE_WEBHOOK_SECRET is not configured" },
      { status: 500 }
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  const payload = await request.text();

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Webhook signature verification failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    if (PRICE_EVENTS.has(event.type)) {
      revalidateStripePricing();
    }

    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      await syncCustomerFromPaymentIntent(paymentIntent);

      try {
        const customerEmail = await readPaymentIntentCustomerEmail(paymentIntent);
        if (customerEmail) {
          await markAbandonedCheckoutConverted(customerEmail);
        }
      } catch (error) {
        console.error("Failed to mark abandoned checkout converted:", error);
      }

      if (isOrdersDatabaseConfigured()) {
        try {
          const stripe = getStripe();
          const fullPaymentIntent = await stripe.paymentIntents.retrieve(
            paymentIntent.id,
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

      try {
        await sendOrderConfirmationEmail(paymentIntent);
      } catch (error) {
        console.error("Order confirmation email failed:", error);
      }

      try {
        await submitRoastifyFulfillment(paymentIntent);
      } catch (error) {
        console.error("Roastify fulfillment failed:", error);
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

            const stripe = getStripe();
            const orderPaymentIntent = await stripe.paymentIntents.retrieve(
              paymentIntent.id
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
    }
  } catch (error) {
    console.error(`Stripe webhook handler failed for ${event.type}:`, error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
