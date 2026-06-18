#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { loadProjectEnv } from "./load-env.mjs";

function getProjectRef() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!url) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not configured");
  }

  const match = url.match(/https:\/\/([^.]+)\.supabase\.co/);
  if (!match) {
    throw new Error(`Could not parse project ref from ${url}`);
  }

  return match[1];
}

async function runWithManagementApi(sql, projectRef, accessToken) {
  const response = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: sql }),
    }
  );

  const body = await response.text();
  if (!response.ok) {
    throw new Error(`Management API failed (${response.status}): ${body}`);
  }

  return body;
}

async function runWithPg(sql) {
  const { default: pg } = await import("pg");
  const connectionString =
    process.env.SUPABASE_DB_URL?.trim() ||
    process.env.DATABASE_URL?.trim() ||
    (process.env.SUPABASE_DB_PASSWORD?.trim()
      ? `postgresql://postgres.${getProjectRef()}:${encodeURIComponent(process.env.SUPABASE_DB_PASSWORD.trim())}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`
      : null);

  if (!connectionString) {
    return false;
  }

  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  try {
    await client.query(sql);
  } finally {
    await client.end();
  }

  return true;
}

async function main() {
  loadProjectEnv();

  const migrationPath = resolve(
    process.cwd(),
    "supabase/migrations/001_orders.sql"
  );
  const sql = readFileSync(migrationPath, "utf8");
  const projectRef = getProjectRef();
  const accessToken = process.env.SUPABASE_ACCESS_TOKEN?.trim();

  console.log(`Applying orders migration to project ${projectRef}...`);

  if (accessToken) {
    await runWithManagementApi(sql, projectRef, accessToken);
    console.log("✓ Migration applied via Supabase Management API");
    return;
  }

  const usedPg = await runWithPg(sql);
  if (usedPg) {
    console.log("✓ Migration applied via direct Postgres connection");
    return;
  }

  console.error(
    [
      "Could not apply migration automatically.",
      "",
      "Option A — Supabase Dashboard:",
      "  1. Open https://supabase.com/dashboard/project/" + projectRef + "/sql/new",
      "  2. Paste supabase/migrations/001_orders.sql and run",
      "",
      "Option B — CLI with access token:",
      "  1. Create a token at https://supabase.com/dashboard/account/tokens",
      "  2. SUPABASE_ACCESS_TOKEN=... npm run orders:migrate",
      "",
      "Option C — Database password:",
      "  SUPABASE_DB_PASSWORD=... npm run orders:migrate",
    ].join("\n")
  );
  process.exit(1);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
