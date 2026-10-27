"use client";

import Image from "next/image";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { limanBrand, limanMenu, type Dish } from "@/content/limanMenu";

/** Logical screen size of the phone the menu is designed for. */
export const SCREEN = { width: 390, height: 836 } as const;

/** Height of the fixed chrome (status bar + brand row + category tabs). */
const CHROME = 145;
/** Where the Mains header sits under the chrome when the menu first appears. */
const MAINS_Y = 159;
/** Where the Mains header sits on the printed page (top of the phone screen). */
const PRINT_Y = 8;

export type DigitalMenuHandle = {
  /**
   * Colours: 0 = printed page (paper colours), 1 = finished dark digital menu.
   * Chrome (status bar, brand row, categories) follows the colours unless given.
   */
  setMorph: (m: number, chrome?: number) => void;
  /** Layout: 0 = Mains where it sits on the printed page, 1 = Mains under the digital chrome. */
  setLayout: (l: number) => void;
  setInteractive: (on: boolean) => void;
};

export type Rgb = [number, number, number];
export const mix = (a: Rgb, b: Rgb, t: number) => `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(" ")})`;
const mixA = (a: Rgb, aa: number, b: Rgb, ba: number, t: number) =>
  `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(" ")} / ${aa + (ba - aa) * t})`;

// paper values match the printed page as rendered; dark values are the finished menu
const THEME = {
  bg: [[211, 197, 182], [12, 11, 10]] as [Rgb, Rgb],
  ink: [[40, 34, 28], [242, 235, 224]] as [Rgb, Rgb],
  muted: [[104, 96, 88], [156, 149, 140]] as [Rgb, Rgb],
  head: [[48, 42, 36], [214, 194, 155]] as [Rgb, Rgb],
  price: [[40, 34, 28], [227, 197, 143]] as [Rgb, Rgb],
};

/** Surface colour: printed paper, then the finished menu's black. */
export const MENU_BG = THEME.bg;

/**
 * LIMAN's digital menu: real, scrollable HTML at phone size. Its "Mains"
 * section is laid out exactly like the printed MAINS column so the printed
 * page can hand over to it without a visible jump.
 */
