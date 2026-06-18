import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { revalidateStripePricing } from "@/lib/stripe/fetch-prices";
import { syncCustomerFromPaymentIntent } from "@/lib/stripe/checkout-customer";
import { sendOrderConfirmationEmail } from "@/lib/email/send-order-confirmation";
import { submitRoastifyFulfillment } from "@/lib/roastify/submit-fulfillment";
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
        await sendOrderConfirmationEmail(paymentIntent);
      } catch (error) {
        console.error("Order confirmation email failed:", error);
      }

      try {
        await submitRoastifyFulfillment(paymentIntent);
      } catch (error) {
        console.error("Roastify fulfillment failed:", error);
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
