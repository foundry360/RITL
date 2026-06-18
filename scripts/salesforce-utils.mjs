const PRODUCTION_LOGIN_URL = "https://login.salesforce.com";
const SANDBOX_LOGIN_URL = "https://test.salesforce.com";

export function resolveSalesforceLoginUrl(rawValue) {
  const trimmed = rawValue?.trim();
  if (!trimmed) {
    return PRODUCTION_LOGIN_URL;
  }

  const normalized = trimmed.replace(/\/+$/, "");

  if (
    normalized === PRODUCTION_LOGIN_URL ||
    normalized === SANDBOX_LOGIN_URL
  ) {
    return normalized;
  }

  if (normalized.includes(".sandbox.my.salesforce.com")) {
    console.warn(
      `SALESFORCE_LOGIN_URL points to a sandbox instance (${normalized}). Using ${SANDBOX_LOGIN_URL} for OAuth.`
    );
    return SANDBOX_LOGIN_URL;
  }

  if (normalized.includes(".my.salesforce.com")) {
    console.warn(
      `SALESFORCE_LOGIN_URL must be ${PRODUCTION_LOGIN_URL} or ${SANDBOX_LOGIN_URL}, not your My Domain URL (${normalized}).`
    );
    console.warn(`Using ${PRODUCTION_LOGIN_URL} for OAuth.\n`);
    return PRODUCTION_LOGIN_URL;
  }

  return normalized;
}
