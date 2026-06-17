import type Stripe from "stripe";
import { getPaymentIntentIdFromClientSecret } from "@/lib/stripe/client-secret";
import { getStripe } from "@/lib/stripe/server";

export interface CheckoutCustomerDetails {
  email: string;
  name: string;
  phone?: string;
  address: Stripe.AddressParam;
}

export interface ResolveCheckoutCustomerParams {
  email: string;
  details: CheckoutCustomerDetails;
  sessionCustomerId: string;
  clientSecret: string;
  mode: "payment" | "subscription";
}

async function findCustomerByEmail(
  email: string
): Promise<Stripe.Customer | undefined> {
  const stripe = getStripe();
  const customers = await stripe.customers.list({
    email: email.trim().toLowerCase(),
    limit: 10,
  });

  return customers.data
    .filter((customer) => !("deleted" in customer && customer.deleted))
    .sort((left, right) => right.created - left.created)[0];
}

export async function resolveCustomerAtCheckoutInit(
  email: string,
  checkoutReference?: string
): Promise<string> {
  const normalizedEmail = email.trim().toLowerCase();
  const existingCustomer = await findCustomerByEmail(normalizedEmail);

  if (existingCustomer) {
    return existingCustomer.id;
  }

  const stripe = getStripe();
  const customer = await stripe.customers.create(
    {
      email: normalizedEmail,
      metadata: checkoutReference
        ? { ritl_checkout_reference: checkoutReference }
        : undefined,
    },
    { idempotencyKey: `ritl-customer-email-${normalizedEmail}` }
  );

  return customer.id;
}

async function deleteEphemeralCheckoutCustomer(
  customerId: string
): Promise<void> {
  const stripe = getStripe();

  try {
    const customer = await stripe.customers.retrieve(customerId);
    if (customer.deleted || customer.email) {
      return;
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 1,
    });

    if (subscriptions.data.length > 0) {
      return;
    }

    await stripe.customers.del(customerId);
  } catch (error) {
    console.warn(
      `Could not delete ephemeral checkout customer ${customerId}:`,
      error
    );
  }
}

export async function updateCheckoutCustomer(
  customerId: string,
  details: CheckoutCustomerDetails
): Promise<void> {
  const stripe = getStripe();

  await stripe.customers.update(customerId, {
    email: details.email.trim().toLowerCase(),
    name: details.name,
    phone: details.phone,
    address: details.address,
    shipping: {
      name: details.name,
      phone: details.phone,
      address: details.address,
    },
  });
}

export async function resolveCheckoutCustomer(
  params: ResolveCheckoutCustomerParams
): Promise<string> {
  const normalizedEmail = params.email.trim().toLowerCase();
  const existingCustomer = await findCustomerByEmail(normalizedEmail);
  const canonicalCustomerId =
    existingCustomer?.id ?? params.sessionCustomerId;

  await updateCheckoutCustomer(canonicalCustomerId, {
    ...params.details,
    email: normalizedEmail,
  });

  if (canonicalCustomerId === params.sessionCustomerId) {
    return canonicalCustomerId;
  }

  const paymentIntentId = getPaymentIntentIdFromClientSecret(params.clientSecret);
  if (paymentIntentId) {
    const stripe = getStripe();
    await stripe.paymentIntents.update(paymentIntentId, {
      customer: canonicalCustomerId,
    });
  }

  await deleteEphemeralCheckoutCustomer(params.sessionCustomerId);

  return canonicalCustomerId;
}

export async function syncCustomerFromPaymentIntent(
  paymentIntent: Stripe.PaymentIntent
): Promise<void> {
  const customerId =
    typeof paymentIntent.customer === "string"
      ? paymentIntent.customer
      : paymentIntent.customer?.id;

  if (!customerId) {
    return;
  }

  const stripe = getStripe();
  let billingDetails: Stripe.PaymentMethod.BillingDetails | undefined;

  if (typeof paymentIntent.payment_method === "string") {
    const paymentMethod = await stripe.paymentMethods.retrieve(
      paymentIntent.payment_method
    );
    billingDetails = paymentMethod.billing_details;
  }

  const email =
    paymentIntent.receipt_email ?? billingDetails?.email ?? undefined;
  const name = billingDetails?.name ?? paymentIntent.shipping?.name ?? undefined;
  const phone =
    billingDetails?.phone ?? paymentIntent.shipping?.phone ?? undefined;
  const rawAddress = billingDetails?.address ?? paymentIntent.shipping?.address;
  const address = rawAddress
    ? {
        line1: rawAddress.line1 ?? undefined,
        line2: rawAddress.line2 ?? undefined,
        city: rawAddress.city ?? undefined,
        state: rawAddress.state ?? undefined,
        postal_code: rawAddress.postal_code ?? undefined,
        country: rawAddress.country ?? undefined,
      }
    : undefined;

  const updateParams: Stripe.CustomerUpdateParams = {};

  if (email) {
    updateParams.email = email.trim().toLowerCase();
  }
  if (name) {
    updateParams.name = name;
  }
  if (phone) {
    updateParams.phone = phone;
  }
  if (address?.line1 && address.country) {
    updateParams.address = address;
  }
  if (
    paymentIntent.shipping?.name &&
    paymentIntent.shipping.address?.line1 &&
    paymentIntent.shipping.address.country
  ) {
    updateParams.shipping = {
      name: paymentIntent.shipping.name,
      phone: paymentIntent.shipping.phone ?? undefined,
      address: {
        line1: paymentIntent.shipping.address.line1,
        line2: paymentIntent.shipping.address.line2 ?? undefined,
        city: paymentIntent.shipping.address.city ?? undefined,
        state: paymentIntent.shipping.address.state ?? undefined,
        postal_code: paymentIntent.shipping.address.postal_code ?? undefined,
        country: paymentIntent.shipping.address.country,
      },
    };
  }

  if (Object.keys(updateParams).length > 0) {
    await stripe.customers.update(customerId, updateParams);
  }
}
