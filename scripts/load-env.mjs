#!/usr/bin/env node

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

export function loadProjectEnv(rootDir = process.cwd()) {
  const envFiles = [".env", ".env.local"].map((file) => resolve(rootDir, file));
  const values = {};

  for (const filePath of envFiles) {
    if (!existsSync(filePath)) continue;

    const content = readFileSync(filePath, "utf8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;

      const separatorIndex = trimmed.indexOf("=");
      if (separatorIndex === -1) continue;

      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed.slice(separatorIndex + 1).trim();
      values[key] = value;
    }
  }

  for (const [key, value] of Object.entries(values)) {
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }

  return values;
}

export function isPlaceholder(value) {
  return !value || value.includes("...");
}
