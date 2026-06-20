#!/usr/bin/env node

/** Default amounts (USD cents) when `npm run stripe:setup` creates new Stripe prices. */
export const STRIPE_CATALOG = [
  {
    productId: "focus-coffee",
    name: "Focus Coffee",
    description:
      "A refined functional blend engineered for alert clarity and sustained mental performance.",
    oneTimeAmount: 2800,
    subscriptionAmount: 2500,
    intervalWeeks: 4,
  },
  {
    productId: "matcha",
    name: "Matcha",
    description:
      "Ceremonial-grade matcha with functional enhancements for smooth, sustained cognitive energy.",
    oneTimeAmount: 3400,
    subscriptionAmount: 2800,
    intervalWeeks: 4,
  },
];

export const STRIPE_ENV_KEYS = {
  "focus-coffee": {
    "one-time": "STRIPE_PRICE_FOCUS_COFFEE",
    subscription: "STRIPE_PRICE_FOCUS_COFFEE_SUBSCRIPTION",
  },
  matcha: {
    "one-time": "STRIPE_PRICE_MATCHA",
    subscription: "STRIPE_PRICE_MATCHA_SUBSCRIPTION",
  },
};
