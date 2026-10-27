import type { RestaurantMenu } from "@/content/menus/types";
import { imageUrl } from "@/lib/supabase/env";
import type { CategoryRow, Currency, DishRow, RestaurantRow } from "./types";

const SYMBOL: Record<Currency, string> = { TRY: "₺", EUR: "€", USD: "$", GBP: "£" };

/** A price as printed on the menu, e.g. ₺1.250 or €12,50. */
export function formatPrice(amount: number | string, currency: Currency) {
  const n = Number(amount);
  const whole = Number.isInteger(n);
  const digits = new Intl.NumberFormat("tr-TR", { minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: 2 }).format(n);
  return `${SYMBOL[currency]}${digits}`;
}

/** A restaurant's rows as the menu the approved design renders. Only visible dishes are included. */
export function toRestaurantMenu(r: RestaurantRow, categories: CategoryRow[], dishes: DishRow[]): RestaurantMenu {
  const byPosition = <T extends { position: number; created_at: string }>(a: T, b: T) =>
    a.position - b.position || a.created_at.localeCompare(b.created_at);
  const contact = {
    phone: r.phone || undefined,
    whatsapp: r.whatsapp || undefined,
    email: r.email || undefined,
    address: r.address || undefined,
    instagram: r.instagram || undefined,
  };
  return {
    slug: r.slug,
    name: r.name,
    subtitle: { en: r.subtitle_en, tr: r.subtitle_tr || r.subtitle_en },
    defaultLocale: r.default_locale,
    locales: ["tr", "en"],
    logo: r.logo_path && r.logo_width && r.logo_height ? { src: imageUrl(r.logo_path), width: r.logo_width, height: r.logo_height } : undefined,
    theme: { accent: r.accent_color, background: r.background_color },
    contact: Object.values(contact).some(Boolean) ? contact : undefined,
    categories: [...categories].sort(byPosition).map((c) => ({
      id: c.id,
      icon: c.icon,
      label: { en: c.name_en, tr: c.name_tr },
      dishes: dishes
        .filter((d) => d.category_id === c.id && d.visible)
        .sort(byPosition)
        .map((d) => ({
          id: d.id,
          name: { en: d.name_en, tr: d.name_tr },
          description: { en: d.description_en, tr: d.description_tr },
          price: formatPrice(d.price, r.currency),
          photo:
            d.photo_path && d.photo_width && d.photo_height
              ? { src: imageUrl(d.photo_path), width: d.photo_width, height: d.photo_height }
              : undefined,
        })),
    })),
  };
}
