export const CONTACT_SENDER_NAME = "RITUL Operations";

export const CONTACT_INBOX =
  process.env.CONTACT_INBOX?.trim() || "support@getritul.com";

export function isContactEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

export function getContactFromAddress(): string {
  return (
    process.env.CONTACT_FROM_EMAIL?.trim() ||
    `${CONTACT_SENDER_NAME} <${CONTACT_INBOX}>`
  );
}
