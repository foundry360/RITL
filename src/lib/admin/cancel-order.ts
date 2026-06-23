import type { AdminOrderRow } from "@/lib/admin/orders";
import { getAdminOrder } from "@/lib/admin/orders";
import {
  cancelRoastifyOrder,
  getRoastifyOrder,
} from "@/lib/roastify/client";
import { isRoastifyConfigured } from "@/lib/roastify/config";
import { getRoastifyOrderStatus } from "@/lib/roastify/parse-order";
import { syncRoastifyMetadataToStripe } from "@/lib/roastify/sync-stripe-metadata";
import {
  getOrderById,
  syncOrderFulfillmentFromRoastify,
} from "@/lib/orders/repository";
import { orderRecordToAdminRow } from "@/lib/orders/to-admin";
import { isOrdersDatabaseConfigured } from "@/lib/supabase/config";
import { isStripeSecretConfigured } from "@/lib/stripe/config";
import { getStripe } from "@/lib/stripe/server";

function normalizeStatus(status?: string): string | undefined {
  const normalized = status?.trim().toLowerCase();
  return normalized || undefined;
}

export function canCancelAdminOrder(order: Pick<AdminOrderRow, "roastifyOrderId" | "roastifyStatus">): boolean {
  if (!order.roastifyOrderId) {
    return false;
  }

  const status = normalizeStatus(order.roastifyStatus);
  if (!status) {
    return true;
  }

  return status === "created";
}

export async function cancelAdminOrder(orderId: string): Promise<AdminOrderRow> {
  if (!isRoastifyConfigured()) {
    throw new Error("Roastify is not configured");
  }

  const order = await getAdminOrder(orderId);
  if (!order) {
    throw new Error("Order not found");
  }

  if (!canCancelAdminOrder(order)) {
    throw new Error("Only Roastify orders in Created status can be canceled");
  }

  const roastifyOrderId = order.roastifyOrderId!;
  await cancelRoastifyOrder(roastifyOrderId);

  const roastifyOrder = await getRoastifyOrder(roastifyOrderId);
  const roastifyStatus = getRoastifyOrderStatus(roastifyOrder);

  if (isOrdersDatabaseConfigured()) {
    const record = await getOrderById(orderId);
    if (record) {
      const synced = await syncOrderFulfillmentFromRoastify(record, roastifyOrder);
      return orderRecordToAdminRow(synced.order);
    }
  }

  if (isStripeSecretConfigured() && order.id.startsWith("pi_")) {
    const stripe = getStripe();
    const paymentIntent = await stripe.paymentIntents.retrieve(order.id);
    await syncRoastifyMetadataToStripe(paymentIntent, roastifyOrder, {
      notifyCustomer: false,
      syncGhl: true,
    });
  }

  return {
    ...order,
    roastifyStatus: roastifyStatus ?? "canceled",
  };
}
