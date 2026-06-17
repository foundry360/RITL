import type Stripe from "stripe";
import { parseFulfillmentLineItems } from "@/lib/fulfillment/parse-items";
import type { FulfillmentOrder } from "@/lib/fulfillment/types";
import { getStripe } from "@/lib/stripe/server";

function getShippingFromPaymentIntent(
  paymentIntent: Stripe.PaymentIntent,
  email?: string
): FulfillmentOrder["shipping"] | null {
  const shipping = paymentIntent.shipping;
  if (!shipping?.name || !shipping.address?.line1 || !shipping.address.country) {
    return null;
  }

  return {
    name: shipping.name,
    line1: shipping.address.line1,
    line2: shipping.address.line2 ?? undefined,
    city: shipping.address.city ?? "",
    state: shipping.address.state ?? "",
    postalCode: shipping.address.postal_code ?? "",
    country: shipping.address.country,
    phone: shipping.phone ?? undefined,
    email,
  };
}

async function resolveLineItems(
  stripe: Stripe,
  paymentIntent: Stripe.PaymentIntent
): Promise<ReturnType<typeof parseFulfillmentLineItems>> {
  const fromPaymentIntent = parseFulfillmentLineItems(
    paymentIntent.metadata?.ritl_items
  );
  if (fromPaymentIntent.length > 0) {
    return fromPaymentIntent;
  }

  const invoiceId = paymentIntent.payment_details?.order_reference;
  if (!invoiceId?.startsWith("in_")) {
    return [];
  }

  const invoice = await stripe.invoices.retrieve(invoiceId);

  const subscriptionId =
    invoice.parent?.subscription_details?.subscription;

  if (typeof subscriptionId === "string") {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    return parseFulfillmentLineItems(subscription.metadata?.ritl_items);
  }

  return parseFulfillmentLineItems(invoice.metadata?.ritl_items);
}

async function resolveCustomerEmail(
  stripe: Stripe,
  paymentIntent: Stripe.PaymentIntent
): Promise<string | undefined> {
  if (paymentIntent.receipt_email) {
    return paymentIntent.receipt_email;
  }

  const customerId =
    typeof paymentIntent.customer === "string"
      ? paymentIntent.customer
      : paymentIntent.customer?.id;

  if (!customerId) {
    return undefined;
  }

  const customer = await stripe.customers.retrieve(customerId);
  if (customer.deleted) {
    return undefined;
  }

  return customer.email ?? undefined;
}

export async function resolveFulfillmentOrder(
  paymentIntent: Stripe.PaymentIntent
): Promise<FulfillmentOrder | null> {
  const stripe = getStripe();
  const email = await resolveCustomerEmail(stripe, paymentIntent);
  const shipping = getShippingFromPaymentIntent(paymentIntent, email);
  const items = await resolveLineItems(stripe, paymentIntent);

  if (!shipping || items.length === 0) {
    return null;
  }

  const stripeCustomerId =
    typeof paymentIntent.customer === "string"
      ? paymentIntent.customer
      : paymentIntent.customer?.id;

  return {
    stripePaymentIntentId: paymentIntent.id,
    stripeCustomerId,
    items,
    shipping,
  };
}
