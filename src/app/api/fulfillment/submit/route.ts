import { NextRequest, NextResponse } from "next/server";
import { sendOrderConfirmationEmail } from "@/lib/email/send-order-confirmation";
import { buildWebsiteOrderInput } from "@/lib/orders/from-stripe";
import { upsertWebsiteOrder } from "@/lib/orders/repository";
import { submitRoastifyFulfillment } from "@/lib/roastify/submit-fulfillment";
import { syncCustomerFromPaymentIntent } from "@/lib/stripe/checkout-customer";
import { isStripeSecretConfigured } from "@/lib/stripe/config";
import { isOrdersDatabaseConfigured } from "@/lib/supabase/config";
import { getStripe } from "@/lib/stripe/server";

export async function POST(request: NextRequest) {
  if (!isStripeSecretConfigured()) {
    return NextResponse.json(
      { error: "Stripe is not configured" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const paymentIntentId =
      typeof body.paymentIntentId === "string" ? body.paymentIntentId.trim() : "";

    if (!paymentIntentId.startsWith("pi_")) {
      return NextResponse.json(
        { error: "A valid paymentIntentId is required" },
        { status: 400 }
      );
    }

    const stripe = getStripe();
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== "succeeded") {
      return NextResponse.json(
        { error: "Payment has not succeeded" },
        { status: 400 }
      );
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

    return NextResponse.json({
      roastifyOrderId: updated.metadata?.ritl_roastify_order_id ?? null,
      fulfillmentStatus: updated.metadata?.ritl_fulfillment_status ?? null,
    });
  } catch (error) {
    console.error("Fulfillment submit failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to submit fulfillment";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
