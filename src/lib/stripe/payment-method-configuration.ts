import { getStripe } from "@/lib/stripe/server";

const CARD_ONLY_PMC_NAME = "RITL Checkout Card Only";

let cachedPaymentMethodConfigurationId: string | null = null;
let hasSyncedDefaultPaymentMethodConfiguration = false;

const paymentMethodOff = { display_preference: { preference: "off" as const } };
const paymentMethodOn = { display_preference: { preference: "on" as const } };

async function syncDefaultPaymentMethodConfiguration(): Promise<void> {
  if (hasSyncedDefaultPaymentMethodConfiguration) {
    return;
  }

  const stripe = getStripe();
  const configurations = await stripe.paymentMethodConfigurations.list({
    limit: 100,
  });
  const defaultConfiguration = configurations.data.find(
    (configuration) => configuration.is_default
  );

  if (!defaultConfiguration) {
    return;
  }

  await stripe.paymentMethodConfigurations.update(defaultConfiguration.id, {
    klarna: paymentMethodOff,
    cashapp: paymentMethodOff,
    amazon_pay: paymentMethodOff,
    link: paymentMethodOff,
    apple_pay: paymentMethodOff,
    google_pay: paymentMethodOff,
  });

  hasSyncedDefaultPaymentMethodConfiguration = true;
}

export async function getCardOnlyPaymentMethodConfigurationId(): Promise<string> {
  const configuredId = process.env.STRIPE_PAYMENT_METHOD_CONFIGURATION;
  if (configuredId) {
    await syncDefaultPaymentMethodConfiguration();
    return configuredId;
  }

  if (cachedPaymentMethodConfigurationId) {
    return cachedPaymentMethodConfigurationId;
  }

  const stripe = getStripe();
  await syncDefaultPaymentMethodConfiguration();

  const configurations = await stripe.paymentMethodConfigurations.list({
    limit: 100,
  });

  const existing = configurations.data.find(
    (configuration) => configuration.name === CARD_ONLY_PMC_NAME
  );

  if (existing) {
    cachedPaymentMethodConfigurationId = existing.id;
    return existing.id;
  }

  const created = await stripe.paymentMethodConfigurations.create({
    name: CARD_ONLY_PMC_NAME,
    card: paymentMethodOn,
    klarna: paymentMethodOff,
    cashapp: paymentMethodOff,
    amazon_pay: paymentMethodOff,
    link: paymentMethodOff,
    apple_pay: paymentMethodOff,
    google_pay: paymentMethodOff,
  });

  cachedPaymentMethodConfigurationId = created.id;
  return created.id;
}
