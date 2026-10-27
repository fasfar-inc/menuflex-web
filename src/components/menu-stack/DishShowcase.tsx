"use client";

import Image from "next/image";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Wordmark } from "@/components/brand/BrandLogo";
import type { CategoryIcon as CategoryIconName, Dish, MenuLocale } from "@/content/menus/types";
import { Price } from "./Price";
import { CategoryIcon } from "./icons";
import { menuStrings } from "./strings";

/** One change of dish, start to finish. Inputs are ignored until it has played out. */
export const MOTION_MS = 460;
export const REDUCED_MS = 200;

/** Swipe thresholds: a deliberate pull, or a short quick flick. */
const SWIPE_MIN = 48; // px, or 8% of the stage's height if larger
const FLICK_MIN = 28; // px
const FLICK_SPEED = 0.45; // px per ms, over the swipe's last 100 ms
/** A wheel or trackpad gesture is over after this long without events. */
const WHEEL_QUIET = 240;
const WHEEL_MIN = 50;

/** Distance around a loop of n dishes: forwards (positive) or back, whichever is shorter. */
function loop(x: number, n: number) {
  const d = ((x % n) + n) % n;
  return d > n / 2 ? d - n : d;
}

/**
 * A category's dishes, one at a time: the selected dish's photograph large on
 * the right, its name, description and price over the left, and every dish
 * of the category as a thumbnail underneath. One swipe, one wheel gesture,
 * one key press or a tap on a thumbnail moves to exactly one dish; `go`
 * holds the lock that keeps changes from overlapping.
 */
