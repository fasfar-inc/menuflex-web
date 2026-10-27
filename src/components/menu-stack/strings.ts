import type { MenuLocale } from "@/content/menus/types";

/** Interface copy for the interactive menu, separate from each restaurant's own content. */
export const menuStrings: Record<
  MenuLocale,
  {
    language: string;
    languages: Record<MenuLocale, string>;
    categories: string;
    close: string;
    viewPhoto: string;
    dishes: string;
    hint: string;
    position: (n: number, total: number) => string;
  }
> = {
  en: {
    language: "Language",
    languages: { en: "English", tr: "Türkçe" },
    categories: "Menu categories",
    close: "Close",
    viewPhoto: "View photo",
    dishes: "Dishes",
    hint: "Scroll for next dish",
    position: (n, t) => `Dish ${n} of ${t}`,
  },
  tr: {
    language: "Dil",
    languages: { en: "English", tr: "Türkçe" },
    categories: "Menü kategorileri",
    close: "Kapat",
    viewPhoto: "Fotoğrafı büyüt",
    dishes: "Yemekler",
    hint: "Sonraki yemek için kaydırın",
    position: (n, t) => `Yemek ${n} / ${t}`,
  },
};
