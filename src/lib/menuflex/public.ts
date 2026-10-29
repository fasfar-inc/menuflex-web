import "server-only";
import { createSupabasePublic } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/env";
import { toRestaurantMenu } from "./menu";
import type { CategoryRow, DishRow, RestaurantRow } from "./types";

// Everything here runs as the anonymous public, so row level security only
// ever returns published restaurants and their visible dishes.

/** A published restaurant's menu, or null. */
export async function getPublishedMenu(slug: string) {
  if (!supabaseConfigured) return null;
  const db = createSupabasePublic();
  const { data: r } = await db.from("restaurants").select("*").eq("slug", slug).eq("status", "published").maybeSingle<RestaurantRow>();
  if (!r) return null;
  const [{ data: categories }, { data: dishes }] = await Promise.all([
    db.from("categories").select("*").eq("restaurant_id", r.id).returns<CategoryRow[]>(),
    db.from("dishes").select("*").eq("restaurant_id", r.id).eq("visible", true).returns<DishRow[]>(),
  ]);
  return toRestaurantMenu(r, categories ?? [], dishes ?? []);
}

/** Published restaurants for Our Work, oldest first. Empty when Supabase isn't configured or can't be reached. */
export async function getPublishedRestaurants(): Promise<{ name: string; slug: string }[]> {
  if (!supabaseConfigured) return [];
  try {
    const { data } = await createSupabasePublic()
      .from("restaurants")
      .select("name, slug")
      .eq("status", "published")
      .order("published_at", { ascending: true });
    return data ?? [];
  } catch {
    return [];
  }
}

/** The slug behind a QR code's stable address, if that restaurant is published. */
export async function slugForCode(code: string) {
  if (!supabaseConfigured || !/^[a-z0-9]{6,20}$/.test(code)) return null;
  const { data } = await createSupabasePublic()
    .from("restaurants")
    .select("slug")
    .eq("public_code", code)
    .eq("status", "published")
    .maybeSingle<{ slug: string }>();
  return data?.slug ?? null;
}
