import Link from "next/link";
import type { RestaurantRow } from "@/lib/menuflex/types";
import { StatusBadge } from "./ui";

/** The restaurant's name, status and its three pages. */
export function RestaurantTabs({ restaurant, current }: { restaurant: Pick<RestaurantRow, "id" | "name" | "slug" | "status">; current: "settings" | "menu" }) {
  const tab = (href: string, label: string, on: boolean) => (
    <Link
      href={href}
      aria-current={on ? "page" : undefined}
      className={`rounded-lg px-3 py-2 text-[14px] font-medium ${on ? "bg-cream/10 text-cream" : "text-cream-soft hover:text-cream"}`}
    >
      {label}
    </Link>
  );
  return (
    <div className="space-y-4">
      <Link href="/admin/" className="text-[13px] text-cream-muted hover:text-cream">
        ← Restaurants
      </Link>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-serif text-[32px] leading-tight text-cream">{restaurant.name}</h1>
        <StatusBadge status={restaurant.status} />
      </div>
      <nav className="flex flex-wrap items-center gap-1 border-b border-cream/10 pb-2">
        {tab(`/admin/restaurants/${restaurant.id}/`, "Settings", current === "settings")}
        {tab(`/admin/restaurants/${restaurant.id}/menu/`, "Menu", current === "menu")}
        <Link href={`/admin/preview/${restaurant.id}/`} target="_blank" className="rounded-lg px-3 py-2 text-[14px] font-medium text-cream-soft hover:text-cream">
          Preview ↗
        </Link>
        {restaurant.status === "published" && (
          <Link href={`/m/${restaurant.slug}/`} target="_blank" className="rounded-lg px-3 py-2 text-[14px] font-medium text-cream-soft hover:text-cream">
            Live menu ↗
          </Link>
        )}
      </nav>
    </div>
  );
}
