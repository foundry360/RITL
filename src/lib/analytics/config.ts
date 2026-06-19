export function getGoogleAnalyticsId(): string | undefined {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
  return measurementId || undefined;
}

export function isGoogleAnalyticsConfigured(): boolean {
  return Boolean(getGoogleAnalyticsId());
}
