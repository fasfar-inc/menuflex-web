import type { Dish, MenuLocale } from "@/content/menus/types";
import { Price } from "./Price";

/**
 * A category with no photographs yet, as a plain list: name and price, then
 * the description. It scrolls inside the menu; the page itself still doesn't.
 */
export function DishList({ dishes, locale, categoryLabel }: { dishes: Dish[]; locale: MenuLocale; categoryLabel: string }) {
  return (
    <div className="h-full overflow-y-auto overscroll-contain px-6 pt-3 pb-6">
      <p className="flex items-center gap-3 text-[11px] font-medium tracking-[0.32em] text-[#d9a55a] uppercase">
        {categoryLabel}
        <span aria-hidden="true" className="h-px w-10 bg-[#d9a55a]/70" />
      </p>
      <ul className="mt-3">
        {dishes.map((d) => (
          <li key={d.id} className="border-b border-cream/10 py-4 last:border-0">
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="min-w-0 font-serif text-[clamp(20px,6vw,24px)] leading-tight text-cream">{d.name[locale]}</h2>
              <Price value={d.price} className="shrink-0 font-serif text-[clamp(19px,5.6vw,22px)] text-[#e8b86a]" />
            </div>
            <p className="mt-1.5 text-[14px] leading-[1.5] font-light text-cream-soft">{d.description[locale]}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