export const DigitalMenu = forwardRef<DigitalMenuHandle>(function DigitalMenu(_, ref) {
  const root = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const chrome = useRef<HTMLDivElement>(null);
  const tabs = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState("mains");
  const [interactive, setInteractiveState] = useState(false);
  const target = useRef<string | null>(null);
  const targetTop = useRef(0);

  /** Section position in scroll coordinates (the content wrapper is the offset parent). */
  const sectionTop = useCallback((id: string) => {
    const el = content.current?.querySelector<HTMLElement>(`[data-section="${id}"]`);
    return el ? CHROME + el.offsetTop : 0;
  }, []);

  // initial position: the Mains section under the chrome, as on the printed page
  const home = useCallback(() => {
    const s = scroller.current;
    if (s) s.scrollTop = sectionTop("mains") - MAINS_Y;
  }, [sectionTop]);

  // back to the printed position whenever the visitor scrolls the story backwards
  useEffect(() => {
    if (interactive) return;
    home();
    const id = requestAnimationFrame(home);
    return () => cancelAnimationFrame(id);
  }, [home, interactive]);

  useImperativeHandle(
    ref,
    () => ({
      setMorph(m, chromeIn) {
        const r = root.current;
        if (!r) return;
        r.style.setProperty("--menu-bg", mix(...THEME.bg, m));
        r.style.setProperty("--menu-ink", mix(...THEME.ink, m));
        r.style.setProperty("--menu-muted", mix(...THEME.muted, m));
        r.style.setProperty("--menu-head", mix(...THEME.head, m));
        r.style.setProperty("--menu-price", mix(...THEME.price, m));
        r.style.setProperty("--menu-rule", mixA(THEME.muted[0], 0.3, THEME.ink[1], 0.14, m));
        if (chrome.current) {
          const c = chromeIn ?? Math.min(1, Math.max(0, (m - 0.3) / 0.4));
          chrome.current.style.opacity = String(c);
          chrome.current.style.transform = `translateY(${-10 * (1 - c)}px)`;
        }
        // everything that is not on the printed column appears once the chrome is solid, so it never shows through it
        const solid = chromeIn ?? Math.min(1, Math.max(0, (m - 0.3) / 0.4));
        r.style.setProperty("--menu-extra", String(Math.min(1, Math.max(0, (solid - 0.6) / 0.4))));
      },
      setLayout(l) {
        // until the visitor can use it, the menu stays anchored on the printed MAINS column
        if (root.current?.inert) home();
        if (content.current) content.current.style.transform = `translateY(${-(MAINS_Y - PRINT_Y) * (1 - l)}px)`;
      },
      setInteractive(on) {
        setInteractiveState(on);
      },
    }),
    [home],
  );

  const onScroll = () => {
    const s = scroller.current;
    if (!s) return;
    let current = limanMenu[0].id;
    for (const c of limanMenu) if (sectionTop(c.id) - CHROME - 24 <= s.scrollTop) current = c.id;
    // the last sections can't reach the top: at the bottom, the last one is active
    if (s.scrollTop + s.clientHeight >= s.scrollHeight - 2) current = limanMenu[limanMenu.length - 1].id;
    if (target.current) {
      // while a tapped tab scrolls its section into view, keep that tab selected
      if (current === target.current || Math.abs(s.scrollTop - targetTop.current) < 4) target.current = null;
      else return;
    }
    setActive((a) => (a === current ? a : current));
  };

  // keep the active tab in view
  useEffect(() => {
    const t = tabs.current?.querySelector<HTMLElement>(`[data-tab="${active}"]`);
    const row = tabs.current;
    if (t && row) row.scrollTo({ left: t.offsetLeft - 28, behavior: "smooth" });
  }, [active]);

  const go = (id: string) => {
    const s = scroller.current;
    if (!s) return;
    const top = Math.min(sectionTop(id) - CHROME - 14, s.scrollHeight - s.clientHeight);
    target.current = id;
    targetTop.current = top;
    setActive(id);
    s.scrollTo({ top, behavior: "smooth" });
  };

  return (
    <div
      ref={root}
      className="digital-menu relative overflow-hidden"
      style={
        {
          width: SCREEN.width,
          height: SCREEN.height,
          // a host can paint the surface itself (the lifted paper page) by setting --menu-surface
          background: "var(--menu-surface, var(--menu-bg))",
          color: "var(--menu-ink)",
          "--menu-extra": 0,
        } as React.CSSProperties
      }
      aria-hidden={!interactive}
      inert={!interactive}
    >
      {/* fixed chrome: status bar, brand, sticky categories */}
      <div ref={chrome} className="absolute inset-x-0 top-0 z-10 opacity-0" style={{ height: CHROME }}>
        <div className="absolute inset-0 bg-[rgb(12_11_10/0.88)] backdrop-blur-md" />
        <div className="relative flex h-[47px] items-center justify-between px-8 pt-1 text-[15px] font-semibold text-[#f2ebe0]">
          <span>9:41</span>
          <span className="flex items-center gap-1.5" aria-hidden="true">
            <svg width="18" height="11" viewBox="0 0 18 11" fill="currentColor"><rect x="0" y="7" width="3" height="4" rx="1" /><rect x="5" y="5" width="3" height="6" rx="1" /><rect x="10" y="2.5" width="3" height="8.5" rx="1" /><rect x="15" y="0" width="3" height="11" rx="1" /></svg>
            <svg width="16" height="11" viewBox="0 0 16 11" fill="currentColor"><path d="M8 2.2c2.3 0 4.4.9 6 2.4l1.2-1.3A10.2 10.2 0 0 0 8 .4C5.3.4 2.8 1.4.8 3.3L2 4.6a8.4 8.4 0 0 1 6-2.4Zm0 3.4c1.4 0 2.6.5 3.6 1.4l1.2-1.3A7 7 0 0 0 8 3.8 7 7 0 0 0 3.2 5.7l1.2 1.3c1-.9 2.2-1.4 3.6-1.4Zm0 3.3c-.6 0-1.1.2-1.5.6L8 11l1.5-1.5c-.4-.4-.9-.6-1.5-.6Z" /></svg>
            <svg width="26" height="12" viewBox="0 0 26 12" fill="none"><rect x="0.5" y="0.5" width="22" height="11" rx="3.5" stroke="currentColor" opacity="0.4" /><rect x="2" y="2" width="17" height="8" rx="2" fill="currentColor" /><rect x="24" y="4" width="1.5" height="4" rx="0.75" fill="currentColor" opacity="0.4" /></svg>
          </span>
        </div>
        <div className="relative flex h-[44px] items-center justify-center">
          <span className="font-[family-name:var(--font-cormorant)] text-[19px] font-semibold tracking-[0.42em] text-[#f2ebe0]">
            {limanBrand.name}
          </span>
        </div>
        <div
          ref={tabs}
          role="tablist"
          aria-label="Menu categories"
          className="relative flex h-[54px] items-center gap-2 overflow-x-auto px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {limanMenu.map((c) => {
            const on = c.id === active;
            return (
              <button
                key={c.id}
                type="button"
                role="tab"
                aria-selected={on}
                data-tab={c.id}
                onClick={() => go(c.id)}
                className={`shrink-0 rounded-full px-4 py-[7px] text-[13px] font-medium tracking-[0.02em] transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e3c58f] ${
                  on ? "bg-[#e3c58f] text-[#14120f]" : "bg-white/[0.06] text-[#cfc6ba] hover:bg-white/[0.12]"
                }`}
              >
                {c.label}
              </button>
            );
          })}
        </div>
        <div className="absolute inset-x-0 bottom-0 h-px bg-white/[0.08]" />
      </div>

      <div
        ref={scroller}
        onScroll={onScroll}
        className="absolute inset-0 overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ paddingTop: CHROME }}
      >
        <div ref={content} className="relative will-change-transform">
          <header className="px-8 pt-7 pb-10" style={{ opacity: "var(--menu-extra)" }}>
            <p className="font-[family-name:var(--font-cormorant)] text-[46px] leading-none font-semibold tracking-[0.3em]" style={{ color: "var(--menu-ink)" }}>
              {limanBrand.name}
            </p>
            <p className="mt-3 text-[12px] font-medium tracking-[0.32em] uppercase" style={{ color: "var(--menu-head)" }}>
              {limanBrand.tagline}
            </p>
            <p className="mt-4 text-[14px] leading-[1.5]" style={{ color: "var(--menu-muted)" }}>
              {limanBrand.note}. Today&apos;s menu, updated by the kitchen.
            </p>
          </header>

          {limanMenu.map((c) => (
            <section key={c.id} data-section={c.id} aria-label={c.title} className="pb-14" style={c.id === "mains" ? undefined : { opacity: "var(--menu-extra)" }}>
              <h3
                className={`font-[family-name:var(--font-cormorant)] text-[24px] leading-[24px] font-semibold tracking-[0.28em] uppercase ${c.id === "mains" ? "text-center" : "px-8"}`}
                style={{ color: "var(--menu-head)" }}
              >
                {c.title}
              </h3>
              <div className="mx-8 mt-[29px] mr-[30px] h-px" style={{ background: "var(--menu-rule)" }} />
              <div className="mt-[32px]">
                {c.dishes.map((d, i) => (d.photo ? <FeaturedDish key={d.name} dish={d} first={i === 0} /> : <DishRow key={d.name} dish={d} />))}
              </div>
            </section>
          ))}

          <footer className="px-8 pt-2 pb-16 text-[12px] leading-[1.6]" style={{ color: "var(--menu-muted)", opacity: "var(--menu-extra)" }}>
            Please let us know about any allergies. Prices include VAT.
            <br />
            Menu by MenuFlex
          </footer>
        </div>
      </div>
    </div>
  );
});

