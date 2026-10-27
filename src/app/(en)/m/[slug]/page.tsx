import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { RestaurantMenuApp } from "@/components/menu-stack/RestaurantMenuApp";
import { getRestaurantMenu, restaurantMenus } from "@/content/menus";
import { getPublishedMenu } from "@/lib/menuflex/public";

type Props = { params: Promise<{ slug: string }> };

// built-in menus are prerendered; restaurants managed in the admin render on
// request and refresh at most every minute (publishing refreshes at once)
export const revalidate = 60;

export function generateStaticParams() {
  return restaurantMenus.map((m) => ({ slug: m.slug }));
}

/** A built-in menu, or a restaurant published from the admin. */
async function findMenu(slug: string) {
  return getRestaurantMenu(slug) ?? (await getPublishedMenu(slug));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const menu = await findMenu((await params).slug);
  if (!menu) return {};
  return {
    title: `${[menu.name, menu.subtitle.en].filter(Boolean).join(" ")} — Menu`,
    description: `The menu of ${[menu.name, menu.subtitle.en].filter(Boolean).join(" ")}, served by MenuFlex.`,
    // demonstration menus stay out of search results
    robots: menu.demo ? { index: false, follow: false } : undefined,
  };
}

// full-bleed on notched phones; the menu pads itself with the safe areas
export const viewport: Viewport = { themeColor: "#100d0a", viewportFit: "cover" };

/** A restaurant's interactive menu, e.g. /m/liman. */
export default async function RestaurantMenuPage({ params }: Props) {
  const menu = await findMenu((await params).slug);
  if (!menu) notFound();
  return <RestaurantMenuApp menu={menu} />;
}
