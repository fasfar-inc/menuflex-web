import type { MenuLocale } from "@/content/menus/types";

/** Interface copy for the interactive menu, separate from each restaurant's own content. */
export const menuStrings: Record<
  MenuLocale,
  {
    language: string;
    languages: Record<MenuLocale, string>;
    categories: string;
    hint: string;
    position: (n: number, total: number) => string;
  }
> = {
  en: {
    language: "Language",
    languages: { en: "English", tr: "Türkçe" },
    categories: "Menu categories",
    hint: "Swipe for more",
    position: (n, t) => `Dish ${n} of ${t}`,
  },
  tr: {
    language: "Dil",
    languages: { en: "English", tr: "Türkçe" },
    categories: "Menü kategorileri",
    hint: "Daha fazlası için kaydırın",
    position: (n, t) => `Yemek ${n} / ${t}`,
  },
};
