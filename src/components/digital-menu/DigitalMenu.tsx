"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { limanBrand, limanMenu, type Dish } from "@/content/limanMenu";

/** Height of the sticky chrome (brand row + category tabs). */
const CHROME = 98;

/**
 * LIMAN's digital menu, as a guest sees it after scanning the table's QR
 * code: a sticky brand bar with category tabs over one scrolling page.
 */
export function DigitalMenu({ badge, backHref, backLabel }: { badge: string; backHref: string; backLabel: string }) {
  const content = useRef<HTMLDivElement>(null);
  const tabs = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(limanMenu[0].id);
  const target = useRef<string | null>(null);
  const targetTop = useRef(0);

  /** Section position in page coordinates. */
  const sectionTop = useCallback((id: string) => {
    const el = content.current?.querySelector<HTMLElement>(`[data-section="${id}"]`);
    return el ? el.getBoundingClientRect().top + window.scrollY : 0;
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      let current = limanMenu[0].id;
      for (const c of limanMenu) if (sectionTop(c.id) - CHROME - 24 <= y) current = c.id;
      // the last sections can't reach the top: at the bottom, the last one is active
      if (y + window.innerHeight >= document.documentElement.scrollHeight - 2) current = limanMenu[limanMenu.length - 1].id;
      if (target.current) {
        // while a tapped tab scrolls its section into view, keep that tab selected
        if (current === target.current || Math.abs(y - targetTop.current) < 4) target.current = null;
        else return;
      }
      setActive((a) => (a === current ? a : current));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [sectionTop]);

  // keep the active tab in view
  useEffect(() => {
    const t = tabs.current?.querySelector<HTMLElement>(`[data-tab="${active}"]`);
    const row = tabs.current;
    if (t && row) row.scrollTo({ left: t.offsetLeft - 28, behavior: "smooth" });
  }, [active]);

  const go = (id: string) => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const top = Math.min(sectionTop(id) - CHROME - 14, max);
    target.current = id;
    targetTop.current = top;
    setActive(id);
    window.scrollTo({ top, behavior: "smooth" });
  };

  return (
    <div className="mx-auto min-h-dvh max-w-[480px] bg-[#0c0b0a] text-[#f2ebe0] shadow-[0_0_80px_rgba(0,0,0,0.6)]">
      {/* demo notice, scrolls away */}
      <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-6 py-2.5 text-[12px]">
        <span className="rounded-full border border-[#e3c58f]/50 px-2.5 py-0.5 font-semibold tracking-[0.14em] text-[#e3c58f] uppercase">{badge}</span>
        <Link href={backHref} className="text-[#9c958c] transition-colors hover:text-[#f2ebe0]">
          {backLabel}
        </Link>
      </div>

      {/* sticky chrome: brand and categories */}
      <div className="sticky top-0 z-10" style={{ height: CHROME }}>
        <div className="absolute inset-0 bg-[rgb(12_11_10/0.9)] backdrop-blur-md" />
        <div className="relative flex h-[44px] items-center justify-center">
          <span className="font-display text-[19px] font-semibold tracking-[0.42em] text-[#f2ebe0]">{limanBrand.name}</span>
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

      <div ref={content}>
        <header className="px-8 pt-7 pb-10">
          <h1 className="font-display text-[46px] leading-none font-semibold tracking-[0.3em]">{limanBrand.name}</h1>
          <p className="mt-3 text-[12px] font-medium tracking-[0.32em] text-[#d6c29b] uppercase">{limanBrand.tagline}</p>
          <p className="mt-4 text-[14px] leading-[1.5] text-[#9c958c]">{limanBrand.note}. Today&apos;s menu, updated by the kitchen.</p>
        </header>

        {limanMenu.map((c) => (
          <section key={c.id} data-section={c.id} aria-label={c.title} className="pb-14">
            <h2 className={`font-display text-[24px] leading-[24px] font-semibold tracking-[0.28em] text-[#d6c29b] uppercase ${c.id === "mains" ? "text-center" : "px-8"}`}>
              {c.title}
            </h2>
            <div className="mx-8 mt-[29px] h-px bg-[rgb(242_235_224/0.14)]" />
            <div className="mt-[32px]">
              {c.dishes.map((d, i) => (d.photo ? <FeaturedDish key={d.name} dish={d} first={i === 0} /> : <DishRow key={d.name} dish={d} />))}
            </div>
          </section>
        ))}

        <footer className="px-8 pt-2 pb-16 text-[12px] leading-[1.6] text-[#9c958c]">
          Please let us know about any allergies. Prices include VAT.
          <br />
          Menu by MenuFlex
        </footer>
      </div>
    </div>
  );
}

/** Large photograph card. */
function FeaturedDish({ dish, first }: { dish: Dish; first: boolean }) {
  const photo = dish.photo!;
  return (
    <article className={`mx-8 ${first ? "" : "mt-[52px]"}`}>
      <div className="relative overflow-hidden" style={{ aspectRatio: `${photo.width} / ${photo.height}` }}>
        <Image src={photo.src} alt={dish.name} fill sizes="(min-width: 480px) 420px, 90vw" className="object-cover" />
      </div>
      <div className="mt-[17px] flex items-baseline justify-between gap-4">
        <h3 className="text-[23px] leading-[24px] font-semibold tracking-[-0.01em]">{dish.name}</h3>
        <span className="text-[20px] font-semibold text-[#e3c58f] tabular-nums">{dish.price}</span>
      </div>
      <p className="mt-[10px] text-[16px] leading-[1.35] text-[#9c958c]">{dish.description}</p>
    </article>
  );
}

function DishRow({ dish }: { dish: Dish }) {
  return (
    <article className="mx-8 border-b border-[rgb(242_235_224/0.14)] py-4 first:pt-0">
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="text-[17px] leading-[22px] font-semibold">{dish.name}</h3>
        <span className="text-[16px] font-semibold text-[#e3c58f] tabular-nums">{dish.price}</span>
      </div>
      <p className="mt-1 text-[14px] leading-[20px] text-[#9c958c]">{dish.description}</p>
    </article>
  );
}
