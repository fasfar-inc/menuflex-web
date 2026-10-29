"use client";

import Image from "next/image";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import type { Dish, MenuCategory, MenuLocale } from "@/content/menus/types";
import { PhotoViewer } from "./PhotoViewer";
import { Price } from "./Price";
import { CategoryIcon } from "./icons";

/**
 * Categories side by side as independent panels. Each panel keeps its heading
 * and scrolls its own dishes (vertical overscroll contained, so neither the
 * page nor a neighbour moves); the row of panels scrolls sideways, one panel
 * per swipe, when there are more categories than fit, three to a screen.
 * Arrows at the edges do the same for a mouse.
 */
export const MenuColumns = forwardRef<HTMLDivElement, { categories: MenuCategory[]; locale: MenuLocale; reduced: boolean; onScroll?: () => void }>(
  function MenuColumns({ categories, locale, reduced, onScroll }, ref) {
    const [viewing, setViewing] = useState<Dish | null>(null);
    const row = useRef<HTMLDivElement>(null);
    useImperativeHandle(ref, () => row.current!, []);
    // which ways there are more panels to see
    const [more, setMore] = useState({ left: false, right: false });
    const sync = useCallback(() => {
      const el = row.current;
      if (!el) return;
      const left = el.scrollLeft > 8;
      const right = el.scrollLeft < el.scrollWidth - el.clientWidth - 8;
      setMore((m) => (m.left === left && m.right === right ? m : { left, right }));
    }, []);
    useEffect(() => {
      sync();
      window.addEventListener("resize", sync);
      return () => window.removeEventListener("resize", sync);
    }, [sync]);
    const page = (dir: 1 | -1) => {
      const el = row.current;
      const w = (el?.firstElementChild as HTMLElement | null)?.offsetWidth ?? 0;
      el?.scrollBy({ left: dir * w, behavior: reduced ? "auto" : "smooth" });
    };
    const arrow = (dir: 1 | -1) => (
      <button
        type="button"
        aria-label={dir > 0 ? (locale === "tr" ? "Sonraki kategori" : "Next category") : locale === "tr" ? "Önceki kategori" : "Previous category"}
        onClick={() => page(dir)}
        className={`absolute top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-[#d9a55a]/40 bg-[#0a0908]/85 text-[#e8b86a] backdrop-blur transition-opacity hover:border-[#d9a55a] ${dir > 0 ? "right-1.5" : "left-1.5"}`}
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d={dir > 0 ? "m9 6 6 6-6 6" : "m15 6-6 6 6 6"} />
        </svg>
      </button>
    );
    return (
      <>
        {more.left && arrow(-1)}
        {more.right && arrow(1)}
        <div
          ref={row}
          onScroll={() => {
            sync();
            onScroll?.();
          }}
          className="flex h-full snap-x snap-mandatory gap-0 overflow-x-auto overflow-y-hidden overscroll-x-contain px-[max(env(safe-area-inset-left),4px)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {categories.map((c, ci) => (
            <section
              key={c.id}
              data-col={c.id}
              aria-label={c.label[locale]}
              className={`flex h-full min-h-0 w-1/3 min-w-[118px] shrink-0 snap-start snap-always flex-col border-l border-[#d9a55a]/20 first:border-l-0 ${reduced ? "" : "deck-in"}`}
              style={reduced ? undefined : { animationDelay: `${Math.min(ci, 3) * 70}ms` }}
            >
              {/* the heading stays put; only the dishes below it scroll */}
              <header className="shrink-0 px-2 pt-3 pb-2 text-center">
                <CategoryIcon name={c.icon} className="mx-auto h-5 w-5 text-[#d9a55a]" />
                <h2 className="mt-1.5 flex min-h-[2.4em] items-center justify-center font-display text-[clamp(11.5px,3.1vw,19px)] leading-tight font-semibold tracking-[0.06em] [overflow-wrap:anywhere] sm:tracking-[0.16em] text-cream uppercase">
                  {c.label[locale]}
                </h2>
                <span aria-hidden="true" className="mx-auto mt-2 block h-px w-10 bg-[linear-gradient(90deg,transparent,#d9a55a,transparent)]" />
              </header>
              <ul
                tabIndex={0}
                aria-label={c.label[locale]}
                className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain px-1.5 pt-2 pb-[max(env(safe-area-inset-bottom),20px)] [scrollbar-color:rgba(217,165,90,0.35)_transparent] [scrollbar-width:thin] focus-visible:outline-none [&::-webkit-scrollbar]:w-[3px] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#d9a55a]/35"
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
