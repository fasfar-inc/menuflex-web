import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RestaurantMenuApp } from "@/components/menu-stack/RestaurantMenuApp";
import { requireAdmin } from "@/lib/menuflex/admin";
import { toRestaurantMenu } from "@/lib/menuflex/menu";
import type { CategoryRow, DishRow, RestaurantRow } from "@/lib/menuflex/types";

export const metadata: Metadata = { title: "Preview" };
export const viewport: Viewport = { themeColor: "#100d0a", viewportFit: "cover" };

/** The menu exactly as guests will see it, drafts included, for admins only. */
export default async function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { supabase } = await requireAdmin();
  const { id } = await params;
  const { data: r } = await supabase.from("restaurants").select("*").eq("id", id).maybeSingle<RestaurantRow>();
  if (!r) notFound();
  const [{ data: categories }, { data: dishes }] = await Promise.all([
    supabase.from("categories").select("*").eq("restaurant_id", id).returns<CategoryRow[]>(),
    supabase.from("dishes").select("*").eq("restaurant_id", id).returns<DishRow[]>(),
  ]);
  const menu = toRestaurantMenu(r, categories ?? [], dishes ?? []);
  return (
    <>
      {menu.categories.length > 0 ? (
        <RestaurantMenuApp menu={menu} />
      ) : (
        <main className="flex min-h-dvh items-center justify-center px-6 text-center text-cream-soft">Add a category and some dishes to preview this menu.</main>
      )}
      <Link
        href={`/admin/restaurants/${r.id}/menu/`}
        className="fixed right-3 bottom-[max(env(safe-area-inset-bottom),12px)] z-[100] rounded-full border border-cream/20 bg-night-950/85 px-3 py-1.5 text-[12px] font-medium text-cream backdrop-blur"
      >
        Preview{r.status === "draft" ? " · draft" : ""} · back to admin
      </Link>
    </>
  );
}
