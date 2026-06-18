import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { syncActiveWebsiteOrdersFromRoastify } from "../src/lib/orders/repository";

function loadEnvFile(filename: string) {
  try {
    const contents = readFileSync(resolve(process.cwd(), filename), "utf8");
    for (const line of contents.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }
      const separator = trimmed.indexOf("=");
      if (separator === -1) {
        continue;
      }
      const key = trimmed.slice(0, separator).trim();
      const value = trimmed.slice(separator + 1).trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // Optional env file.
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

async function main() {
  const result = await syncActiveWebsiteOrdersFromRoastify();
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
