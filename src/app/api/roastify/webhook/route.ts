import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { sendOrderStageUpdateEmail } from "@/lib/email/send-order-stage-update";
import { getRoastifyOrder } from "@/lib/roastify/client";
import {
  parseRoastifyWebhookPayload,
  resolveStageFromWebhookEvent,
} from "@/lib/roastify/stage-emails";
import {
  findPaymentIntentByRoastifyOrderId,
  syncRoastifyMetadataToStripe,
} from "@/lib/roastify/sync-stripe-metadata";

function getWebhookSecret(): string | undefined {
  return process.env.ROASTIFY_WEBHOOK_SECRET?.trim();
}

export async function POST(request: NextRequest) {
  const webhookSecret = getWebhookSecret();
  if (!webhookSecret) {
    return NextResponse.json(
      { error: "ROASTIFY_WEBHOOK_SECRET is not configured" },
      { status: 500 }
    );
  }

  const payload = await request.text();
  const svixId = request.headers.get("svix-id");
  const svixTimestamp = request.headers.get("svix-timestamp");
  const svixSignature = request.headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json(
      { error: "Missing Svix signature headers" },
      { status: 400 }
    );
  }

  let event: unknown;
  try {
    const wh = new Webhook(webhookSecret);
    event = wh.verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Webhook signature verification failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const { eventType, orderId } = parseRoastifyWebhookPayload(event);
  if (!eventType) {
    return NextResponse.json({ ok: true, skipped: "missing_event_type" });
  }

  const stage = resolveStageFromWebhookEvent(eventType);
  if (!stage) {
    return NextResponse.json({ ok: true, skipped: eventType });
  }

  if (!orderId) {
    console.warn(`Roastify webhook ${eventType} missing orderId (svix-id ${svixId})`);
    return NextResponse.json({ ok: true, skipped: "missing_order_id" });
  }

  if (orderId) {
    const paymentIntent = await findPaymentIntentByRoastifyOrderId(orderId);
    const processedIds =
      paymentIntent?.metadata?.ritl_webhook_ids_processed
        ?.split(",")
        .filter(Boolean) ?? [];

    if (processedIds.includes(svixId)) {
      return NextResponse.json({ ok: true, duplicate: true });
    }
  }

  let roastifyOrder;
  try {
    roastifyOrder = await getRoastifyOrder(orderId);
  } catch (error) {
    console.error(`Roastify webhook order lookup failed for ${orderId}:`, error);
    return NextResponse.json(
      { error: "Failed to load order from Roastify" },
      { status: 502 }
    );
  }

  const paymentIntent = await findPaymentIntentByRoastifyOrderId(orderId);
  if (paymentIntent) {
    try {
      await syncRoastifyMetadataToStripe(paymentIntent, roastifyOrder, {
        notifyCustomer: false,
        webhookId: svixId,
      });
    } catch (error) {
      console.error(
        `Stripe metadata sync failed for Roastify order ${orderId}:`,
        error
      );
    }
  }

  const result = await sendOrderStageUpdateEmail({
    roastifyOrderId: orderId,
    stage,
    webhookId: svixId,
    roastifyOrder,
  });

  console.info(
    `Roastify webhook ${eventType} for ${orderId}: email=${result} (svix-id ${svixId})`
  );

  return NextResponse.json({
    ok: true,
    eventType,
    stage,
    orderId,
    email: result,
  });
}
