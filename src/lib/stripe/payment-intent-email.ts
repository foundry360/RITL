import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe/server";

export async function readPaymentIntentCustomerEmail(
  paymentIntent: Stripe.PaymentIntent
): Promise<string | undefined> {
  const receiptEmail = paymentIntent.receipt_email?.trim().toLowerCase();
  if (receiptEmail) {
    return receiptEmail;
  }

  const customerId =
    typeof paymentIntent.customer === "string"
      ? paymentIntent.customer
      : paymentIntent.customer?.id;

  if (!customerId) {
    return undefined;
  }

  const stripe = getStripe();
  const customer = await stripe.customers.retrieve(customerId);

  if (customer.deleted) {
    return undefined;
  }

  return customer.email?.trim().toLowerCase();
}
