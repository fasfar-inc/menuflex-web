"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MenuLocale, RestaurantMenu } from "@/content/menus/types";
import { DishStack } from "./DishStack";
import { BurgerIcon, CategoryIcon, ChevronDownIcon, ChevronsUpIcon, CloseIcon, GlobeIcon, OliveBranch } from "./icons";
import { menuStrings } from "./strings";

const SWITCH_MS = 180;

/**
 * A restaurant's interactive menu: header, sticky categories and the dish
 * deck. Everything fits the viewport, so the page itself never scrolls and
 * nothing can lock it; the deck takes swipes, the wheel and the keyboard.
 */
export function RestaurantMenuApp({ menu }: { menu: RestaurantMenu }) {
  const [locale, setLocale] = useState<MenuLocale>(menu.defaultLocale);
  const [cat, setCat] = useState(0);
  const [dish, setDish] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [overview, setOverview] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const switching = useRef<number | undefined>(undefined);
  const tabs = useRef<HTMLDivElement>(null);
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
    setLangOpen(false);
    try {
      window.localStorage.setItem("menuflex-lang", l);
    } catch {}
  };

  /** Move to another category (its first dish, or `at`), fading the deck across. */
  const selectCategory = useCallback(
    (next: number, at = 0) => {
      window.clearTimeout(switching.current);
      if (next === cat) {
        setDish(at);
        return;
      }
      const go = () => {
        setCat(next);
        setDish(at);
        setLeaving(false);
      };
      if (reduced) return go();
      setLeaving(true);
      switching.current = window.setTimeout(go, SWITCH_MS);
    },
    [cat, reduced],
  );

  const onBoundary = useCallback(
    (dir: -1 | 1) => {
      const next = cat + dir;
      if (next < 0 || next >= menu.categories.length) return false;
      selectCategory(next, dir > 0 ? 0 : menu.categories[next].dishes.length - 1);
      return true;
    },
    [cat, menu.categories, selectCategory],
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

  const nextCategory = menu.categories[cat + 1];
  const lastDish = dish === category.dishes.length - 1;

  return (
    <div className="stone-backdrop relative isolate flex h-dvh flex-col overflow-hidden text-cream">
      {/* header: menu index, restaurant, language */}
      <header className="relative z-20 grid grid-cols-[48px_1fr_auto] items-center gap-2 px-3.5 min-[380px]:gap-3 min-[380px]:px-4 pt-[max(env(safe-area-inset-top),14px)] pb-3 sm:px-6">
        <button
          type="button"
          onClick={() => setOverview(true)}
          aria-label={s.overview}
          aria-haspopup="dialog"
          className="flex h-12 w-12 items-center justify-center rounded-full border border-gold/45 text-gold transition-colors hover:border-gold-bright hover:text-gold-bright"
        >
          <BurgerIcon />
        </button>
        <div className="flex min-w-0 flex-col items-center text-gold">
          <OliveBranch className="-mb-1 h-6 w-[60px]" />
          <h1 className="font-display text-[clamp(2rem,9.6vw,2.6rem)] leading-none font-semibold tracking-[0.18em] text-[#ecd3a6]">{menu.name}</h1>
          <p className="mt-1.5 flex items-center gap-2 text-[10px] font-medium tracking-[0.3em] whitespace-nowrap text-cream-soft uppercase min-[380px]:gap-2.5 min-[380px]:text-[10.5px] min-[380px]:tracking-[0.34em]">
            <span aria-hidden="true" className="h-px w-3 bg-gold/60 min-[380px]:w-5" />
            {menu.subtitle[locale]}
            <span aria-hidden="true" className="h-px w-3 bg-gold/60 min-[380px]:w-5" />
          </p>
        </div>
        {menu.locales.length > 1 ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => setLangOpen((o) => !o)}
              aria-haspopup="menu"
              aria-expanded={langOpen}
              aria-label={`${s.language}: ${s.languages[locale]}`}
              className="flex h-12 items-center gap-1 rounded-full border border-gold/45 px-2.5 text-[14px] min-[380px]:gap-1.5 min-[380px]:px-3 font-medium tracking-[0.06em] text-cream transition-colors hover:border-gold-bright"
            >
              <GlobeIcon className="h-[18px] w-[18px] text-gold" />
              {locale.toUpperCase()}
              <ChevronDownIcon className="h-3.5 w-3.5 text-gold" />
            </button>
            {langOpen && (
              <ul role="menu" className="absolute top-[calc(100%+8px)] right-0 z-40 min-w-[150px] overflow-hidden rounded-2xl border border-gold/30 bg-night-900/95 p-1.5 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.8)] backdrop-blur-md">
                {menu.locales.map((l) => (
                  <li key={l} role="none">
                    <button
                      type="button"
                      role="menuitemradio"
                      aria-checked={l === locale}
                      lang={l}
                      onClick={() => chooseLocale(l)}
                      className={`flex h-11 w-full items-center rounded-xl px-3.5 text-left text-[15px] transition-colors hover:bg-white/[0.05] ${l === locale ? "text-gold" : "text-cream"}`}
                    >
                      {s.languages[l]}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <span className="w-12" />
        )}
      </header>

      {/* sticky categories */}
      <nav aria-label={s.categories} className="relative z-10 border-y border-gold/20 bg-night-950/40 backdrop-blur-sm">
        <div ref={tabs} role="tablist" aria-label={s.categories} onKeyDown={onTabsKey} className="flex overflow-x-auto px-2 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="mx-auto flex w-max min-w-[min(100%,580px)] justify-between gap-1.5">
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
                  className={`flex min-h-[64px] min-w-[68px] flex-1 flex-col items-center justify-center gap-1 rounded-[18px] border px-2.5 transition-[border-color,background-color,box-shadow,color] duration-300 ${
                    on
                      ? "border-gold-bright/80 bg-gold/[0.07] text-cream shadow-[0_0_18px_rgba(214,150,70,0.35),inset_0_0_12px_rgba(214,150,70,0.12)]"
                      : "border-transparent text-cream-soft hover:text-cream"
                  }`}
                >
                  <CategoryIcon name={c.icon} className={`h-[22px] w-[22px] ${on ? "text-gold-bright" : "text-cream-soft"}`} />
                  <span className="font-serif text-[15px] leading-none whitespace-nowrap">{c.label[locale]}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* the deck */}
      <main className="relative min-h-0 flex-1 py-2" role="tabpanel" aria-label={category.label[locale]}>
        <div key={category.id} className={`h-full ${leaving ? "deck-out" : "deck-in"}`}>
          <DishStack
            dishes={category.dishes}
            index={dish}
            onIndexChange={setDish}
            onBoundary={onBoundary}
            locale={locale}
            icon={category.icon}
            categoryLabel={category.label[locale]}
            reduced={reduced}
          />
        </div>
      </main>

      {/* where scrolling leads */}
      <footer className="relative z-10 flex flex-col items-center gap-1 px-4 pt-1 pb-[max(env(safe-area-inset-bottom),12px)] text-center">
        {!(lastDish && !nextCategory) && (
          <button
            type="button"
            onClick={() => (lastDish ? onBoundary(1) : setDish(dish + 1))}
            className="flex flex-col items-center gap-0.5 rounded-full px-4 py-1 text-gold transition-colors hover:text-gold-bright"
          >
            <ChevronsUpIcon className="h-5 w-5" />
            <span className="font-serif text-[15px] tracking-[0.08em] text-cream-soft italic">{lastDish ? s.next(nextCategory.label[locale]) : s.hint}</span>
          </button>
        )}
        <span className="text-[11px] tracking-[0.2em] text-cream-muted tabular-nums" aria-hidden="true">
          {dish + 1} / {category.dishes.length}
        </span>
      </footer>

      {overview && (
        <MenuOverview
          menu={menu}
          locale={locale}
          onClose={() => setOverview(false)}
          onPick={(ci, di) => {
            setOverview(false);
            selectCategory(ci, di);
          }}
        />
      )}
      {langOpen && <button type="button" aria-hidden="true" tabIndex={-1} className="fixed inset-0 z-[15] cursor-default" onClick={() => setLangOpen(false)} />}
    </div>
  );
}

/** Every dish at a glance; picking one brings it to the front of its category. */
function MenuOverview({
  menu,
  locale,
  onClose,
  onPick,
}: {
  menu: RestaurantMenu;
  locale: MenuLocale;
  onClose: () => void;
  onPick: (category: number, dish: number) => void;
}) {
  const s = menuStrings[locale];
  const close = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    close.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div role="dialog" aria-modal="true" aria-label={s.overview} className="deck-in fixed inset-0 z-50 flex flex-col bg-night-950/97 backdrop-blur-md">
      <div className="flex items-center justify-between px-5 pt-[max(env(safe-area-inset-top),16px)] pb-3">
        <p className="font-display text-[26px] font-semibold tracking-[0.18em] text-[#ecd3a6]">{menu.name}</p>
        <button ref={close} type="button" onClick={onClose} aria-label={s.close} className="flex h-12 w-12 items-center justify-center rounded-full border border-gold/45 text-gold">
          <CloseIcon />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-[max(env(safe-area-inset-bottom),24px)]">
        {menu.categories.map((c, ci) => (
          <section key={c.id} className="mt-6">
            <h2 className="flex items-center gap-2.5 text-[12px] font-medium tracking-[0.3em] text-gold uppercase">
              <CategoryIcon name={c.icon} className="h-5 w-5" />
              {c.label[locale]}
            </h2>
            <ul className="mt-2 border-t border-gold/15">
              {c.dishes.map((d, di) => (
                <li key={d.id} className="border-b border-gold/15">
                  <button type="button" onClick={() => onPick(ci, di)} className="flex min-h-[52px] w-full items-baseline justify-between gap-4 py-3 text-left">
                    <span className="font-serif text-[19px] text-cream">{d.name[locale]}</span>
                    <span className="shrink-0 font-serif text-[17px] text-gold-bright">
                      <span className="font-sans text-[0.86em]">{d.price.match(/^\D*/)?.[0]}</span>
                      {d.price.replace(/^\D*/, "")}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
        {menu.note && <p className="mt-8 text-[13px] leading-relaxed text-cream-muted">{menu.note[locale]}</p>}
        <p className="mt-2 text-[12px] tracking-[0.12em] text-cream-muted">{s.poweredBy}</p>
      </div>
    </div>
  );
}
