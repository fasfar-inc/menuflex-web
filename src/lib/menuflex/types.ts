/** Rows of the MenuFlex tables (see supabase/migrations). */

export type Currency = "TRY" | "EUR" | "USD" | "GBP";
export type Status = "draft" | "published";
export type CategoryIconName = "starters" | "fish" | "meat" | "desserts" | "drinks";

export type RestaurantRow = {
  id: string;
  slug: string;
  public_code: string;
  name: string;
  subtitle_en: string;
  subtitle_tr: string;
  logo_path: string | null;
  logo_width: number | null;
  logo_height: number | null;
  accent_color: string;
  background_color: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  instagram: string;
  currency: Currency;
  default_locale: "tr" | "en";
  status: Status;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type CategoryRow = {
  id: string;
  restaurant_id: string;
  name_en: string;
  name_tr: string;
  icon: CategoryIconName;
  position: number;
  created_at: string;
};

export type DishRow = {
  id: string;
  restaurant_id: string;
  category_id: string;
  name_en: string;
  name_tr: string;
  description_en: string;
  description_tr: string;
  price: number | string;
  photo_path: string | null;
  photo_width: number | null;
  photo_height: number | null;
  visible: boolean;
  position: number;
  created_at: string;
};

export const CURRENCIES: Currency[] = ["TRY", "EUR", "USD", "GBP"];
export const CATEGORY_ICONS: CategoryIconName[] = ["starters", "fish", "meat", "desserts", "drinks"];

/** Default accent and page colour: the approved MenuFlex gold and dark. */
export const DEFAULT_ACCENT = "#f6d9a5";
export const DEFAULT_BACKGROUND = "#0d0b09";

/** Slugs the app already uses for its own menus. */
export const RESERVED_SLUGS = ["liman", "sabor"];
