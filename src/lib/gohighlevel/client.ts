import {
  getGhlApiToken,
  getGhlLocationId,
  isGhlConfigured,
} from "@/lib/gohighlevel/config";

const GHL_API_BASE_URL = "https://services.leadconnectorhq.com";
const GHL_API_VERSION = "2021-07-28";

interface GhlErrorBody {
  message?: string;
  error?: string;
  statusCode?: number;
  traceId?: string;
}

export class GhlApiError extends Error {
  readonly status: number;
  readonly details: GhlErrorBody | string;

  constructor(status: number, details: GhlErrorBody | string) {
    const message =
      typeof details === "string"
        ? details
        : details.message || details.error || "GoHighLevel API request failed";
    super(message);
    this.name = "GhlApiError";
    this.status = status;
    this.details = details;
  }
}

function buildHeaders(): HeadersInit {
  return {
    Authorization: `Bearer ${getGhlApiToken()}`,
    Accept: "application/json",
    "Content-Type": "application/json",
    Version: GHL_API_VERSION,
  };
}

export async function ghlRequest<T>(
  path: string,
  options: {
    method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    body?: unknown;
  } = {}
): Promise<T> {
  if (!isGhlConfigured()) {
    throw new Error("GoHighLevel is not configured");
  }

  const response = await fetch(`${GHL_API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers: buildHeaders(),
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  const text = await response.text();
  const parsed = text ? (JSON.parse(text) as T | GhlErrorBody) : ({} as T);

  if (!response.ok) {
    throw new GhlApiError(response.status, parsed as GhlErrorBody | string);
  }

  return parsed as T;
}

export async function getGhlLocation(): Promise<{
  id?: string;
  name?: string;
  companyId?: string;
}> {
  const locationId = getGhlLocationId();
  const data = await ghlRequest<{ location?: { id?: string; name?: string; companyId?: string } }>(
    `/locations/${locationId}`
  );
  return data.location ?? {};
}
