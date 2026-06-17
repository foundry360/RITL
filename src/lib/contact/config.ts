export const CONTACT_INBOX = "info@getritl.com";

export function isContactEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

export function getContactFromAddress(): string {
  return process.env.CONTACT_FROM_EMAIL?.trim() || "RITL <onboarding@resend.dev>";
}
