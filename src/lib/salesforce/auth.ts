import {
  getSalesforceClientId,
  getSalesforceClientSecret,
  getSalesforceInstanceUrl,
  getSalesforceLoginUrl,
  getSalesforceRefreshToken,
  isSalesforceConfigured,
} from "@/lib/salesforce/config";
import { createSalesforcePkcePair } from "@/lib/salesforce/pkce";

interface SalesforceTokenResponse {
  access_token: string;
  instance_url: string;
  token_type: string;
  issued_at?: string;
  scope?: string;
}

let cachedAccessToken: string | null = null;
let cachedInstanceUrl: string | null = null;
let tokenExpiresAt = 0;

export interface SalesforceSession {
  accessToken: string;
  instanceUrl: string;
}

function resolveInstanceUrl(tokenResponse: SalesforceTokenResponse): string {
  return (
    tokenResponse.instance_url ||
    getSalesforceInstanceUrl() ||
    (() => {
      throw new Error(
        "Salesforce instance URL missing from token response. Set SALESFORCE_INSTANCE_URL."
      );
    })()
  );
}

export async function getSalesforceSession(): Promise<SalesforceSession> {
  if (!isSalesforceConfigured()) {
    throw new Error("Salesforce is not configured");
  }

  if (cachedAccessToken && cachedInstanceUrl && Date.now() < tokenExpiresAt) {
    return {
      accessToken: cachedAccessToken,
      instanceUrl: cachedInstanceUrl,
    };
  }

  const loginUrl = getSalesforceLoginUrl();
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: getSalesforceClientId(),
    client_secret: getSalesforceClientSecret(),
    refresh_token: getSalesforceRefreshToken(),
  });

  const response = await fetch(`${loginUrl}/services/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const data = (await response.json()) as SalesforceTokenResponse & {
    error?: string;
    error_description?: string;
  };

  if (!response.ok) {
    const message =
      data.error_description || data.error || "Failed to refresh Salesforce token";
    throw new Error(message);
  }

  cachedAccessToken = data.access_token;
  cachedInstanceUrl = resolveInstanceUrl(data);
  tokenExpiresAt = Date.now() + 55 * 60 * 1000;

  return {
    accessToken: cachedAccessToken,
    instanceUrl: cachedInstanceUrl,
  };
}

export async function exchangeSalesforceAuthorizationCode(
  code: string,
  redirectUri: string,
  codeVerifier?: string
): Promise<SalesforceTokenResponse & { refresh_token?: string }> {
  const loginUrl = getSalesforceLoginUrl();
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: getSalesforceClientId(),
    client_secret: getSalesforceClientSecret(),
    redirect_uri: redirectUri,
    code,
  });

  if (codeVerifier) {
    body.set("code_verifier", codeVerifier);
  }

  const response = await fetch(`${loginUrl}/services/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const data = (await response.json()) as SalesforceTokenResponse & {
    refresh_token?: string;
    error?: string;
    error_description?: string;
  };

  if (!response.ok) {
    const message =
      data.error_description || data.error || "Failed to exchange Salesforce auth code";
    throw new Error(message);
  }

  return data;
}

export function buildSalesforceAuthorizeUrl(redirectUri: string): {
  url: string;
  codeVerifier: string;
} {
  const loginUrl = getSalesforceLoginUrl();
  const { codeVerifier, codeChallenge } = createSalesforcePkcePair();
  const params = new URLSearchParams({
    response_type: "code",
    client_id: getSalesforceClientId(),
    redirect_uri: redirectUri,
    scope: "api refresh_token offline_access",
    code_challenge_method: "S256",
    code_challenge: codeChallenge,
  });

  return {
    url: `${loginUrl}/services/oauth2/authorize?${params.toString()}`,
    codeVerifier,
  };
}
