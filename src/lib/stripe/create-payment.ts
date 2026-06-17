import type Stripe from "stripe";
import { getPaymentIntentIdFromClientSecret } from "@/lib/stripe/client-secret";
import {
  resolveCustomerAtCheckoutInit,
} from "@/lib/stripe/checkout-customer";
import {
  CHECKOUT_PAYMENT_METHOD_TYPES,
} from "@/lib/stripe/payment-methods";
import { getCardOnlyPaymentMethodConfigurationId } from "@/lib/stripe/payment-method-configuration";
import { getUnitPrice, type ProductPricingMap } from "@/lib/stripe/pricing";
import { getStripe } from "@/lib/stripe/server";
import {
  getProduct,
  getStripePriceId,
  type ProductId,
  type PurchaseType,
} from "@/lib/stripe/products";

export interface CheckoutItemInput {
  productId: ProductId;
  quantity: number;
  purchaseType: PurchaseType;
}

export interface CheckoutPaymentResult {
  clientSecret: string;
  mode: "payment" | "subscription";
  customerId: string;
}

function getItemUnitAmountCents(
  pricing: ProductPricingMap,
  item: CheckoutItemInput
): number {
  const amount = getUnitPrice(pricing, item.productId, item.purchaseType);
  return Math.round(amount * 100);
}

async function createOneTimePaymentIntent(
  items: CheckoutItemInput[],
  pricing: ProductPricingMap,
  paymentMethodConfiguration: string,
  checkoutReference?: string,
  email?: string
): Promise<CheckoutPaymentResult> {
  const stripe = getStripe();
  const amount = items.reduce(
    (total, item) => total + getItemUnitAmountCents(pricing, item) * item.quantity,
    0
  );

  if (amount <= 0) {
    throw new Error("Order total must be greater than zero.");
  }

  if (!email?.trim()) {
    throw new Error("Customer email is required to initialize checkout.");
  }

  const customerId = await resolveCustomerAtCheckoutInit(email, checkoutReference);

  const paymentIntent = await stripe.paymentIntents.create(
    {
      amount,
      currency: "usd",
      customer: customerId,
      payment_method_configuration: paymentMethodConfiguration,
      metadata: {
        ritl_items: JSON.stringify(
          items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            purchaseType: item.purchaseType,
          }))
        ),
        ...(checkoutReference
          ? { ritl_checkout_reference: checkoutReference }
          : {}),
      },
    },
    checkoutReference
      ? { idempotencyKey: `ritl-pi-${checkoutReference}` }
      : undefined
  );

  if (!paymentIntent.client_secret) {
    throw new Error("Failed to create payment intent.");
  }

  return {
    clientSecret: paymentIntent.client_secret,
    mode: "payment",
    customerId,
  };
}

function getSubscriptionPriceId(item: CheckoutItemInput): string {
  const priceId = getStripePriceId(item.productId, "subscription");
  if (!priceId) {
    throw new Error(`Missing Stripe subscription price for ${item.productId}.`);
  }
  return priceId;
}

function getOneTimePriceId(item: CheckoutItemInput): string {
  const priceId = getStripePriceId(item.productId, "one-time");
  if (!priceId) {
    throw new Error(`Missing Stripe one-time price for ${item.productId}.`);
  }
  return priceId;
}

async function createSubscriptionPayment(
  items: CheckoutItemInput[],
  checkoutReference?: string,
  email?: string
): Promise<CheckoutPaymentResult> {
  const stripe = getStripe();
  const subscriptionItems = items.filter(
    (item) => item.purchaseType === "subscription"
  );
  const oneTimeItems = items.filter((item) => item.purchaseType === "one-time");

  if (!email?.trim()) {
    throw new Error("Customer email is required to initialize checkout.");
  }

  const customerId = await resolveCustomerAtCheckoutInit(email, checkoutReference);

  const ritlItems = JSON.stringify(
    items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      purchaseType: item.purchaseType,
    }))
  );

  const subscriptionParams: Stripe.SubscriptionCreateParams = {
    customer: customerId,
    items: subscriptionItems.map((item) => ({
      price: getSubscriptionPriceId(item),
      quantity: item.quantity,
    })),
    payment_behavior: "default_incomplete",
    payment_settings: {
      payment_method_types: [...CHECKOUT_PAYMENT_METHOD_TYPES],
      save_default_payment_method: "on_subscription",
    },
    expand: ["latest_invoice.confirmation_secret"],
    metadata: {
      ritl_items: ritlItems,
      ...(checkoutReference
        ? { ritl_checkout_reference: checkoutReference }
        : {}),
    },
  };

  if (oneTimeItems.length > 0) {
    subscriptionParams.add_invoice_items = oneTimeItems.map((item) => ({
      price: getOneTimePriceId(item),
      quantity: item.quantity,
    }));
  }

  const subscription = await stripe.subscriptions.create(
    subscriptionParams,
    checkoutReference
      ? { idempotencyKey: `ritl-subscription-${checkoutReference}` }
      : undefined
  );
  const invoice = subscription.latest_invoice;

  if (!invoice || typeof invoice === "string") {
    throw new Error("Failed to create subscription invoice.");
  }

  const clientSecret = invoice.confirmation_secret?.client_secret;
  if (!clientSecret) {
    throw new Error(
      "Failed to initialize subscription payment. Check Stripe subscription price IDs."
    );
  }

  const invoicePaymentIntentId = getPaymentIntentIdFromClientSecret(clientSecret);

  if (invoicePaymentIntentId) {
    await stripe.paymentIntents.update(invoicePaymentIntentId, {
      metadata: {
        ritl_items: ritlItems,
        ritl_stripe_customer_id: customerId,
        ...(checkoutReference
          ? { ritl_checkout_reference: checkoutReference }
          : {}),
      },
    });
  }

  return {
    clientSecret,
    mode: "subscription",
    customerId,
  };
}

export async function createCheckoutPayment(
  items: CheckoutItemInput[],
  pricing: ProductPricingMap,
  checkoutReference?: string,
  email?: string
): Promise<CheckoutPaymentResult> {
  for (const item of items) {
    if (!getProduct(item.productId)) {
      throw new Error(`Invalid product: ${item.productId}`);
    }
  }

  const paymentMethodConfiguration =
    await getCardOnlyPaymentMethodConfigurationId();

  const hasSubscription = items.some((item) => item.purchaseType === "subscription");

  if (hasSubscription) {
    return createSubscriptionPayment(items, checkoutReference, email);
  }

  return createOneTimePaymentIntent(
    items,
    pricing,
    paymentMethodConfiguration,
    checkoutReference,
    email
  );
}
