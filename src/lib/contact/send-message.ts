import { Resend } from "resend";
import {
  CONTACT_INBOX,
  getContactFromAddress,
  isContactEmailConfigured,
} from "@/lib/contact/config";

export interface ContactMessageInput {
  name: string;
  email: string;
  message: string;
}

export async function sendContactMessage(
  input: ContactMessageInput
): Promise<void> {
  if (!isContactEmailConfigured()) {
    throw new Error("Contact email is not configured");
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const subject = `RITL website message from ${input.name}`;
  const text = [
    `Name: ${input.name}`,
    `Email: ${input.email}`,
    "",
    input.message,
  ].join("\n");

  const { error } = await resend.emails.send({
    from: getContactFromAddress(),
    to: [CONTACT_INBOX],
    replyTo: input.email,
    subject,
    text,
    html: `
      <p><strong>Name:</strong> ${escapeHtml(input.name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(input.email)}</p>
      <hr />
      <p style="white-space: pre-wrap;">${escapeHtml(input.message)}</p>
    `,
  });

  if (error) {
    throw new Error(error.message);
  }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
