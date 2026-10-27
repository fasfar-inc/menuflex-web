/**
 * Data model for a restaurant's interactive menu at /m/<slug>. One file per
 * restaurant in this folder, registered in `index.ts`.
 */
export type MenuLocale = "en" | "tr";
export type Localized = Record<MenuLocale, string>;

export type CategoryIcon = "starters" | "fish" | "meat" | "desserts" | "drinks";

export type Dish = {
  id: string;
  name: Localized;
  description: Localized;
  /** As printed, with currency (e.g. "₺640"). */
  price: string;
  /** Optional photograph in /public; dishes without one get a typographic card. */
  photo?: { src: string; width: number; height: number; position?: string };
};

export type MenuCategory = {
  id: string;
  icon: CategoryIcon;
  label: Localized;
  dishes: Dish[];
};

export type RestaurantMenu = {
  slug: string;
  name: string;
  subtitle: Localized;
  /** Fictional restaurants used to show MenuFlex; kept out of search and Our Work. */
  demo?: boolean;
  defaultLocale: MenuLocale;
  /** In the order the language switch shows them. */
  locales: MenuLocale[];
  categories: MenuCategory[];
  note?: Localized;
};
