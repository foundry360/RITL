import {
  listAbandonedCheckoutsForReminder,
  markAbandonedCheckoutReminderSent,
} from "@/lib/abandoned-checkout/repository";
import { sendAbandonedCheckoutEmail } from "@/lib/email/send-abandoned-checkout";

export async function processAbandonedCheckoutReminders(): Promise<{
  scanned: number;
  sent: number;
  failed: number;
}> {
  const records = await listAbandonedCheckoutsForReminder();
  let sent = 0;
  let failed = 0;

  for (const record of records) {
    try {
      await sendAbandonedCheckoutEmail(record);
      await markAbandonedCheckoutReminderSent(record.id);
      sent += 1;
    } catch (error) {
      failed += 1;
      console.error(
        `Abandoned checkout reminder failed for ${record.email}:`,
        error
      );
    }
  }

  return {
    scanned: records.length,
    sent,
    failed,
  };
}
