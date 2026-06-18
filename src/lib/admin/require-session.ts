import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  isAllowedAdminEmail,
  isSupabaseConfigured,
} from "@/lib/supabase/config";

export async function requireAdminSession() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAllowedAdminEmail(user.email)) {
    return null;
  }

  return user;
}
