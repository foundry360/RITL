import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe/server";
import { getSalesforceStripeCustomerField } from "@/lib/salesforce/config";
import {
  createSalesforceRecord,
  querySalesforce,
  updateSalesforceRecord,
} from "@/lib/salesforce/client";

export interface SalesforceCustomerSyncInput {
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

export interface SalesforceCustomerSyncResult {
  accountId: string;
  contactId: string;
  created: boolean;
}

function escapeSoql(value: string): string {
  return value.replaceAll("\\", "\\\\").replaceAll("'", "\\'");
}

function splitName(fullName?: string): { firstName?: string; lastName: string } {
  const trimmed = fullName?.trim();
  if (!trimmed) {
    return { lastName: "RITL Customer" };
  }

  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) {
    return { lastName: parts[0] };
  }

  return {
    firstName: parts.slice(0, -1).join(" "),
    lastName: parts.at(-1) ?? "RITL Customer",
  };
}

function buildAccountName(input: SalesforceCustomerSyncInput): string {
  return input.name?.trim() || input.email;
}

function buildContactDescription(input: SalesforceCustomerSyncInput): string {
  const lines = [`Stripe Customer: ${input.stripeCustomerId}`];

  if (input.lastPaymentIntentId) {
    lines.push(`Last Payment Intent: ${input.lastPaymentIntentId}`);
  }

  if (
    typeof input.lastOrderAmountCents === "number" &&
    input.lastOrderCurrency
  ) {
    const amount = (input.lastOrderAmountCents / 100).toFixed(2);
    lines.push(`Last Order: ${input.lastOrderCurrency.toUpperCase()} ${amount}`);
  }

  lines.push("Source: RITL Website / Stripe");
  return lines.join("\n");
}

function buildContactFields(
  input: SalesforceCustomerSyncInput,
  accountId: string
): Record<string, unknown> {
  const { firstName, lastName } = splitName(input.name);
  const stripeField = getSalesforceStripeCustomerField();

  const fields: Record<string, unknown> = {
    AccountId: accountId,
    Email: input.email.trim().toLowerCase(),
    FirstName: firstName,
    LastName: lastName,
    Phone: input.phone,
    Description: buildContactDescription(input),
    MailingStreet: [input.address?.line1, input.address?.line2]
      .filter(Boolean)
      .join("\n"),
    MailingCity: input.address?.city,
    MailingState: input.address?.state,
    MailingPostalCode: input.address?.postalCode,
    MailingCountry: input.address?.country,
  };

  if (stripeField) {
    fields[stripeField] = input.stripeCustomerId;
  }

  return Object.fromEntries(
    Object.entries(fields).filter(([, value]) => value !== undefined && value !== "")
  );
}

async function findContact(
  input: SalesforceCustomerSyncInput
): Promise<{ Id: string; AccountId?: string } | undefined> {
  const stripeField = getSalesforceStripeCustomerField();

  if (stripeField) {
    const byStripeId = await querySalesforce<{ Id: string; AccountId?: string }>(
      `SELECT Id, AccountId FROM Contact WHERE ${stripeField} = '${escapeSoql(input.stripeCustomerId)}' LIMIT 1`
    );
    if (byStripeId[0]) {
      return byStripeId[0];
    }
  }

  const byEmail = await querySalesforce<{ Id: string; AccountId?: string }>(
    `SELECT Id, AccountId FROM Contact WHERE Email = '${escapeSoql(input.email.trim().toLowerCase())}' LIMIT 1`
  );

  return byEmail[0];
}

export async function syncSalesforceCustomer(
  input: SalesforceCustomerSyncInput
): Promise<SalesforceCustomerSyncResult> {
  const existingContact = await findContact(input);
  const contactFields = buildContactFields(
    input,
    existingContact?.AccountId ?? ""
  );

  if (existingContact?.Id) {
    if (!existingContact.AccountId) {
      const accountId = await createSalesforceRecord("Account", {
        Name: buildAccountName(input),
      });
      contactFields.AccountId = accountId;
    }

    await updateSalesforceRecord("Contact", existingContact.Id, contactFields);

    if (existingContact.AccountId) {
      await updateSalesforceRecord("Account", existingContact.AccountId, {
        Name: buildAccountName(input),
        Phone: input.phone,
      });
    }

    return {
      accountId: (contactFields.AccountId as string) || existingContact.AccountId || "",
      contactId: existingContact.Id,
      created: false,
    };
  }

  const accountId = await createSalesforceRecord("Account", {
    Name: buildAccountName(input),
    Phone: input.phone,
  });

  const createFields = buildContactFields(input, accountId);
  const contactId = await createSalesforceRecord("Contact", createFields);

  return {
    accountId,
    contactId,
    created: true,
  };
}

export async function syncSalesforceCustomerFromPaymentIntent(
  paymentIntent: Stripe.PaymentIntent
): Promise<SalesforceCustomerSyncResult | null> {
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

  return syncSalesforceCustomer({
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
