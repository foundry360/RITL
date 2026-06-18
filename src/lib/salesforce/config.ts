export function isSalesforceConfigured(): boolean {
  return Boolean(
    process.env.SALESFORCE_CLIENT_ID?.trim() &&
      process.env.SALESFORCE_CLIENT_SECRET?.trim() &&
      process.env.SALESFORCE_REFRESH_TOKEN?.trim()
  );
}

export function getSalesforceLoginUrl(): string {
  const raw = process.env.SALESFORCE_LOGIN_URL?.trim();
  if (!raw) {
    return "https://login.salesforce.com";
  }

  const normalized = raw.replace(/\/+$/, "");
  if (
    normalized === "https://login.salesforce.com" ||
    normalized === "https://test.salesforce.com"
  ) {
    return normalized;
  }

  if (normalized.includes(".sandbox.my.salesforce.com")) {
    return "https://test.salesforce.com";
  }

  if (normalized.includes(".my.salesforce.com")) {
    return "https://login.salesforce.com";
  }

  return normalized;
}

export function getSalesforceApiVersion(): string {
  return process.env.SALESFORCE_API_VERSION?.trim() || "v59.0";
}

export function getSalesforceStripeCustomerField(): string | undefined {
  const field = process.env.SALESFORCE_STRIPE_CUSTOMER_FIELD?.trim();
  return field || undefined;
}

export function getSalesforceClientId(): string {
  const value = process.env.SALESFORCE_CLIENT_ID?.trim();
  if (!value) {
    throw new Error("SALESFORCE_CLIENT_ID is not configured");
  }
  return value;
}

export function getSalesforceClientSecret(): string {
  const value = process.env.SALESFORCE_CLIENT_SECRET?.trim();
  if (!value) {
    throw new Error("SALESFORCE_CLIENT_SECRET is not configured");
  }
  return value;
}

export function getSalesforceRefreshToken(): string {
  const value = process.env.SALESFORCE_REFRESH_TOKEN?.trim();
  if (!value) {
    throw new Error("SALESFORCE_REFRESH_TOKEN is not configured");
  }
  return value;
}

export function getSalesforceInstanceUrl(): string | undefined {
  return process.env.SALESFORCE_INSTANCE_URL?.trim() || undefined;
}
