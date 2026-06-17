#!/usr/bin/env node

export const STRIPE_CATALOG = [
  {
    productId: "focus-coffee",
    name: "Focus Coffee",
    description:
      "A refined functional blend engineered for alert clarity and sustained mental performance.",
    oneTimeAmount: 4800,
    subscriptionAmount: 4080,
    intervalWeeks: 4,
  },
  {
    productId: "matcha",
    name: "Matcha",
    description:
      "Ceremonial-grade matcha with functional enhancements for smooth, sustained cognitive energy.",
    oneTimeAmount: 5200,
    subscriptionAmount: 4420,
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

export const EXPECTED_PRICE_AMOUNTS = {
  STRIPE_PRICE_FOCUS_COFFEE: 4800,
  STRIPE_PRICE_FOCUS_COFFEE_SUBSCRIPTION: 4080,
  STRIPE_PRICE_MATCHA: 5200,
  STRIPE_PRICE_MATCHA_SUBSCRIPTION: 4420,
};
