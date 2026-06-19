export function isGhlConfigured(): boolean {
  return Boolean(
    process.env.GHL_API_TOKEN?.trim() && process.env.GHL_LOCATION_ID?.trim()
  );
}

export function getGhlApiToken(): string {
  const value = process.env.GHL_API_TOKEN?.trim();
  if (!value) {
    throw new Error("GHL_API_TOKEN is not configured");
  }
  return value;
}

export function getGhlLocationId(): string {
  const value = process.env.GHL_LOCATION_ID?.trim();
  if (!value) {
    throw new Error("GHL_LOCATION_ID is not configured");
  }
  return value;
}

export function getGhlCustomerTags(): string[] {
  const raw = process.env.GHL_CUSTOMER_TAGS?.trim();
  if (!raw) {
    return ["ritul-customer"];
  }

  return raw
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function getGhlStripeCustomerFieldId(): string | undefined {
  const value = process.env.GHL_STRIPE_CUSTOMER_FIELD_ID?.trim();
  return value || undefined;
}
