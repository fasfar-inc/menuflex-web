import type { DishTag, MenuLocale } from "@/content/menus/types";

/** Interface copy for the interactive menu, separate from each restaurant's own content. */
export const menuStrings: Record<
  MenuLocale,
  {
    language: string;
    languages: Record<MenuLocale, string>;
    categories: string;
    overview: string;
    close: string;
    dishes: string;
    hint: string;
    next: (category: string) => string;
    position: (n: number, total: number) => string;
    tags: Record<DishTag, string>;
    poweredBy: string;
  }
> = {
  en: {
    language: "Language",
    languages: { en: "English", tr: "Türkçe" },
    categories: "Menu categories",
    overview: "Full menu",
    close: "Close",
    dishes: "Dishes",
    hint: "Scroll for next dish",
    next: (c) => `Next: ${c}`,
    position: (n, t) => `Dish ${n} of ${t}`,
    tags: {
      fresh: "Fresh Ingredients",
      chef: "Chef's Special",
      sustainable: "Sustainable Catch",
      vegetarian: "Vegetarian",
      spicy: "Spicy",
      signature: "House Signature",
    },
    poweredBy: "Menu by MenuFlex",
  },
  tr: {
    language: "Dil",
    languages: { en: "English", tr: "Türkçe" },
    categories: "Menü kategorileri",
    overview: "Tüm menü",
    close: "Kapat",
    dishes: "Yemekler",
    hint: "Sonraki yemek için kaydırın",
    next: (c) => `Sıradaki: ${c}`,
    position: (n, t) => `Yemek ${n} / ${t}`,
    tags: {
      fresh: "Taze Malzemeler",
      chef: "Şefin Önerisi",
      sustainable: "Sürdürülebilir Av",
      vegetarian: "Vejetaryen",
      spicy: "Acı",
      signature: "Evin İmzası",
    },
    poweredBy: "Menü: MenuFlex",
  },
};
