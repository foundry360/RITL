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

export function getGhlWebsiteLeadTag(): string {
  return process.env.GHL_WEBSITE_LEAD_TAG?.trim() || "website-lead";
}

export function getGhlWebsiteLeadResubmitTag(): string {
  return (
    process.env.GHL_WEBSITE_LEAD_RESUBMIT_TAG?.trim() || "website-lead-returning"
  );
}

export function getGhlStripeCustomerFieldId(): string | undefined {
  const value = process.env.GHL_STRIPE_CUSTOMER_FIELD_ID?.trim();
  return value || undefined;
}

export function isGhlOrdersConfigured(): boolean {
  return Boolean(
    isGhlConfigured() &&
      process.env.GHL_CUSTOMER_ORDERS_SCHEMA_KEY?.trim() &&
      process.env.GHL_CONTACT_ORDERS_ASSOCIATION_ID?.trim()
  );
}

export function getGhlCustomerOrdersSchemaKey(): string {
  const value = process.env.GHL_CUSTOMER_ORDERS_SCHEMA_KEY?.trim();
  if (!value) {
    throw new Error("GHL_CUSTOMER_ORDERS_SCHEMA_KEY is not configured");
  }
  return value;
}

export function getGhlContactOrdersAssociationId(): string {
  const value = process.env.GHL_CONTACT_ORDERS_ASSOCIATION_ID?.trim();
  if (!value) {
    throw new Error("GHL_CONTACT_ORDERS_ASSOCIATION_ID is not configured");
  }
  return value;
}
