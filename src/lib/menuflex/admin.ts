import "server-only";
import { redirect } from "next/navigation";
import { supabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServer } from "@/lib/supabase/server";

/**
 * The signed-in MenuFlex admin, or null. The user is checked with Supabase
 * Auth on the server (not just read from the cookie), and the admin role
 * against public.admins.
 */
export async function getAdmin() {
  if (!supabaseConfigured) return null;
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("admins").select("user_id").eq("user_id", user.id).maybeSingle();
  return data ? { supabase, user } : null;
}

/** Every admin page and action starts here: anyone else is sent to the sign-in page. */
export async function requireAdmin() {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login/");
  return admin;
}
