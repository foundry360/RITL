import { createClient } from "@supabase/supabase-js";
import {
  getSupabaseServiceRoleKey,
  getSupabaseUrl,
  isSupabaseServiceConfigured,
} from "@/lib/supabase/config";

export function createSupabaseServiceClient() {
  if (!isSupabaseServiceConfigured()) {
    throw new Error("Supabase service role is not configured");
  }

  return createClient(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
