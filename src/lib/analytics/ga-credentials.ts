export function getGoogleAnalyticsPropertyId(): string | undefined {
  const propertyId = process.env.GOOGLE_ANALYTICS_PROPERTY_ID?.trim();
  return propertyId || undefined;
}

export function getGoogleAnalyticsConsoleUrl(): string | undefined {
  const configured = process.env.GOOGLE_ANALYTICS_CONSOLE_URL?.trim();
  if (configured) {
    return configured;
  }

  const propertyId = getGoogleAnalyticsPropertyId();
  if (!propertyId) {
    return undefined;
  }

  return `https://analytics.google.com/analytics/web/#/p${propertyId}/reports/intelligenthome`;
}

function normalizePrivateKey(value: string): string {
  let normalized = value.trim();

  if (normalized.endsWith(",")) {
    normalized = normalized.slice(0, -1).trim();
  }

  if (
    (normalized.startsWith('"') && normalized.endsWith('"')) ||
    (normalized.startsWith("'") && normalized.endsWith("'"))
  ) {
    normalized = normalized.slice(1, -1);
  }

  return normalized.replace(/\\n/g, "\n");
}

export function getGoogleServiceAccountCredentials():
  | { clientEmail: string; privateKey: string }
  | undefined {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.trim();

  if (!clientEmail || !privateKey) {
    return undefined;
  }

  return {
    clientEmail,
    privateKey: normalizePrivateKey(privateKey),
  };
}

export function isGoogleAnalyticsDataConfigured(): boolean {
  return Boolean(
    getGoogleAnalyticsPropertyId() && getGoogleServiceAccountCredentials()
  );
}
