import { BRAND_NAME } from "@/lib/brand";
import { ghlRequest } from "@/lib/gohighlevel/client";
import { getGhlLocationId, getGhlMailingListTag } from "@/lib/gohighlevel/config";

export interface GhlMailingListResult {
  contactId: string;
  created: boolean;
  tag: string;
}

interface GhlUpsertContactResponse {
  new?: boolean;
  contact?: { id: string };
}

export async function syncGhlMailingListSignup(
  email: string
): Promise<GhlMailingListResult> {
  const normalizedEmail = email.trim().toLowerCase();
  const tag = getGhlMailingListTag();

  const response = await ghlRequest<GhlUpsertContactResponse>("/contacts/upsert", {
    method: "POST",
    body: {
      locationId: getGhlLocationId(),
      email: normalizedEmail,
      lastName: "Mailing List",
      source: `${BRAND_NAME} Website / Mailing List`,
    },
  });

  const contactId = response.contact?.id;
  if (!contactId) {
    throw new Error("GoHighLevel upsert did not return a contact id");
  }

  await ghlRequest(`/contacts/${contactId}/tags`, {
    method: "POST",
    body: { tags: [tag] },
  });

  return {
    contactId,
    created: response.new === true,
    tag,
  };
}