/** Large photograph card; sizes and offsets mirror the printed MAINS column. */
function FeaturedDish({ dish, first }: { dish: Dish; first: boolean }) {
  const photo = dish.photo!;
  const height = Math.round((328 * photo.height) / photo.width);
  return (
    <article className={first ? "" : "mt-[52px]"}>
      <div className="relative mr-[30px] ml-8 overflow-hidden" style={{ height }}>
        <Image src={photo.src} alt={dish.name} fill sizes="(min-width: 1024px) 330px, 80vw" className="object-cover" />
      </div>
      <div className="mt-[17px] mr-[30px] ml-8 flex items-baseline justify-between gap-4">
        <h4 className="text-[23px] leading-[24px] font-semibold tracking-[-0.01em]" style={{ color: "var(--menu-ink)" }}>
          {dish.name}
        </h4>
        <span className="text-[20px] font-semibold tabular-nums" style={{ color: "var(--menu-price)" }}>
          {dish.price}
        </span>
      </div>
      <p className="mt-[10px] mr-[30px] ml-8 text-[16px] leading-[17px]" style={{ color: "var(--menu-muted)" }}>
        {dish.description}
      </p>
    </article>
  );
}

function DishRow({ dish }: { dish: Dish }) {
  return (
    <article className="mr-[30px] ml-8 border-b py-4 first:pt-0" style={{ borderColor: "var(--menu-rule)" }}>
      <div className="flex items-baseline justify-between gap-4">
        <h4 className="text-[17px] leading-[22px] font-semibold" style={{ color: "var(--menu-ink)" }}>
          {dish.name}
        </h4>
        <span className="text-[16px] font-semibold tabular-nums" style={{ color: "var(--menu-price)" }}>
          {dish.price}
        </span>
      </div>
      <p className="mt-1 text-[14px] leading-[20px]" style={{ color: "var(--menu-muted)" }}>
        {dish.description}
      </p>
    </article>
  );
}
