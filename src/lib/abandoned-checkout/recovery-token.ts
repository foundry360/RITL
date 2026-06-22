import { createHmac, timingSafeEqual } from "node:crypto";

function getRecoverySecret(): string | null {
  return process.env.CRON_SECRET?.trim() || null;
}

export function signAbandonedCheckoutRecovery(recordId: string): string | null {
  const secret = getRecoverySecret();
  if (!secret || !recordId) {
    return null;
  }

  return createHmac("sha256", secret).update(recordId).digest("base64url");
}

export function verifyAbandonedCheckoutRecovery(
  recordId: string,
  token: string
): boolean {
  const expected = signAbandonedCheckoutRecovery(recordId);
  if (!expected || !token) {
    return false;
  }

  try {
    const expectedBuffer = Buffer.from(expected);
    const tokenBuffer = Buffer.from(token);
    if (expectedBuffer.length !== tokenBuffer.length) {
      return false;
    }
    return timingSafeEqual(expectedBuffer, tokenBuffer);
  } catch {
    return false;
  }
}
