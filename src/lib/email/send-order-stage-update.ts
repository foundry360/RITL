import type Stripe from "stripe";
import { Resend } from "resend";
import {
  getContactFromAddress,
  isContactEmailConfigured,
} from "@/lib/contact/config";
import {
  buildTransactionalEmail,
  hasStageEmailBeenSent,
  markStageEmailSent,
} from "@/lib/email/order-notifications";
import { getRoastifyOrder } from "@/lib/roastify/client";
import { getRoastifyOrderTracking } from "@/lib/roastify/parse-order";
import {
  formatStageLabel,
  getStageEmailCopy,
  type RoastifyStageEmailStage,
} from "@/lib/roastify/stage-emails";
import { syncRoastifyMetadataToStripe } from "@/lib/roastify/sync-stripe-metadata";
import type { RoastifyOrderDetail } from "@/lib/roastify/types";
import { getStripe } from "@/lib/stripe/server";

function readCustomerEmail(order: RoastifyOrderDetail): string | undefined {
  return order.toAddress?.email?.trim().toLowerCase() || undefined;
}

function readCustomerName(order: RoastifyOrderDetail): string {
  return order.toAddress?.name?.trim() || "there";
}

export async function sendOrderStageUpdateEmail(input: {
  roastifyOrderId: string;
  stage: RoastifyStageEmailStage;
  webhookId?: string;
  roastifyOrder?: RoastifyOrderDetail;
  paymentIntent?: Stripe.PaymentIntent | null;
}): Promise<"sent" | "skipped" | "failed"> {
  if (!isContactEmailConfigured()) {
    console.warn(
      "Order stage email skipped: RESEND_API_KEY is not configured"
    );
    return "skipped";
  }

  const paymentIntent = input.paymentIntent ?? null;

  if (
    input.stage === "created" &&
    paymentIntent?.metadata?.ritl_confirmation_email_sent === "true"
  ) {
    await markStageEmailSent({
      roastifyOrderId: input.roastifyOrderId,
      stage: input.stage,
      webhookId: input.webhookId,
      paymentIntent,
    });
    return "skipped";
  }

  let order = input.roastifyOrder;
  if (!order) {
    try {
      order = await getRoastifyOrder(input.roastifyOrderId);
    } catch (error) {
      console.error(
        `Order stage email failed: Roastify lookup for ${input.roastifyOrderId}`,
        error
      );
      return "failed";
    }
  }

  const recipientEmail = readCustomerEmail(order);
  if (!recipientEmail) {
    console.warn(
      `Order stage email skipped for ${input.roastifyOrderId}: no customer email`
    );
    return "skipped";
  }

  const alreadySent = await hasStageEmailBeenSent({
    roastifyOrderId: input.roastifyOrderId,
    stage: input.stage,
    customerEmail: recipientEmail,
    paymentIntent,
  });

  if (alreadySent && input.stage !== "tracking") {
    if (input.webhookId) {
      await markStageEmailSent({
        roastifyOrderId: input.roastifyOrderId,
        stage: input.stage,
        customerEmail: recipientEmail,
        webhookId: input.webhookId,
        paymentIntent,
      });
    }
    return "skipped";
  }

  if (paymentIntent) {
    try {
      await syncRoastifyMetadataToStripe(paymentIntent, order, {
        notifyCustomer: false,
      });
    } catch (error) {
      console.error(
        `Stripe metadata sync failed for Roastify order ${input.roastifyOrderId}`,
        error
      );
    }
  }

  const tracking = getRoastifyOrderTracking(order);
  const copy = getStageEmailCopy(input.stage);
  const orderReference = paymentIntent?.id ?? input.roastifyOrderId;
  const { text, html } = buildTransactionalEmail({
    headline: copy.headline,
    body: copy.body,
    customerName: readCustomerName(order),
    orderReference,
    stageLabel: formatStageLabel(input.stage),
    trackingNumber: tracking.trackingNumber,
    trackingUrl: tracking.trackingUrl,
    carrier: tracking.carrier,
  });

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: getContactFromAddress(),
    to: [recipientEmail],
    subject: copy.subject,
    text,
    html,
  });

  if (error) {
    console.error(
      `Order stage email failed for ${input.roastifyOrderId} (${input.stage}):`,
      error.message
    );
    return "failed";
  }

  await markStageEmailSent({
    roastifyOrderId: input.roastifyOrderId,
    stage: input.stage,
    customerEmail: recipientEmail,
    webhookId: input.webhookId,
    paymentIntent,
  });

  if (paymentIntent && input.stage === "shipped" && tracking.trackingNumber) {
    const stripe = getStripe();
    const fullPaymentIntent = await stripe.paymentIntents.retrieve(
      paymentIntent.id
    );
    await stripe.paymentIntents.update(paymentIntent.id, {
      metadata: {
        ...fullPaymentIntent.metadata,
        ritl_shipping_email_sent: "true",
      },
    });
  }

  console.info(
    `Order stage email sent for Roastify order ${input.roastifyOrderId} (${input.stage}) to ${recipientEmail}`
  );
  return "sent";
}