export function DishShowcase({
  dishes,
  index,
  go,
  locale,
  icon,
  categoryLabel,
  reduced,
}: {
  dishes: Dish[];
  index: number;
  /** Ask for a dish; returns false while a change is still playing. */
  go: (i: number) => boolean;
  locale: MenuLocale;
  icon: CategoryIconName;
  categoryLabel: string;
  reduced: boolean;
}) {
  const s = menuStrings[locale];
  const n = dishes.length;
  const stage = useRef<HTMLDivElement>(null);
  const strip = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const indexRef = useRef(index);
  indexRef.current = index;

  useLayoutEffect(() => {
    const el = stage.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    setSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  // the dish on its way out, kept while it fades, and which way the change went
  const [leaving, setLeaving] = useState<{ i: number; dir: number } | null>(null);
  const [dir, setDir] = useState(1);
  const last = useRef(index);
  useEffect(() => {
    if (last.current === index) return;
    const d = Math.sign(loop(index - last.current, n)) || 1;
    setDir(d);
    if (!reduced) setLeaving({ i: last.current, dir: d });
    last.current = index;
    const t = window.setTimeout(() => setLeaving(null), MOTION_MS);
    return () => window.clearTimeout(t);
  }, [index, n, reduced]);

  // keep the selected thumbnail in view
  useEffect(() => {
    const el = strip.current?.querySelector<HTMLElement>(`[data-dish="${index}"]`);
    el?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: reduced ? "auto" : "smooth" });
  }, [index, reduced]);

  const step = useCallback((dir: 1 | -1) => n > 1 && go((indexRef.current + dir + n) % n), [go, n]);

  // mouse wheel and trackpads: exactly one dish per gesture, however long its momentum lasts
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    let acc = 0;
    let used = false;
    let quiet: number | undefined;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      e.preventDefault();
      window.clearTimeout(quiet);
      quiet = window.setTimeout(() => {
        used = false;
        acc = 0;
      }, WHEEL_QUIET);
      if (used) return;
      acc += e.deltaMode === 1 ? e.deltaY * 32 : e.deltaMode === 2 ? e.deltaY * 400 : e.deltaY;
      if (Math.abs(acc) >= WHEEL_MIN) {
        used = true;
        step(acc > 0 ? 1 : -1);
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
      window.clearTimeout(quiet);
    };
  }, [step]);

  // keyboard: anywhere on the page unless typing or inside another control
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target instanceof Element ? e.target : null;
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || document.querySelector('[aria-modal="true"]')) return;
      if (t?.closest("input, textarea, select, [role=dialog], [role=menu]")) return;
      const key = e.key;
      // the category bar keeps Left/Right, Home/End and Space for itself; Up/Down still change dishes
      if (t?.closest("[role=tablist]") && !["ArrowDown", "ArrowUp", "PageDown", "PageUp"].includes(key)) return;
      if (key === "ArrowDown" || key === "PageDown" || (key === " " && !e.shiftKey && !t?.closest("button"))) step(1);
      else if (key === "ArrowUp" || key === "PageUp" || (key === " " && e.shiftKey)) step(-1);
      else if (key === "Home") go(0);
      else if (key === "End") go(n - 1);
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step, go, n]);

  // touch and pen: one dish per swipe, decided once the swipe is clearly vertical and long enough
  const gesture = useRef<{ id: number; x: number; y: number; trail: [number, number][]; used: boolean; moved: boolean } | null>(null);
  const onPointerDown = (e: React.PointerEvent) => {
    // the thumbnail strip scrolls sideways on its own
    if (e.pointerType === "mouse" || !e.isPrimary || (e.target instanceof Element && e.target.closest("[data-strip]"))) return;
    gesture.current = { id: e.pointerId, x: e.clientX, y: e.clientY, trail: [[performance.now(), e.clientY]], used: false, moved: false };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const gs = gesture.current;
    if (!gs || gs.id !== e.pointerId || gs.used) return;
    const now = performance.now();
    gs.trail.push([now, e.clientY]);
    while (gs.trail.length > 2 && now - gs.trail[0][0] > 100) gs.trail.shift();
    const dy = e.clientY - gs.y;
    const dx = e.clientX - gs.x;
    if (Math.abs(dy) > 8 || Math.abs(dx) > 8) gs.moved = true;
    if (Math.abs(dy) >= Math.max(SWIPE_MIN, size.h * 0.08) && Math.abs(dy) > Math.abs(dx) * 1.4) {
      gs.used = true; // the rest of this swipe does nothing
      step(dy < 0 ? 1 : -1);
    }
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const gs = gesture.current;
    if (!gs || gs.id !== e.pointerId) return;
    if (!gs.used) {
      const dy = e.clientY - gs.y;
      const dx = e.clientX - gs.x;
      const [t0, y0] = gs.trail[0];
      const vy = (e.clientY - y0) / Math.max(16, performance.now() - t0);
      if (Math.abs(dy) >= FLICK_MIN && Math.abs(vy) >= FLICK_SPEED && Math.abs(dy) > Math.abs(dx) * 1.4) {
        gs.used = true;
        step(dy < 0 ? 1 : -1);
      }
    }
    // keep the record until the click that may follow, so a swipe is never also a tap
    window.setTimeout(() => {
      if (gesture.current === gs) gesture.current = null;
    }, 0);
  };
  const onPointerCancel = () => {
    gesture.current = null;
  };

  // layout: the photograph and details on top, thumbnails, then the swipe hint where there is room
  const roomy = size.h >= 560;
  const hintH = size.h >= 600 ? 52 : 0;
  const thumbW = Math.round(Math.min(124, Math.max(68, (size.w - 48) / 3.7), size.h * 0.17));
  const stripH = thumbW + 20;
  const heroH = Math.max(200, size.h - stripH - hintH);
  const photoW = Math.min(size.w * 0.96, heroH * 0.96);
  const active = dishes[index];

  return (
    <div
      ref={stage}
      role="region"
      aria-roledescription="carousel"
      aria-label={categoryLabel}
      className="relative h-full w-full touch-none overflow-hidden select-none [-webkit-tap-highlight-color:transparent] [-webkit-touch-callout:none]"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      {size.w > 0 && active && (
        <>
          {/* the selected dish */}
          <div className="absolute inset-x-0 top-0 overflow-hidden" style={{ height: heroH }}>
            {/* MenuFlex, large and soft, behind the photograph */}
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <Wordmark className="text-[min(36vw,220px)] text-gold-bright opacity-[0.22] blur-[5px]" />
            </div>

            {leaving && leaving.i !== index && dishes[leaving.i] && (
              <Hero key={`out-${dishes[leaving.i].id}`} dish={dishes[leaving.i]} icon={icon} w={photoW} h={heroH} className="show-out" dir={leaving.dir} />
            )}
            <Hero key={active.id} dish={active} icon={icon} w={photoW} h={heroH} className={reduced ? "" : "show-in"} dir={dir} priority />

            {/* keeps the words readable over the photograph */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(11,9,7,0.82)_0%,rgba(11,9,7,0.5)_38%,rgba(11,9,7,0)_66%)]"
            />

            <div key={`text-${active.id}`} className={`absolute top-1/2 left-6 w-[54%] -translate-y-1/2 ${reduced ? "" : "dish-info-in"}`}>
              <p className={`font-medium tracking-[0.38em] text-[#d9a55a] uppercase ${roomy ? "text-[11px]" : "text-[10px]"}`}>{categoryLabel}</p>
              <span aria-hidden="true" className={`block h-px w-10 bg-[#d9a55a]/80 ${roomy ? "my-4" : "my-2.5"}`} />
              <h2
                className={`line-clamp-3 font-serif leading-[0.98] tracking-[-0.015em] text-cream [text-shadow:0_2px_18px_rgba(0,0,0,0.6)] ${roomy ? "text-[clamp(34px,10.6vw,46px)]" : "text-[clamp(26px,8vw,32px)]"}`}
              >
                {active.name[locale]}
              </h2>
              <p
                className={`font-light text-cream-soft [text-shadow:0_1px_10px_rgba(0,0,0,0.7)] ${roomy ? "mt-4 line-clamp-4 text-[15px] leading-[1.45]" : "mt-2 line-clamp-2 text-[13.5px] leading-[1.4]"}`}
              >
                {active.description[locale]}
              </p>
              <Price
                value={active.price}
                className={`mt-4 inline-block bg-[linear-gradient(180deg,#f6dcab_0%,#d9a55a_100%)] bg-clip-text font-serif leading-none text-transparent ${roomy ? "text-[clamp(30px,9vw,38px)]" : "mt-3 text-[26px]"}`}
              />
            </div>

            {/* where this dish sits in the category */}
            <div
              aria-hidden="true"
              className="absolute right-6 bottom-3 flex w-[min(46%,calc(var(--n)*42px))] flex-col items-start gap-2"
              style={{ ["--n" as string]: n }}
            >
              <span className="text-[13px] tracking-[0.12em] text-cream tabular-nums">
                {index + 1} / {n}
              </span>
              <span className="flex w-full gap-2">
                {dishes.map((d, i) => (
                  <span key={d.id} className={`h-[2px] flex-1 rounded-full transition-colors duration-300 ${i === index ? "bg-[#f0c47d]" : "bg-cream/25"}`} />
                ))}
              </span>
            </div>
          </div>

          {/* every dish of the category */}
          <div
            ref={strip}
            data-strip
            className="absolute inset-x-0 flex touch-pan-x gap-3 overflow-x-auto px-6 py-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            style={{ top: heroH, height: stripH }}
          >
            {dishes.map((d, i) => (
              <button
                key={d.id}
                type="button"
                data-dish={i}
                tabIndex={-1}
                aria-label={d.name[locale]}
                aria-current={i === index ? "true" : undefined}
                onClick={() => i !== index && go(i)}
                className={`relative shrink-0 overflow-hidden rounded-[14px] border transition-[border-color,box-shadow] duration-300 ${
                  i === index
                    ? "border-[#e8b86a] shadow-[0_0_0_1px_rgba(232,184,106,0.5),0_0_22px_rgba(214,150,70,0.45)]"
                    : "border-cream/20 shadow-[0_10px_24px_-12px_rgba(0,0,0,0.9)]"
                }`}
                style={{ width: thumbW, height: thumbW }}
              >
                <Photo dish={d} icon={icon} sizes="130px" />
              </button>
            ))}
          </div>

          {hintH > 0 && (
            <p
              aria-hidden="true"
              className="absolute inset-x-0 bottom-0 flex flex-col items-center justify-center gap-1.5 text-[10.5px] tracking-[0.34em] text-cream-soft uppercase"
              style={{ height: hintH }}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 text-[#d9a55a]" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="m6 9 6 6 6-6" />
              </svg>
              <span className="flex items-center gap-3">
                <span className="h-px w-7 bg-cream/40" />
                {s.hint}
                <span className="h-px w-7 bg-cream/40" />
              </span>
            </p>
          )}
        </>
      )}
      <p aria-live="polite" className="sr-only">
        {active ? `${active.name[locale]}, ${active.price}. ${s.position(index + 1, n)}` : ""}
      </p>
    </div>
  );
}

