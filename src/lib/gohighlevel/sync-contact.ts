import type Stripe from "stripe";
import { BRAND_NAME } from "@/lib/brand";
import { ghlRequest } from "@/lib/gohighlevel/client";
import {
  getGhlCustomerTags,
  getGhlLocationId,
  getGhlStripeCustomerFieldId,
} from "@/lib/gohighlevel/config";
import { getStripe } from "@/lib/stripe/server";

export interface GhlContactSyncInput {
  stripeCustomerId: string;
  email: string;
  name?: string;
  phone?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  lastPaymentIntentId?: string;
  lastOrderAmountCents?: number;
  lastOrderCurrency?: string;
}

export interface GhlContactSyncResult {
  contactId: string;
  created: boolean;
}

interface GhlContactRecord {
  id: string;
}

interface GhlUpsertContactResponse {
  new?: boolean;
  contact?: GhlContactRecord;
}

function splitName(fullName?: string): { firstName?: string; lastName?: string } {
  const trimmed = fullName?.trim();
  if (!trimmed) {
    return { lastName: `${BRAND_NAME} Customer` };
  }

  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) {
    return { lastName: parts[0] };
  }

  return {
    firstName: parts.slice(0, -1).join(" "),
    lastName: parts.at(-1),
  };
}

function buildUpsertBody(input: GhlContactSyncInput): Record<string, unknown> {
  const { firstName, lastName } = splitName(input.name);
  const stripeFieldId = getGhlStripeCustomerFieldId();
  const customFields: Array<{ id: string; value: string }> = [];

  if (stripeFieldId) {
    customFields.push({
      id: stripeFieldId,
      value: input.stripeCustomerId,
    });
  }

  const fields: Record<string, unknown> = {
    locationId: getGhlLocationId(),
    email: input.email.trim().toLowerCase(),
    firstName,
    lastName,
    phone: input.phone,
    address1: [input.address?.line1, input.address?.line2].filter(Boolean).join(", "),
    city: input.address?.city,
    state: input.address?.state,
    postalCode: input.address?.postalCode,
    country: input.address?.country,
    source: `${BRAND_NAME} Website / Stripe`,
    customFields: customFields.length > 0 ? customFields : undefined,
  };

  return Object.fromEntries(
    Object.entries(fields).filter(
      ([, value]) => value !== undefined && value !== ""
    )
  );
}

async function addContactTags(contactId: string, tags: string[]): Promise<void> {
  if (tags.length === 0) {
    return;
  }

  await ghlRequest(`/contacts/${contactId}/tags`, {
    method: "POST",
    body: { tags },
  });
}

export async function syncGhlContact(
  input: GhlContactSyncInput
): Promise<GhlContactSyncResult> {
  const response = await ghlRequest<GhlUpsertContactResponse>("/contacts/upsert", {
    method: "POST",
    body: buildUpsertBody(input),
  });

  const contactId = response.contact?.id;
  if (!contactId) {
    throw new Error("GoHighLevel upsert did not return a contact id");
  }

  await addContactTags(contactId, getGhlCustomerTags());

  return {
    contactId,
    created: response.new === true,
  };
}

export async function syncGhlContactFromPaymentIntent(
  paymentIntent: Stripe.PaymentIntent
): Promise<GhlContactSyncResult | null> {
  const customerId =
    typeof paymentIntent.customer === "string"
      ? paymentIntent.customer
      : paymentIntent.customer?.id;

  if (!customerId) {
    return null;
  }

  const stripe = getStripe();
  const customer = await stripe.customers.retrieve(customerId);
  if (customer.deleted) {
    return null;
  }

  let billingDetails: Stripe.PaymentMethod.BillingDetails | undefined;

  if (typeof paymentIntent.payment_method === "string") {
    const paymentMethod = await stripe.paymentMethods.retrieve(
      paymentIntent.payment_method
    );
    billingDetails = paymentMethod.billing_details;
  }

  const email =
    customer.email ||
    paymentIntent.receipt_email ||
    billingDetails?.email ||
    undefined;

  if (!email) {
    return null;
  }

  const name =
    customer.name ||
    billingDetails?.name ||
    paymentIntent.shipping?.name ||
    undefined;
  const phone =
    customer.phone ||
    billingDetails?.phone ||
    paymentIntent.shipping?.phone ||
    undefined;
  const rawAddress =
    customer.address ||
    billingDetails?.address ||
    paymentIntent.shipping?.address ||
    undefined;

  return syncGhlContact({
    stripeCustomerId: customerId,
    email,
    name,
    phone: phone ?? undefined,
    address: rawAddress
      ? {
          line1: rawAddress.line1 ?? undefined,
          line2: rawAddress.line2 ?? undefined,
          city: rawAddress.city ?? undefined,
          state: rawAddress.state ?? undefined,
          postalCode: rawAddress.postal_code ?? undefined,
          country: rawAddress.country ?? undefined,
        }
      : undefined,
    lastPaymentIntentId: paymentIntent.id,
    lastOrderAmountCents: paymentIntent.amount_received || paymentIntent.amount,
    lastOrderCurrency: paymentIntent.currency,
  });
}
