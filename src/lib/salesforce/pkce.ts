import { createHash, randomBytes } from "node:crypto";

function base64UrlEncode(buffer: Buffer): string {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export function createSalesforcePkcePair(): {
  codeVerifier: string;
  codeChallenge: string;
} {
  const codeVerifier = base64UrlEncode(randomBytes(32));
  const codeChallenge = base64UrlEncode(
    createHash("sha256").update(codeVerifier).digest()
  );

  return { codeVerifier, codeChallenge };
}
