import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { supabaseAnonKey, supabaseUrl } from "./env";

/** The signed-in user's client, for the admin: every query runs under their row level security. */
export async function createSupabaseServer() {
  const store = await cookies();
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          for (const { name, value, options } of list) store.set(name, value, options);
        } catch {
          // a Server Component can't set cookies; the middleware refreshes the session instead
        }
      },
    },
  });
}

/** Cache tag on every public read; admin changes clear it so they show at once. */
export const PUBLIC_DATA_TAG = "menuflex-public";

/**
 * An anonymous client for public pages: it can only read published menus.
 * Its reads are cached for a minute and tagged, so pages stay fast and an
 * admin change refreshes them straight away.
 */
export function createSupabasePublic() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => fetch(input, { ...init, next: { revalidate: 60, tags: [PUBLIC_DATA_TAG] } }) },
  });
}
