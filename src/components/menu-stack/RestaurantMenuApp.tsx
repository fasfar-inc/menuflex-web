"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import type { MenuLocale, RestaurantMenu } from "@/content/menus/types";
import { DishList } from "./DishList";
import { DishWheel, MOTION_MS, REDUCED_MS } from "./DishWheel";
import { MenuBackdrop } from "./MenuBackdrop";
import { MenuColumns } from "./MenuColumns";
import { Price } from "./Price";
import { BurgerIcon, CategoryIcon, CloseIcon, WaveMark } from "./icons";
import { menuStrings } from "./strings";

const SWITCH_MS = 180;

/**
 * A restaurant's interactive menu: header, sticky categories and the dish
 * wheel. Everything fits the viewport, so the page itself never scrolls and
 * nothing can lock it; the wheel takes swipes, taps, the mouse wheel and keys.
 */
export function RestaurantMenuApp({ menu }: { menu: RestaurantMenu }) {
  const [locale, setLocale] = useState<MenuLocale>(menu.defaultLocale);
  const [cat, setCat] = useState(0);
  const [dish, setDish] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const [reduced, setReduced] = useState(false);
  // the full-menu list: closed, or open at a category
  const [overview, setOverview] = useState<string | false>(false);
  const switching = useRef<number | undefined>(undefined);
  // one lock for every input: nothing new starts until the current change has played out
  const lockedUntil = useRef(0);
  const lock = (ms: number) => {
    lockedUntil.current = performance.now() + ms;
  };
  const tabs = useRef<HTMLDivElement>(null);
  const s = menuStrings[locale];
  const category = menu.categories[cat];
  // the wheel shows dishes with a photograph; a category with none yet is a plain list
  const pictured = (c: (typeof menu.categories)[number]) => c.dishes.filter((d) => d.photo);
  const onWheel = pictured(category);
  // columns layout: every category is a panel; the pills scroll the row to one
  const columns = menu.layout === "columns";
  const colsRef = useRef<HTMLDivElement>(null);
  const scrollToColumn = (i: number) => {
    const el = colsRef.current?.querySelector<HTMLElement>(`[data-col="${menu.categories[i].id}"]`);
    colsRef.current?.scrollTo({ left: el ? el.offsetLeft - colsRef.current.offsetLeft : 0, behavior: reduced ? "auto" : "smooth" });
  };
  // the leftmost panel in view is the active category
  const onColumnsScroll = () => {
    const box = colsRef.current;
    const first = box?.firstElementChild as HTMLElement | null;
    if (!box || !first) return;
    const i = Math.min(menu.categories.length - 1, Math.round(box.scrollLeft / first.offsetWidth));
    if (i !== cat) setCat(i);
  };

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

  /** Move to another category (its first dish, or `at`), fading the wheel across. */
  const selectCategory = useCallback(
    (next: number, at = 0) => {
      if (menu.layout === "columns") {
        setCat(next);
        scrollToColumn(next);
        return;
      }
      window.clearTimeout(switching.current);
      if (next === cat) {
        if (at !== dish) goDish(at);
        return;
      }
      // the new wheel fades out and in; dish changes wait until it has settled
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- scrollToColumn only reads refs and props
    [cat, dish, goDish, reduced, menu.layout],
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

  // a restaurant's own colours, when it has them; otherwise the approved gold and dark
  const accent = menu.theme && menu.theme.accent.toLowerCase() !== "#f6d9a5" ? menu.theme.accent : null;

  return (
    <div className="relative isolate flex h-dvh flex-col overflow-hidden bg-[#0d0b09] text-cream" style={menu.theme ? { backgroundColor: menu.theme.background } : undefined}>
      <MenuBackdrop />

      {/* header, kept small so the dishes have the room: full menu, restaurant, language */}
      <header className="relative z-20 grid grid-cols-[52px_1fr_52px] items-center px-3 pt-[max(env(safe-area-inset-top),6px)] min-[380px]:px-4">
        <button
          type="button"
          onClick={() => setOverview(category.id)}
          aria-label={s.overview}
          aria-haspopup="dialog"
          className="-ml-1 flex h-11 w-11 items-center justify-center text-cream transition-colors hover:text-gold-bright"
        >
          <BurgerIcon className="h-6 w-6" />
        </button>
        <div className="flex min-w-0 flex-col items-center">
          {menu.logo ? (
            <Image
              src={menu.logo.src}
              alt=""
              width={menu.logo.width}
              height={menu.logo.height}
              unoptimized
              className="h-7 w-auto max-w-[120px] object-contain"
            />
          ) : menu.mark === "wave" ? (
            <WaveMark className="h-[9px] w-[34px] text-[#d9a55a]" />
          ) : null}
          <h1
            className={`mt-0.5 font-display text-[1.45rem] leading-none font-semibold tracking-[0.04em] ${accent ? "" : "bg-[linear-gradient(180deg,#f6dcab_0%,#d9a55a_100%)] bg-clip-text text-transparent"}`}
            style={accent ? { color: accent } : undefined}
          >
            {menu.name}
          </h1>
          <p className="mt-0.5 text-[8.5px] font-medium tracking-[0.26em] whitespace-nowrap text-[#d9a55a] uppercase">{menu.subtitle[locale]}</p>
        </div>
        {menu.locales.length > 1 ? (
          <div role="group" aria-label={s.language} className="-mr-1 flex items-center justify-end text-[14px] font-medium">
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

      {/* sticky categories; the columns layout names them on the columns instead */}
      {!columns && (
      <nav aria-label={s.categories} className="relative z-10">
        <div ref={tabs} role="tablist" aria-label={s.categories} onKeyDown={onTabsKey} className="flex overflow-x-auto px-3 pt-1 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="mx-auto flex w-max min-w-[min(100%,560px)] justify-between gap-1">
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
                  style={on && accent ? { backgroundColor: accent, borderColor: accent, color: readableOn(accent) } : undefined}
                  className={`h-9 shrink-0 rounded-full border px-3 text-[13px] min-[400px]:px-3.5 whitespace-nowrap transition-[background-color,border-color,color] duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold ${
                    on ? "border-[#f6d9a5] bg-[#f6d9a5] font-semibold text-[#17120c]" : "border-cream/25 font-medium text-cream hover:border-cream/50"
                  }`}
                >
                  {c.label[locale]}
                </button>
              );
            })}
          </div>
        </div>
      </nav>
      )}

      {columns ? (
        // the categories as side-by-side panels, each scrolling on its own
        <main className="relative mt-2 min-h-0 flex-1 border-t border-[#d9a55a]/25">
          <MenuColumns ref={colsRef} categories={menu.categories} locale={locale} reduced={reduced} onScroll={onColumnsScroll} />
        </main>
      ) : (
      /* the dish wheel */
      <main className="relative min-h-0 flex-1 pt-1 pb-[max(env(safe-area-inset-bottom),10px)]" role="tabpanel" aria-label={category.label[locale]}>
        <div key={category.id} className={`h-full ${leaving ? "deck-out" : "deck-in"}`}>
          {onWheel.length > 0 ? (
            <DishWheel
              dishes={onWheel}
              index={dish}
              go={goDish}
              locale={locale}
              icon={category.icon}
              categoryLabel={category.label[locale]}
              reduced={reduced}
              // dishes without a photo are read in the full menu
              more={category.dishes.length > onWheel.length ? { label: s.seeAll(category.dishes.length), open: () => setOverview(category.id) } : undefined}
            />
          ) : (
            <DishList dishes={category.dishes} locale={locale} categoryLabel={category.label[locale]} />
          )}
        </div>
      </main>
      )}

      {overview && (
        <MenuOverview
          menu={menu}
          focus={overview}
          accent={accent}
          locale={locale}
          onClose={() => setOverview(false)}
          onPick={(ci, di) => {
            setOverview(false);
            // a dish off the wheel (no photograph yet) opens its category at the start
            const c = menu.categories[ci];
            selectCategory(ci, Math.max(0, pictured(c).indexOf(c.dishes[di])));
          }}
        />
      )}
    </div>
  );
}

