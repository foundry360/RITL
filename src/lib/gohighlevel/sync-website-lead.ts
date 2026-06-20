import { BRAND_NAME } from "@/lib/brand";
import { ghlRequest } from "@/lib/gohighlevel/client";
import {
  getGhlLocationId,
  getGhlWebsiteLeadResubmitTag,
  getGhlWebsiteLeadTag,
} from "@/lib/gohighlevel/config";

export interface GhlWebsiteLeadInput {
  name: string;
  email: string;
}

export interface GhlWebsiteLeadResult {
  contactId: string;
  created: boolean;
  tag: string;
}

interface GhlUpsertContactResponse {
  new?: boolean;
  contact?: { id: string };
}

function splitName(fullName: string): { firstName?: string; lastName?: string } {
  const trimmed = fullName.trim();
  if (!trimmed) {
    return { lastName: "Website Lead" };
  }

  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) {
    return { lastName: parts[0] };
  }

  return {
    firstName: parts.slice(0, -1).join(" "),
    lastName: parts.at(-1),
  };
}

export async function syncGhlWebsiteLead(
  input: GhlWebsiteLeadInput
): Promise<GhlWebsiteLeadResult> {
  const { firstName, lastName } = splitName(input.name);
  const email = input.email.trim().toLowerCase();

  const response = await ghlRequest<GhlUpsertContactResponse>("/contacts/upsert", {
    method: "POST",
    body: {
      locationId: getGhlLocationId(),
      email,
      firstName,
      lastName,
      source: `${BRAND_NAME} Website / Lead Modal`,
    },
  });

  const contactId = response.contact?.id;
  if (!contactId) {
    throw new Error("GoHighLevel upsert did not return a contact id");
  }

  const isNewContact = response.new === true;
  const tag = isNewContact
    ? getGhlWebsiteLeadTag()
    : getGhlWebsiteLeadResubmitTag();

  await ghlRequest(`/contacts/${contactId}/tags`, {
    method: "POST",
    body: { tags: [tag] },
  });

  return {
    contactId,
    created: isNewContact,
    tag,
  };
}
