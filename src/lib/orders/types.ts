import type { AdminOrderType } from "@/lib/admin/format";
import type { FulfillmentLineItem } from "@/lib/fulfillment/types";

export type OrderSource = "website" | "wholesale";

export interface OrderRecord {
  id: string;
  source: OrderSource;
  stripe_payment_intent_id: string | null;
  stripe_customer_id: string | null;
  amount_cents: number;
  currency: string;
  order_type: AdminOrderType | null;
  customer_name: string | null;
  customer_email: string | null;
  shipping_address: string | null;
  items: FulfillmentLineItem[];
  roastify_order_id: string | null;
  fulfillment_status: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  carrier: string | null;
  roastify_updated_at: string | null;
  roastify_submit_claimed_at: string | null;
  confirmation_email_sent_at: string | null;
  stage_emails_sent: string[];
  webhook_ids_processed: string[];
  created_at: string;
  updated_at: string;
}

export interface UpsertWebsiteOrderInput {
  stripePaymentIntentId: string;
  stripeCustomerId?: string;
  amountCents: number;
  currency: string;
  orderType?: AdminOrderType;
  customerName?: string;
  customerEmail?: string;
  shippingAddress?: string;
  items: FulfillmentLineItem[];
  roastifyOrderId?: string;
  fulfillmentStatus?: string;
  confirmationEmailSent?: boolean;
}

export interface ApplyRoastifyWebhookInput {
  roastifyOrderId: string;
  eventType: string;
  webhookId: string;
  fulfillmentStatus?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  carrier?: string;
  roastifyUpdatedAt?: string;
  customerName?: string;
  customerEmail?: string;
  shippingAddress?: string;
}

export interface ApplyRoastifyWebhookResult {
  order: OrderRecord | null;
  stage: string | null;
  email: "sent" | "skipped" | "failed" | "not_applicable";
  duplicate: boolean;
}
