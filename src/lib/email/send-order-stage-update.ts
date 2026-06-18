import type Stripe from "stripe";
import { Resend } from "resend";
import {
  getContactFromAddress,
  isContactEmailConfigured,
} from "@/lib/contact/config";
import { buildTransactionalEmail } from "@/lib/email/order-notifications";
import { getRoastifyOrder } from "@/lib/roastify/client";
import { getRoastifyOrderTracking } from "@/lib/roastify/parse-order";
import {
  formatStageLabel,
  getStageEmailCopy,
  type RoastifyStageEmailStage,
} from "@/lib/roastify/stage-emails";
import type { OrderRecord } from "@/lib/orders/types";
import type { RoastifyOrderDetail } from "@/lib/roastify/types";

function readCustomerEmail(
  orderRecord: OrderRecord | undefined,
  roastifyOrder: RoastifyOrderDetail
): string | undefined {
  return (
    orderRecord?.customer_email?.trim().toLowerCase() ||
    roastifyOrder.toAddress?.email?.trim().toLowerCase() ||
    undefined
  );
}

function readCustomerName(
  orderRecord: OrderRecord | undefined,
  roastifyOrder: RoastifyOrderDetail
): string {
  return (
    orderRecord?.customer_name?.trim() ||
    roastifyOrder.toAddress?.name?.trim() ||
    "there"
  );
}

export async function sendOrderStageUpdateEmail(input: {
  roastifyOrderId: string;
  stage: RoastifyStageEmailStage;
  webhookId?: string;
  roastifyOrder?: RoastifyOrderDetail;
  orderRecord?: OrderRecord;
  paymentIntent?: Stripe.PaymentIntent | null;
}): Promise<"sent" | "skipped" | "failed"> {
  if (!isContactEmailConfigured()) {
    console.warn(
      "Order stage email skipped: RESEND_API_KEY is not configured"
    );
    return "skipped";
  }

  if (
    input.stage === "created" &&
    (input.orderRecord?.confirmation_email_sent_at ||
      input.paymentIntent?.metadata?.ritl_confirmation_email_sent === "true")
  ) {
    return "skipped";
  }

  let roastifyOrder = input.roastifyOrder;
  if (!roastifyOrder) {
    try {
      roastifyOrder = await getRoastifyOrder(input.roastifyOrderId);
    } catch (error) {
      console.error(
        `Order stage email failed: Roastify lookup for ${input.roastifyOrderId}`,
        error
      );
      return "failed";
    }
  }

  const recipientEmail = readCustomerEmail(input.orderRecord, roastifyOrder);
  if (!recipientEmail) {
    console.warn(
      `Order stage email skipped for ${input.roastifyOrderId}: no customer email`
    );
    return "skipped";
  }

  if (
    input.orderRecord &&
    input.orderRecord.stage_emails_sent
      .map((entry) => entry.toLowerCase())
      .includes(input.stage.toLowerCase()) &&
    input.stage !== "tracking"
  ) {
    return "skipped";
  }

  const tracking = getRoastifyOrderTracking(roastifyOrder);
  const copy = getStageEmailCopy(input.stage);
  const orderReference =
    input.orderRecord?.stripe_payment_intent_id ??
    input.paymentIntent?.id ??
    input.roastifyOrderId;

  const { text, html } = buildTransactionalEmail({
    headline: copy.headline,
    body: copy.body,
    paragraphs: copy.paragraphs,
    closingLines: copy.closingLines,
    showStageBadge: copy.showStageBadge,
    trackingLayout: copy.trackingLayout,
    customerName: readCustomerName(input.orderRecord, roastifyOrder),
    orderReference,
    stageLabel: formatStageLabel(input.stage),
    trackingNumber:
      tracking.trackingNumber ?? input.orderRecord?.tracking_number ?? undefined,
    trackingUrl: tracking.trackingUrl ?? input.orderRecord?.tracking_url ?? undefined,
    carrier: tracking.carrier ?? input.orderRecord?.carrier ?? undefined,
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

  console.info(
    `Order stage email sent for Roastify order ${input.roastifyOrderId} (${input.stage}) to ${recipientEmail}`
  );
  return "sent";
}
