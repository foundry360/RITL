#!/usr/bin/env node

import { createServer } from "node:http";
import { execSync } from "node:child_process";
import { isPlaceholder, loadProjectEnv } from "./load-env.mjs";
import { resolveSalesforceLoginUrl } from "./salesforce-utils.mjs";
import { createSalesforcePkcePair } from "./salesforce-pkce.mjs";

const DEFAULT_PORT = 1717;

function getRedirectUri(port) {
  const configured = process.env.SALESFORCE_REDIRECT_URI?.trim();
  if (configured) {
    return configured;
  }
  return `http://localhost:${port}/oauth/callback`;
}

function getLoginUrl() {
  return resolveSalesforceLoginUrl(process.env.SALESFORCE_LOGIN_URL);
}

function findAvailablePort(startPort, attempts = 10) {
  return new Promise((resolve, reject) => {
    let port = startPort;
    let tries = 0;

    const tryListen = () => {
      const probe = createServer();
      probe.once("error", (error) => {
        probe.close();
        if (error.code === "EADDRINUSE" && tries < attempts) {
          tries += 1;
          port += 1;
          tryListen();
          return;
        }
        reject(error);
      });
      probe.listen(port, () => {
        probe.close(() => resolve(port));
      });
    };

    tryListen();
  });
}

function buildAuthorizeUrl(clientId, redirectUri, codeChallenge) {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "api refresh_token offline_access",
    code_challenge_method: "S256",
    code_challenge: codeChallenge,
  });

  return `${getLoginUrl()}/services/oauth2/authorize?${params.toString()}`;
}

async function exchangeCode({ clientId, clientSecret, redirectUri, code, codeVerifier }) {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    code,
    code_verifier: codeVerifier,
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
    throw new Error(
      data.error_description || data.error || "Failed to exchange authorization code"
    );
  }

  return data;
}

function openBrowser(url) {
  try {
    if (process.platform === "darwin") {
      execSync(`open "${url}"`, { stdio: "ignore" });
      return;
    }
    if (process.platform === "win32") {
      execSync(`start "" "${url}"`, { stdio: "ignore", shell: true });
      return;
    }
    execSync(`xdg-open "${url}"`, { stdio: "ignore" });
  } catch {
  }
}

async function main() {
  loadProjectEnv();

  const clientId = process.env.SALESFORCE_CLIENT_ID;
  const clientSecret = process.env.SALESFORCE_CLIENT_SECRET;
  const requestedPort = Number(process.env.SALESFORCE_OAUTH_PORT || DEFAULT_PORT);
  const port = await findAvailablePort(requestedPort);
  const redirectUri = getRedirectUri(port);

  if (isPlaceholder(clientId) || isPlaceholder(clientSecret)) {
    console.error("Salesforce Connected App credentials are required.\n");
    console.error("1. In Salesforce Setup, create an External Client App / Connected App");
    console.error("2. Enable OAuth and add this callback URL:");
    console.error(`   ${redirectUri}`);
    console.error("3. Add to .env.local:");
    console.error("   SALESFORCE_CLIENT_ID=your_consumer_key");
    console.error("   SALESFORCE_CLIENT_SECRET=your_consumer_secret");
    console.error("4. Rerun: npm run salesforce:authorize\n");
    process.exit(1);
  }

  const { codeVerifier, codeChallenge } = createSalesforcePkcePair();
  const authorizeUrl = buildAuthorizeUrl(clientId, redirectUri, codeChallenge);
  const loginUrl = getLoginUrl();

  console.log("Salesforce authorization\n");
  console.log(`Login URL: ${loginUrl}`);
  console.log(`Client ID: ${clientId.slice(0, 8)}... (${clientId.length} chars)`);
  console.log("\nCallback URL (add this to your Connected App):");
  console.log(`  ${redirectUri}`);
  if (port !== requestedPort) {
    console.log(
      `\nPort ${requestedPort} was in use. Using port ${port} for this session.`
    );
    console.log("Add the callback URL above to your Connected App if needed.\n");
  } else {
    console.log("");
  }
  if (loginUrl === "https://login.salesforce.com") {
    console.log(
      "Using production login. If your org is a sandbox, add to .env.local:"
    );
    console.log("  SALESFORCE_LOGIN_URL=https://test.salesforce.com\n");
  }
  console.log("Opening browser for Salesforce login...\n");

  const server = createServer(async (request, response) => {
    const requestUrl = new URL(request.url || "/", `http://localhost:${port}`);

    if (requestUrl.pathname !== "/oauth/callback") {
      response.writeHead(404, { "Content-Type": "text/plain" });
      response.end("Not found");
      return;
    }

    const error = requestUrl.searchParams.get("error");
    const errorDescription = requestUrl.searchParams.get("error_description");
    if (error) {
      response.writeHead(400, { "Content-Type": "text/html; charset=utf-8" });
      response.end(
        `<html><body style="font-family: sans-serif; padding: 2rem; max-width: 40rem;"><h1>Authorization failed</h1><p><strong>${error}</strong></p><p>${errorDescription ?? ""}</p><ul><li>Re-copy the <strong>Consumer Key</strong> (not secret) into SALESFORCE_CLIENT_ID</li><li>Sandbox orgs need SALESFORCE_LOGIN_URL=https://test.salesforce.com</li><li>Callback URL must exactly match: ${redirectUri}</li><li>New Connected Apps can take 10–30 minutes to activate</li></ul></body></html>`
      );
      console.error(`\nAuthorization failed: ${error}`);
      if (errorDescription) {
        console.error(decodeURIComponent(errorDescription.replace(/\+/g, " ")));
      }
      console.error("\nTroubleshooting invalid_client_id:");
      console.error("  1. Setup → App Manager → your app → View → OAuth Settings");
      console.error("     Copy Consumer Key (long value with a dot, ~85 chars)");
      console.error("  2. If you log in at test.salesforce.com, set:");
      console.error("     SALESFORCE_LOGIN_URL=https://test.salesforce.com");
      console.error("  3. Wait 10–30 min if the Connected App was just created");
      server.close();
      process.exit(1);
      return;
    }

    const code = requestUrl.searchParams.get("code");
    if (!code) {
      response.writeHead(400, { "Content-Type": "text/plain" });
      response.end("Missing authorization code");
      return;
    }

    try {
      const token = await exchangeCode({
        clientId,
        clientSecret,
        redirectUri,
        code,
        codeVerifier,
      });

      response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      response.end(
        "<html><body style='font-family: sans-serif; padding: 2rem;'><h1>Salesforce connected</h1><p>You can close this window and return to the terminal.</p></body></html>"
      );

      console.log("✓ Authorization successful\n");
      console.log("Add these lines to .env.local:\n");
      console.log(`SALESFORCE_INSTANCE_URL=${token.instance_url}`);
      if (token.refresh_token) {
        console.log(`SALESFORCE_REFRESH_TOKEN=${token.refresh_token}`);
      } else {
        console.log(
          "# No refresh token returned. Ensure your Connected App requests offline_access."
        );
      }
      console.log("\nThen verify the connection:");
      console.log("  npm run salesforce:verify\n");

      server.close();
      process.exit(0);
    } catch (exchangeError) {
      response.writeHead(500, { "Content-Type": "text/plain" });
      response.end(
        exchangeError instanceof Error ? exchangeError.message : "Token exchange failed"
      );
      server.close();
      process.exit(1);
    }
  });

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, resolve);
  });

  openBrowser(authorizeUrl);
  console.log(`If the browser did not open, visit:\n${authorizeUrl}\n`);
  console.log("Waiting for authorization...");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
