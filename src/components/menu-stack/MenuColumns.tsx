"use client";

import Image from "next/image";
import { forwardRef, useState } from "react";
import type { Dish, MenuCategory, MenuLocale } from "@/content/menus/types";
import { PhotoViewer } from "./PhotoViewer";
import { Price } from "./Price";
import { CategoryIcon } from "./icons";

/**
 * Every category as a fixed column, all on screen at once: the columns never
 * move, only the dishes inside each one scroll (vertical overscroll
 * contained, so neither the page nor a neighbour moves). On phones the
 * columns are narrow, so headings run vertically and the type is smaller.
 */
export const MenuColumns = forwardRef<HTMLDivElement, { categories: MenuCategory[]; locale: MenuLocale; reduced: boolean }>(function MenuColumns(
  { categories, locale, reduced },
  ref,
) {
  const [viewing, setViewing] = useState<Dish | null>(null);
  return (
    <>
      <div
        ref={ref}
        className="grid h-full overflow-hidden px-[max(env(safe-area-inset-left),2px)]"
        style={{ gridTemplateColumns: `repeat(${categories.length}, minmax(0, 1fr))` }}
      >
        {categories.map((c, ci) => (
          <section
            key={c.id}
            data-col={c.id}
            aria-label={c.label[locale]}
            className={`flex h-full min-h-0 min-w-0 flex-col border-l border-[#d9a55a]/20 first:border-l-0 ${reduced ? "" : "deck-in"}`}
            style={reduced ? undefined : { animationDelay: `${ci * 50}ms` }}
          >
            {/* the heading stays put; only the dishes below it scroll */}
            <header className="flex h-[136px] shrink-0 flex-col items-center px-0.5 pt-2.5 pb-2 text-center md:h-auto md:px-1.5 md:pt-3">
              <CategoryIcon name={c.icon} className="h-4 w-4 shrink-0 text-[#d9a55a] md:h-5 md:w-5" />
              <h2 className="mt-2 flex min-h-0 flex-1 items-center justify-center font-display text-[9.5px] leading-none font-semibold tracking-[0.06em] whitespace-nowrap text-cream uppercase [writing-mode:vertical-rl] md:min-h-[2.4em] md:flex-none md:text-[clamp(9px,1.05vw,16px)] md:leading-tight md:tracking-[0.14em] md:whitespace-normal md:[writing-mode:horizontal-tb]">
                {c.label[locale]}
              </h2>
              <span aria-hidden="true" className="mt-2 block h-px w-6 shrink-0 bg-[linear-gradient(90deg,transparent,#d9a55a,transparent)] md:w-10" />
            </header>
            <ul
              tabIndex={0}
              aria-label={c.label[locale]}
              className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain px-0.5 pt-2 pb-[max(env(safe-area-inset-bottom),20px)] [scrollbar-width:none] focus-visible:outline-none md:px-1.5 md:[scrollbar-color:rgba(217,165,90,0.35)_transparent] md:[scrollbar-width:thin] [&::-webkit-scrollbar]:w-0 md:[&::-webkit-scrollbar]:w-[3px] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#d9a55a]/35"
            >
              {c.dishes.map((d) => (
                <li key={d.id} className="mb-3.5 last:mb-0 md:mb-5">
                  <DishCard dish={d} icon={c.icon} locale={locale} onOpen={d.photo ? () => setViewing(d) : undefined} />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      {viewing && <PhotoViewer dish={viewing} locale={locale} reduced={reduced} onClose={() => setViewing(null)} />}
    </>
  );
});

/** A dish: round photograph in a thin gold ring, its name, its price in gold, and on roomier screens a line of description. */
function DishCard({ dish, icon, locale, onOpen }: { dish: Dish; icon: MenuCategory["icon"]; locale: MenuLocale; onOpen?: () => void }) {
  const plate = (
    <span className="relative mx-auto block aspect-square w-[min(88%,140px)] overflow-hidden rounded-full bg-[#14100c] shadow-[0_0_0_1px_rgba(217,165,90,0.75),0_0_0_3px_rgba(217,165,90,0.08),0_10px_22px_-10px_rgba(0,0,0,0.9)] transition-transform duration-300 group-hover:scale-[1.04]">
      {dish.photo ? (
        <Image
          src={dish.photo.src}
          alt=""
          fill
          sizes="(max-width: 768px) 13vw, 150px"
          className="object-cover"
          style={{ objectPosition: dish.photo.position ?? "50% 55%" }}
          draggable={false}
        />
      ) : (
        // no photograph yet: the category emblem on bronze, never a stand-in picture
        <span className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(70%_70%_at_50%_45%,rgba(222,160,80,0.28)_0%,rgba(222,160,80,0)_72%),linear-gradient(165deg,#3a2c1e_0%,#1d1610_60%,#120e0a_100%)] text-gold-bright/75">
          <CategoryIcon name={icon} className="h-[36%] w-[36%] stroke-[0.9]" />
        </span>
      )}
    </span>
  );
  const text = (
    <>
      <span className="mt-1.5 block px-px text-center font-serif text-[clamp(8.5px,calc(0.9vw+4.5px),16px)] leading-[1.15] text-cream [overflow-wrap:anywhere] [hyphens:auto] md:mt-2.5">{dish.name[locale]}</span>
      <Price value={dish.price} className="mt-0.5 block text-center font-serif text-[clamp(9px,calc(0.85vw+5px),15px)] text-[#e8b86a] tabular-nums md:mt-1" />
      {dish.description[locale] && (
        <span className="mt-1 hidden px-1 text-center text-[12px] leading-[1.4] font-light text-cream-muted xl:line-clamp-2">{dish.description[locale]}</span>
      )}
    </>
  );
  return onOpen ? (
    <button type="button" onClick={onOpen} aria-label={dish.name[locale]} className="group block w-full rounded-xl py-1 focus-visible:outline-2 focus-visible:outline-gold">
      {plate}
      {text}
    </button>
  ) : (
    <div className="py-1">
      {plate}
      {text}
    </div>
  );
}
