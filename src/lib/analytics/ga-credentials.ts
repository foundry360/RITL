export function getGoogleAnalyticsPropertyId(): string | undefined {
  const propertyId = process.env.GOOGLE_ANALYTICS_PROPERTY_ID?.trim();
  return propertyId || undefined;
}

function normalizePrivateKey(value: string): string {
  return value.replace(/\\n/g, "\n");
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
