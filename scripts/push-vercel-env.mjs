#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const ENVIRONMENT = process.argv.includes("--preview")
  ? "preview"
  : process.argv.includes("--development")
    ? "development"
    : "production";

const OVERRIDES = {
  production: {
    NEXT_PUBLIC_APP_URL: "https://www.getritul.com",
    // Registered at https://www.getritul.com/api/stripe/webhook (test mode)
    STRIPE_WEBHOOK_SECRET: "whsec_TBrYdqDpFqHu55FNrWxeioPowBChe6fb",
  },
};

const SENSITIVE_KEYS = new Set([
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "ROASTIFY_API_KEY",
  "ROASTIFY_WEBHOOK_SECRET",
  "RESEND_API_KEY",
  "SALESFORCE_CLIENT_SECRET",
  "SALESFORCE_REFRESH_TOKEN",
  "SUPABASE_SERVICE_ROLE_KEY",
  "CRON_SECRET",
]);

function parseEnvFile(filePath) {
  if (!existsSync(filePath)) {
    throw new Error(`Missing ${filePath}`);
  }

  const values = {};
  for (const line of readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();
    values[key] = value;
  }

  return values;
}

function addEnv(name, value) {
  const args = [
    "env",
    "add",
    name,
    ENVIRONMENT,
    "--value",
    value,
    "--yes",
    "--force",
  ];

  if (SENSITIVE_KEYS.has(name)) {
    args.push("--sensitive");
  }

  execFileSync("npx", ["--yes", "vercel", ...args], {
    stdio: ["ignore", "pipe", "pipe"],
    cwd: process.cwd(),
    timeout: 60_000,
  });
}

function main() {
  const envPath = resolve(process.cwd(), ".env.local");
  const values = {
    ...parseEnvFile(envPath),
    ...(OVERRIDES[ENVIRONMENT] ?? {}),
  };

  delete values.PRODUCTION_APP_URL;

  const keys = Object.keys(values).sort();
  console.log(`Pushing ${keys.length} variables to Vercel (${ENVIRONMENT})...\n`);

  for (const key of keys) {
    console.log(`→ ${key}`);
    addEnv(key, values[key]);
  }

  console.log(`\nDone. Redeploy production for changes to take effect:`);
  console.log("  npx vercel --prod");
}

main();