/** Every dish at a glance; picking one brings it to the front of its category. */
function MenuOverview({
  menu,
  focus,
  accent,
  locale,
  onClose,
  onPick,
}: {
  menu: RestaurantMenu;
  /** The category to open at. */
  focus: string;
  accent: string | null;
  locale: MenuLocale;
  onClose: () => void;
  onPick: (category: number, dish: number) => void;
}) {
  const s = menuStrings[locale];
  const close = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    close.current?.focus();
    document.getElementById(`overview-${focus}`)?.scrollIntoView({ block: "start" });
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, focus]);

  return (
    <div role="dialog" aria-modal="true" aria-label={s.overview} className="deck-in fixed inset-0 z-50 flex flex-col bg-[#0b0907]/97 backdrop-blur-md">
      <div className="flex items-center justify-between px-5 pt-[max(env(safe-area-inset-top),16px)] pb-3">
        <p
          className={`font-display text-[28px] font-semibold ${accent ? "" : "bg-[linear-gradient(180deg,#f6dcab_0%,#d9a55a_100%)] bg-clip-text text-transparent"}`}
          style={accent ? { color: accent } : undefined}
        >
          {menu.name}
        </p>
        <button ref={close} type="button" onClick={onClose} aria-label={s.close} className="-mr-2 flex h-12 w-12 items-center justify-center text-cream">
          <CloseIcon className="h-7 w-7" />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-[max(env(safe-area-inset-bottom),24px)]">
        {menu.categories.map((c, ci) => (
          <section key={c.id} id={`overview-${c.id}`} className="scroll-mt-2 pt-6">
            <h2 className="flex items-center gap-2.5 text-[12px] font-medium tracking-[0.3em] text-[#d9a55a] uppercase">
              <CategoryIcon name={c.icon} className="h-5 w-5" />
              {c.label[locale]}
            </h2>
            <ul className="mt-2 border-t border-cream/10">
              {c.dishes.map((d, di) => (
                <li key={d.id} className="border-b border-cream/10">
                  {d.photo ? (
                    // dishes with a photo open on the wheel
                    <button type="button" onClick={() => onPick(ci, di)} className="flex min-h-[52px] w-full items-baseline justify-between gap-4 py-3 text-left">
                      <span className="font-serif text-[19px] text-cream">
                        {d.name[locale]} <span aria-hidden="true" className="ml-1 text-[13px] text-[#d9a55a]">◉</span>
                      </span>
                      <Price value={d.price} className="shrink-0 font-serif text-[17px] text-cream-soft" />
                    </button>
                  ) : (
                    // the others are read here
                    <div className="py-3">
                      <div className="flex items-baseline justify-between gap-4">
                        <span className="font-serif text-[19px] text-cream">{d.name[locale]}</span>
                        <Price value={d.price} className="shrink-0 font-serif text-[17px] text-cream-soft" />
                      </div>
                      {d.description[locale] && <p className="mt-1 text-[13.5px] leading-[1.45] font-light text-cream-muted">{d.description[locale]}</p>}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))}
        {menu.note && <p className="mt-8 text-[13px] leading-relaxed text-cream-muted">{menu.note[locale]}</p>}
        {menu.contact && <ContactLines contact={menu.contact} />}
        <p className="mt-2 text-[12px] tracking-[0.12em] text-cream-muted">{s.poweredBy}</p>
      </div>
    </div>
  );
}

/** Dark text on a light accent, light text on a dark one. */
function readableOn(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? "#17120c" : "#fbf5ea";
}

/** The restaurant's contact details at the foot of the full menu, each one a link. */
function ContactLines({ contact }: { contact: NonNullable<RestaurantMenu["contact"]> }) {
  const lines = [
    contact.phone && { label: contact.phone, href: `tel:${contact.phone.replace(/[^+0-9]/g, "")}` },
    contact.whatsapp && { label: `WhatsApp +${contact.whatsapp}`, href: `https://wa.me/${contact.whatsapp}` },
    contact.email && { label: contact.email, href: `mailto:${contact.email}` },
    contact.instagram && { label: `@${contact.instagram.replace(/^@/, "")}`, href: `https://instagram.com/${contact.instagram.replace(/^@/, "")}` },
    contact.address && { label: contact.address, href: `https://maps.google.com/?q=${encodeURIComponent(contact.address)}` },
  ].filter((l): l is { label: string; href: string } => Boolean(l));
  return (
    <ul className="mt-8 space-y-2 text-[14px] text-cream-soft">
      {lines.map((l) => (
        <li key={l.href}>
          <a href={l.href} target={l.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className="underline-offset-4 hover:text-gold-bright hover:underline">
            {l.label}
          </a>
        </li>
      ))}
    </ul>
  );
}
