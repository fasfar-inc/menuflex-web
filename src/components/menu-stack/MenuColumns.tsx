"use client";

import Image from "next/image";
import { forwardRef, useState } from "react";
import type { Dish, MenuCategory, MenuLocale } from "@/content/menus/types";
import { PhotoViewer } from "./PhotoViewer";
import { Price } from "./Price";
import { CategoryIcon } from "./icons";

/**
 * Categories side by side as independent panels, named by the pills above.
 * The row never scrolls under a finger or the wheel (the pills move it), and
 * each panel scrolls its own dishes (overscroll contained, so neither the page nor a
 * neighbour moves); the row of panels scrolls sideways when there are more
 * categories than fit, three to a screen.
 */
export const MenuColumns = forwardRef<HTMLDivElement, { categories: MenuCategory[]; locale: MenuLocale; reduced: boolean }>(
  function MenuColumns({ categories, locale, reduced }, ref) {
    const [viewing, setViewing] = useState<Dish | null>(null);
    return (
      <>
        <div
          ref={ref}
          className="flex h-full touch-pan-y overflow-hidden px-[max(env(safe-area-inset-left),4px)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {categories.map((c, ci) => (
            <section
              key={c.id}
              data-col={c.id}
              aria-label={c.label[locale]}
              className={`flex h-full min-h-0 w-1/3 min-w-0 shrink-0 flex-col border-l border-[#d9a55a]/20 first:border-l-0 ${reduced ? "" : "deck-in"}`}
              style={reduced ? undefined : { animationDelay: `${Math.min(ci, 3) * 70}ms` }}
            >
              <ul
                tabIndex={0}
                aria-label={c.label[locale]}
                className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain px-1.5 pt-4 pb-[max(env(safe-area-inset-bottom),20px)] [scrollbar-color:rgba(217,165,90,0.35)_transparent] [scrollbar-width:thin] focus-visible:outline-none [&::-webkit-scrollbar]:w-[3px] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#d9a55a]/35"
              >
                {c.dishes.map((d) => (
                  <li key={d.id} className="mb-5 last:mb-0">
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
  },
);

/** A dish: round photograph in a thin gold ring, its name, its price in gold, and on roomier screens a line of description. */
function DishCard({ dish, icon, locale, onOpen }: { dish: Dish; icon: MenuCategory["icon"]; locale: MenuLocale; onOpen?: () => void }) {
  const plate = (
    <span className="relative mx-auto block aspect-square w-[min(78%,150px)] overflow-hidden rounded-full bg-[#14100c] shadow-[0_0_0_1px_rgba(217,165,90,0.75),0_0_0_4px_rgba(217,165,90,0.08),0_14px_28px_-12px_rgba(0,0,0,0.9)] transition-transform duration-300 group-hover:scale-[1.04]">
      {dish.photo ? (
        <Image
          src={dish.photo.src}
          alt=""
          fill
          sizes="(max-width: 640px) 30vw, 160px"
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
      <span className="mt-2.5 block px-0.5 text-center font-serif text-[clamp(13px,3.5vw,17px)] leading-[1.2] text-cream [overflow-wrap:anywhere]">{dish.name[locale]}</span>
      <Price value={dish.price} className="mt-1 block text-center font-serif text-[clamp(13px,3.5vw,16px)] text-[#e8b86a] tabular-nums" />
      {dish.description[locale] && (
        <span className="mt-1 hidden px-1 text-center text-[12.5px] leading-[1.4] font-light text-cream-muted sm:line-clamp-2">{dish.description[locale]}</span>
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
