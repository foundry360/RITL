import type {
  StripeAddressElementOptions,
  StripePaymentElementOptions,
} from "@stripe/stripe-js";

export const CHECKOUT_PAYMENT_METHOD_TYPES = ["card"] as const;

export const addressElementOptions: StripeAddressElementOptions = {
  mode: "shipping",
  allowedCountries: ["US", "CA", "GB", "AU"],
  fields: {
    phone: "always",
  },
  validation: {
    phone: {
      required: "always",
    },
  },
};

export const paymentElementOptions: StripePaymentElementOptions = {
  paymentMethodOrder: ["card"],
  fields: {
    billingDetails: "never",
  },
  wallets: {
    link: "never",
    applePay: "never",
    googlePay: "never",
  },
};
