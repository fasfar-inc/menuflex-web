import { liman } from "./liman";
import { sabor } from "./sabor";
import type { RestaurantMenu } from "./types";

/** Every restaurant menu served at /m/<slug>. Add real restaurants here. */
export const restaurantMenus: RestaurantMenu[] = [liman, sabor];

export function getRestaurantMenu(slug: string) {
  return restaurantMenus.find((m) => m.slug === slug) ?? null;
}
