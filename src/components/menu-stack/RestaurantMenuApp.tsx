"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MenuLocale, RestaurantMenu } from "@/content/menus/types";
import { DishTrail, MOTION_MS, REDUCED_MS } from "./DishTrail";
import { CategoryIcon, WaveMark } from "./icons";
import { menuStrings } from "./strings";

const SWITCH_MS = 180;

/**
 * A restaurant's interactive menu: header, sticky categories and the dish
 * trail. Everything fits the viewport, so the page itself never scrolls and
 * nothing can lock it; the trail takes swipes, taps, the mouse wheel and keys.
 */
export function RestaurantMenuApp({ menu }: { menu: RestaurantMenu }) {
  const [locale, setLocale] = useState<MenuLocale>(menu.defaultLocale);
  const [cat, setCat] = useState(0);
  const [dish, setDish] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const [reduced, setReduced] = useState(false);
  const switching = useRef<number | undefined>(undefined);
  // one lock for every input: nothing new starts until the current change has played out
  const lockedUntil = useRef(0);
  const lock = (ms: number) => {
    lockedUntil.current = performance.now() + ms;
  };
  const tabs = useRef<HTMLDivElement>(null);
  // which ends of the category bar have more pills past them, to fade that edge
  const [more, setMore] = useState({ left: false, right: false });
  const syncMore = useCallback(() => {
    const el = tabs.current;
    if (!el) return;
    const left = el.scrollLeft > 2;
    const right = el.scrollLeft < el.scrollWidth - el.clientWidth - 2;
    setMore((m) => (m.left === left && m.right === right ? m : { left, right }));
  }, []);
  useEffect(() => {
    syncMore();
    window.addEventListener("resize", syncMore);
    return () => window.removeEventListener("resize", syncMore);
  }, [syncMore, locale]);
  const s = menuStrings[locale];
  const category = menu.categories[cat];

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    // remembered language, or ?lang=tr
    const asked = new URLSearchParams(window.location.search).get("lang");
    let saved: string | null = null;
    try {
      saved = window.localStorage.getItem("menuflex-lang");
    } catch {}
    const pick = [asked, saved].find((l): l is MenuLocale => !!l && (menu.locales as string[]).includes(l));
    if (pick) setLocale(pick);
    return () => mq.removeEventListener("change", sync);
  }, [menu.locales]);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const chooseLocale = (l: MenuLocale) => {
    setLocale(l);
    try {
      window.localStorage.setItem("menuflex-lang", l);
    } catch {}
  };

  /** Bring a dish of the current category to the front, unless a change is still playing. */
  const goDish = useCallback(
    (i: number) => {
      if (performance.now() < lockedUntil.current) return false;
      lock((reduced ? REDUCED_MS : MOTION_MS) + 30);
      setDish(i);
      return true;
    },
    [reduced],
  );

  /** Move to another category (its first dish, or `at`), fading the dishes across. */
  const selectCategory = useCallback(
    (next: number, at = 0) => {
      window.clearTimeout(switching.current);
      if (next === cat) {
        if (at !== dish) goDish(at);
        return;
      }
      // the new dishes fade out and in; dish changes wait until it has settled
      lock(reduced ? REDUCED_MS : SWITCH_MS + 420);
      const go = () => {
        setCat(next);
        setDish(at);
        setLeaving(false);
      };
      if (reduced) return go();
      setLeaving(true);
      switching.current = window.setTimeout(go, SWITCH_MS);
    },
    [cat, dish, goDish, reduced],
  );

  // keep the active category in view in the bar
  useEffect(() => {
    const el = tabs.current?.querySelector<HTMLElement>(`[data-cat="${category.id}"]`);
    el?.scrollIntoView({ block: "nearest", inline: "center", behavior: reduced ? "auto" : "smooth" });
  }, [category.id, reduced]);

  const onTabsKey = (e: React.KeyboardEvent) => {
    const n = menu.categories.length;
    const to =
      e.key === "ArrowRight" ? (cat + 1) % n : e.key === "ArrowLeft" ? (cat - 1 + n) % n : e.key === "Home" ? 0 : e.key === "End" ? n - 1 : null;
    if (to === null) return;
    e.preventDefault();
    selectCategory(to);
    tabs.current?.querySelector<HTMLElement>(`[data-cat="${menu.categories[to].id}"]`)?.focus();
  };

  return (
    <div className="relative isolate flex h-dvh flex-col overflow-hidden bg-[radial-gradient(90%_60%_at_50%_45%,#17130f_0%,#0b0907_60%,#070605_100%)] text-cream">
      {/* candlelight: soft warm glows at the corners */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <span className="absolute -top-16 -right-20 h-64 w-64 rounded-full bg-[#d9a55a]/14 blur-[70px]" />
        <span className="absolute top-[38%] -left-24 h-56 w-56 rounded-full bg-[#b9773a]/12 blur-[80px]" />
        <span className="absolute -bottom-20 left-1/2 h-48 w-80 -translate-x-1/2 rounded-full bg-[#d9a55a]/8 blur-[90px]" />
      </div>

      {/* header: restaurant, language */}
      <header className="relative z-20 grid grid-cols-[52px_1fr_52px] items-center px-3 pt-[max(env(safe-area-inset-top),16px)] pb-4 min-[380px]:px-4 [@media(max-height:740px)]:pt-[max(env(safe-area-inset-top),8px)] [@media(max-height:740px)]:pb-2">
        <span />
        <div className="flex min-w-0 flex-col items-center">
          <WaveMark className="h-[17px] w-[64px] text-[#d9a55a] [@media(max-height:740px)]:h-[13px] [@media(max-height:740px)]:w-[50px]" />
          <h1 className="mt-1 bg-[linear-gradient(180deg,#f6dcab_0%,#d9a55a_100%)] bg-clip-text font-display text-[clamp(2.1rem,10vw,2.6rem)] leading-none [@media(max-height:740px)]:text-[2rem] font-semibold tracking-[0.02em] text-transparent">
            {menu.name}
          </h1>
          <p className="mt-1.5 text-[10.5px] font-medium [@media(max-height:740px)]:mt-1 [@media(max-height:740px)]:text-[10px] tracking-[0.24em] whitespace-nowrap text-[#d9a55a] uppercase">{menu.subtitle[locale]}</p>
        </div>
        {menu.locales.length > 1 ? (
          <div role="group" aria-label={s.language} className="-mr-1 flex items-center justify-end self-start pt-2 text-[15px] font-medium">
            {menu.locales.map((l, i) => (
              <span key={l} className="flex items-center">
                {i > 0 && <span aria-hidden="true" className="h-3.5 w-px bg-cream/40" />}
                <button
                  type="button"
                  lang={l}
                  aria-label={s.languages[l]}
                  aria-pressed={l === locale}
                  onClick={() => chooseLocale(l)}
                  className={`flex h-11 items-center px-1.5 transition-colors ${l === locale ? "text-cream" : "text-[#d9a55a] hover:text-gold-bright"}`}
                >
                  {l.toUpperCase()}
                </button>
              </span>
            ))}
          </div>
        ) : (
          <span />
        )}
      </header>

      {/* sticky categories */}
      <nav aria-label={s.categories} className="relative z-10">
        <div ref={tabs} role="tablist" aria-label={s.categories} onKeyDown={onTabsKey}
          onScroll={syncMore}
          style={{ maskImage: `linear-gradient(to right, ${more.left ? "transparent" : "#000"}, #000 24px, #000 calc(100% - 32px), ${more.right ? "transparent" : "#000"})` }}
          className="flex overflow-x-auto px-3 py-1 [scrollbar-width:none] [@media(max-height:740px)]:py-0.5 [&::-webkit-scrollbar]:hidden">
          <div className="mx-auto flex w-max min-w-[min(100%,560px)] shrink-0 justify-between gap-1">
            {menu.categories.map((c, i) => {
              const on = i === cat;
              return (
                <button
                  key={c.id}
                  type="button"
                  role="tab"
                  data-cat={c.id}
                  aria-selected={on}
                  tabIndex={on ? 0 : -1}
                  onClick={() => selectCategory(i)}
                  className={`flex h-11 shrink-0 items-center gap-1.5 rounded-full border pr-3.5 pl-3 text-[13px] whitespace-nowrap transition-[background-color,border-color,color] duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold ${
                    on ? "border-[#f6d9a5] bg-[#f6d9a5] font-semibold text-[#17120c]" : "border-cream/25 font-medium text-cream hover:border-cream/50"
                  }`}
                >
                  <CategoryIcon name={c.icon} className="h-[18px] w-[18px] shrink-0" />
                  {c.label[locale]}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* the dishes */}
      <main className="relative min-h-0 flex-1 pt-4 pb-[max(env(safe-area-inset-bottom),10px)] [@media(max-height:740px)]:pt-2" role="tabpanel" aria-label={category.label[locale]}>
        <div key={category.id} className={`h-full ${leaving ? "deck-out" : "deck-in"}`}>
          <DishTrail
            dishes={category.dishes}
            index={dish}
            go={goDish}
            locale={locale}
            icon={category.icon}
            categoryLabel={category.label[locale]}
            reduced={reduced}
          />
        </div>
      </main>

    </div>
  );
}

