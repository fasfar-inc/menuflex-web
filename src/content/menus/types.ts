/**
 * Data model for a restaurant's interactive menu at /m/<slug>. One file per
 * restaurant in this folder, registered in `index.ts`.
 */
export type MenuLocale = "en" | "tr";
export type Localized = Record<MenuLocale, string>;

export type CategoryIcon = "starters" | "fish" | "meat" | "desserts" | "drinks" | "pasta" | "chicken" | "salad" | "kids";

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
  /** LIMAN's wave above the name; other restaurants show their logo, or nothing. */
  mark?: "wave";
  /** The restaurant's own mark, shown above its name. */
  logo?: { src: string; width: number; height: number };
  /** Accent (name, selected category) and page colour; the approved gold and dark when absent. */
  theme?: { accent: string; background: string };
  /** Shown at the foot of the full-menu list when given. */
  contact?: { phone?: string; whatsapp?: string; email?: string; address?: string; instagram?: string };
};
