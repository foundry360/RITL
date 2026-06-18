import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { applyRoastifyWebhookUpdate } from "@/lib/orders/repository";
import { getRoastifyOrder } from "@/lib/roastify/client";
import {
  getRoastifyOrderStatus,
  getRoastifyOrderTracking,
} from "@/lib/roastify/parse-order";
import {
  parseRoastifyWebhookPayload,
  resolveStageFromWebhookEvent,
} from "@/lib/roastify/stage-emails";
import { sendOrderStageUpdateEmail } from "@/lib/email/send-order-stage-update";
import { isOrdersDatabaseConfigured } from "@/lib/supabase/config";
import {
  findPaymentIntentByRoastifyOrderId,
  syncRoastifyMetadataToStripe,
} from "@/lib/roastify/sync-stripe-metadata";

function getWebhookSecret(): string | undefined {
  return process.env.ROASTIFY_WEBHOOK_SECRET?.trim();
}

function formatShippingAddress(
  order: Awaited<ReturnType<typeof getRoastifyOrder>>
): string | undefined {
  const address = order.toAddress;
  if (!address?.street1) {
    return undefined;
  }

  return [
    address.name,
    address.street1,
    address.street2,
    [address.city, address.state, address.zip].filter(Boolean).join(", "),
    address.country,
  ]
    .filter(Boolean)
    .join("\n");
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

  const tracking = getRoastifyOrderTracking(roastifyOrder);
  const fulfillmentStatus = getRoastifyOrderStatus(roastifyOrder);

  if (isOrdersDatabaseConfigured()) {
    const result = await applyRoastifyWebhookUpdate({
      roastifyOrderId: orderId,
      eventType,
      webhookId: svixId,
      fulfillmentStatus,
      trackingNumber: tracking.trackingNumber,
      trackingUrl: tracking.trackingUrl,
      carrier: tracking.carrier,
      roastifyUpdatedAt: roastifyOrder.updatedAt,
      customerName: roastifyOrder.toAddress?.name ?? undefined,
      customerEmail: roastifyOrder.toAddress?.email ?? undefined,
      shippingAddress: formatShippingAddress(roastifyOrder),
    });

    console.info(
      `Roastify webhook ${eventType} for ${orderId}: db email=${result.email} duplicate=${result.duplicate}`
    );

    return NextResponse.json({
      ok: true,
      eventType,
      stage: result.stage,
      orderId,
      email: result.email,
      duplicate: result.duplicate,
      storage: "supabase",
    });
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

  const email = await sendOrderStageUpdateEmail({
    roastifyOrderId: orderId,
    stage,
    webhookId: svixId,
    roastifyOrder,
    paymentIntent,
  });

  return NextResponse.json({
    ok: true,
    eventType,
    stage,
    orderId,
    email,
    storage: "stripe_metadata_only",
    warning: "SUPABASE_SERVICE_ROLE_KEY not configured; order not stored in database",
  });
}
