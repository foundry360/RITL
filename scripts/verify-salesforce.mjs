#!/usr/bin/env node

import { isPlaceholder, loadProjectEnv } from "./load-env.mjs";
import { resolveSalesforceLoginUrl } from "./salesforce-utils.mjs";

function getLoginUrl() {
  return resolveSalesforceLoginUrl(process.env.SALESFORCE_LOGIN_URL);
}

function getApiVersion() {
  return process.env.SALESFORCE_API_VERSION?.trim() || "v59.0";
}

async function getAccessToken() {
  const clientId = process.env.SALESFORCE_CLIENT_ID;
  const clientSecret = process.env.SALESFORCE_CLIENT_SECRET;
  const refreshToken = process.env.SALESFORCE_REFRESH_TOKEN;

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
  });

  const response = await fetch(`${getLoginUrl()}/services/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const data = await response.json();
  if (!response.ok) {
    const message =
      data.error_description || data.error || "Failed to refresh Salesforce token";
    throw new Error(message);
  }

  return {
    accessToken: data.access_token,
    instanceUrl: data.instance_url || process.env.SALESFORCE_INSTANCE_URL,
  };
}

async function probeSalesforceApi(accessToken, instanceUrl) {
  const soql = encodeURIComponent(
    "SELECT Id, Name, OrganizationType, InstanceName FROM Organization LIMIT 1"
  );
  const response = await fetch(
    `${instanceUrl}/services/data/${getApiVersion()}/query?q=${soql}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  const data = await response.json();
  if (!response.ok) {
    const apiErrors = Array.isArray(data) ? data : [data];
    const message =
      apiErrors.map((entry) => entry?.message).filter(Boolean).join("; ") ||
      "Failed to query Salesforce organization";

    if (apiErrors.some((entry) => entry?.errorCode === "API_DISABLED_FOR_ORG")) {
      throw new Error(
        "OAuth connected, but REST API is disabled for this Salesforce org. Upgrade or enable API access to sync Stripe customers automatically."
      );
    }

    throw new Error(message);
  }

  return data.records?.[0];
}

async function main() {
  loadProjectEnv();

  const clientId = process.env.SALESFORCE_CLIENT_ID;
  const clientSecret = process.env.SALESFORCE_CLIENT_SECRET;
  const refreshToken = process.env.SALESFORCE_REFRESH_TOKEN;

  if (isPlaceholder(clientId) || isPlaceholder(clientSecret)) {
    console.error(
      "SALESFORCE_CLIENT_ID and SALESFORCE_CLIENT_SECRET are required. Run npm run salesforce:authorize"
    );
    process.exit(1);
  }

  if (isPlaceholder(refreshToken)) {
    console.error(
      "SALESFORCE_REFRESH_TOKEN is missing. Run npm run salesforce:authorize first."
    );
    process.exit(1);
  }

  const token = await getAccessToken();
  const instanceUrl = token.instanceUrl;

  if (!instanceUrl) {
    console.error(
      "Missing instance URL. Add SALESFORCE_INSTANCE_URL to .env.local from the authorize output."
    );
    process.exit(1);
  }

  const organization = await probeSalesforceApi(token.accessToken, instanceUrl);

  console.log("✓ Salesforce connected");
  console.log(`  Org: ${organization?.Name ?? "Unknown"}`);
  console.log(`  Instance: ${instanceUrl}`);
  console.log(`  API: ${getApiVersion()}`);

  if (process.env.SALESFORCE_STRIPE_CUSTOMER_FIELD?.trim()) {
    console.log(
      `  Stripe field: ${process.env.SALESFORCE_STRIPE_CUSTOMER_FIELD.trim()}`
    );
  } else {
    console.log("  Stripe field: using Contact Description (optional custom field not set)");
  }

  console.log(
    "\nSalesforce is ready. Stripe payment_intent.succeeded events will create or update Account + Contact records."
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