/** The selected dish's photograph, large at the right, fading into the dark at its edges. */
function Hero({
  dish,
  icon,
  w,
  h,
  className,
  dir,
  priority,
}: {
  dish: Dish;
  icon: CategoryIconName;
  w: number;
  h: number;
  className: string;
  dir: number;
  priority?: boolean;
}) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute ${className}`}
      style={{
        right: -w * 0.12,
        top: (h - w) / 2,
        width: w,
        height: w,
        ["--dy" as string]: `${dir * 28}px`,
        maskImage: "radial-gradient(closest-side, #000 72%, transparent 100%)",
        WebkitMaskImage: "radial-gradient(closest-side, #000 72%, transparent 100%)",
      }}
    >
      <Photo dish={dish} icon={icon} sizes="(max-width: 600px) 92vw, 560px" priority={priority} large />
    </div>
  );
}

/** A dish's photograph, or its category emblem on bronze when there is none. */
function Photo({ dish, icon, sizes, priority, large }: { dish: Dish; icon: CategoryIconName; sizes: string; priority?: boolean; large?: boolean }) {
  return dish.photo ? (
    <Image
      src={dish.photo.src}
      alt=""
      fill
      priority={priority}
      sizes={sizes}
      className="object-cover"
      style={{ objectPosition: dish.photo.position ?? "50% 55%" }}
      draggable={false}
    />
  ) : (
    <span className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(60%_60%_at_55%_50%,rgba(222,160,80,0.34)_0%,rgba(222,160,80,0)_72%),linear-gradient(165deg,#3a2c1e_0%,#1d1610_60%,#120e0a_100%)] text-gold-bright/80">
      <CategoryIcon name={icon} className={large ? "ml-[12%] h-[34%] w-[34%] stroke-[0.7]" : "h-[40%] w-[40%] stroke-[0.9]"} />
    </span>
  );
}
