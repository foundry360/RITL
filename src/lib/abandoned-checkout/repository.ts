import type {
  AbandonedCheckoutItem,
  AbandonedCheckoutRecord,
  RecordAbandonedCheckoutInput,
} from "@/lib/abandoned-checkout/types";
import { getProduct } from "@/lib/stripe/products";
import { isOrdersDatabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

const TABLE = "abandoned_checkouts";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function parseItems(value: unknown): AbandonedCheckoutItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (item): item is AbandonedCheckoutItem =>
      Boolean(
        item &&
          typeof item === "object" &&
          typeof (item as AbandonedCheckoutItem).productId === "string" &&
          typeof (item as AbandonedCheckoutItem).quantity === "number" &&
          typeof (item as AbandonedCheckoutItem).purchaseType === "string" &&
          getProduct((item as AbandonedCheckoutItem).productId)
      )
  );
}

function mapRow(row: Record<string, unknown>): AbandonedCheckoutRecord {
  return {
    id: String(row.id),
    email: String(row.email),
    checkoutReference:
      typeof row.checkout_reference === "string" ? row.checkout_reference : null,
    items: parseItems(row.items),
    amountCents:
      typeof row.amount_cents === "number"
        ? row.amount_cents
        : Number(row.amount_cents ?? 0),
    currency: typeof row.currency === "string" ? row.currency : "usd",
    lastActivityAt: String(row.last_activity_at),
    reminderSentAt:
      typeof row.reminder_sent_at === "string" ? row.reminder_sent_at : null,
    convertedAt: typeof row.converted_at === "string" ? row.converted_at : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export async function recordAbandonedCheckout(
  input: RecordAbandonedCheckoutInput
): Promise<void> {
  if (!isOrdersDatabaseConfigured() || !input.items.length) {
    return;
  }

  const email = normalizeEmail(input.email);
  if (!email) {
    return;
  }

  const supabase = createSupabaseServiceClient();
  const now = new Date().toISOString();

  const { error } = await supabase.from(TABLE).upsert(
    {
      email,
      checkout_reference: input.checkoutReference ?? null,
      items: input.items,
      amount_cents: input.amountCents,
      currency: input.currency ?? "usd",
      last_activity_at: now,
      reminder_sent_at: null,
      converted_at: null,
      updated_at: now,
    },
    { onConflict: "email" }
  );

  if (error) {
    throw new Error(error.message);
  }
}

export async function markAbandonedCheckoutConverted(
  email: string
): Promise<void> {
  if (!isOrdersDatabaseConfigured()) {
    return;
  }

  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    return;
  }

  const supabase = createSupabaseServiceClient();
  const { error } = await supabase
    .from(TABLE)
    .update({
      converted_at: new Date().toISOString(),
    })
    .eq("email", normalizedEmail)
    .is("converted_at", null);

  if (error) {
    throw new Error(error.message);
  }
}

export function getAbandonedCheckoutReminderDays(): number {
  const configured = Number.parseInt(
    process.env.ABANDONED_CHECKOUT_REMINDER_DAYS ?? "3",
    10
  );

  if (!Number.isFinite(configured) || configured < 1) {
    return 3;
  }

  return configured;
}

export async function listAbandonedCheckoutsForReminder(): Promise<
  AbandonedCheckoutRecord[]
> {
  if (!isOrdersDatabaseConfigured()) {
    return [];
  }

  const reminderDays = getAbandonedCheckoutReminderDays();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - reminderDays);

  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .is("converted_at", null)
    .is("reminder_sent_at", null)
    .lt("last_activity_at", cutoff.toISOString())
    .order("last_activity_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? [])
    .map((row) => mapRow(row))
    .filter((record) => record.items.length > 0);
}

export async function markAbandonedCheckoutReminderSent(
  id: string
): Promise<void> {
  if (!isOrdersDatabaseConfigured()) {
    return;
  }

  const supabase = createSupabaseServiceClient();
  const { error } = await supabase
    .from(TABLE)
    .update({
      reminder_sent_at: new Date().toISOString(),
    })
    .eq("id", id)
    .is("reminder_sent_at", null);

  if (error) {
    throw new Error(error.message);
  }
}
