export function isRoastifyConfigured(): boolean {
  return Boolean(process.env.ROASTIFY_API_KEY?.trim());
}

export function getRoastifyApiKey(): string {
  const apiKey = process.env.ROASTIFY_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("ROASTIFY_API_KEY is not configured");
  }
  return apiKey;
}

export function getRoastifyApiBaseUrl(): string {
  return process.env.ROASTIFY_API_BASE_URL?.trim() || "https://api.roastify.app/v1";
}
