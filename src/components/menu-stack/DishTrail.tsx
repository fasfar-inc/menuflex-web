"use client";

import Image from "next/image";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Wordmark } from "@/components/brand/BrandLogo";
import type { CategoryIcon as CategoryIconName, Dish, MenuLocale } from "@/content/menus/types";
import { Price } from "./Price";
import { CategoryIcon } from "./icons";
import { PhotoViewer } from "./PhotoViewer";
import { menuStrings } from "./strings";


/** One step along the trail, start to finish. Inputs are ignored until it has played out. */
export const MOTION_MS = 460;
export const REDUCED_MS = 200;

/** Swipe thresholds: a deliberate pull, or a short quick flick. */
const SWIPE_MIN = 48; // px, or 8% of the stage's height if larger
const FLICK_MIN = 28; // px
const FLICK_SPEED = 0.45; // px per ms, over the swipe's last 100 ms
/** A wheel or trackpad gesture is over after this long without events. */
const WHEEL_QUIET = 240;
const WHEEL_MIN = 50;

/** Height of the dish details under the trail, roomy and compact. */
const INFO_H = 176;
const INFO_H_SHORT = 132;
/** How much larger the selected dish is than the others. */
const BIG_SCALE = 1.4;

/**
 * A category's dishes as round photographs along a winding gold trail: left,
 * right, left, from a sprout at the top. The trail stays put; the selected
 * dish grows with a gold ring, the line is brighter up to it, and its name,
 * description and price sit under the trail. One swipe, one wheel gesture or
 * one key press moves the highlight exactly one dish; a tap on another dish
 * goes to it, and a tap on the selected one opens its photograph whole. `go`
 * holds the lock that keeps changes from overlapping.
 */
export function DishTrail({
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
  const [size, setSize] = useState({ w: 0, h: 0 });
  const indexRef = useRef(index);
  indexRef.current = index;
  // the dish shown whole, full screen
  const [viewing, setViewing] = useState<Dish | null>(null);

  useLayoutEffect(() => {
    const el = stage.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    setSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  // after the last dish the first comes round again
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
    if (e.pointerType === "mouse" || !e.isPrimary) return;
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

  // layout: the trail zigzags between two columns above the details
  const w = Math.min(size.w, 520);
  const ox = (size.w - w) / 2;
  const roomy = size.h >= 560;
  const infoH = roomy ? INFO_H : INFO_H_SHORT;
  const top = 34; // room for the sprout
  const area = Math.max(160, size.h - infoH - top - 8);
  const row = Math.min(area / n, 150);
  const y0 = top + (area - row * n) / 2 + row / 2;
  // two rows apart in the same column, so a dish never meets the one below its neighbour
  const small = Math.min(w * 0.3, row * 1.62, 128);
  const big = Math.min(small * BIG_SCALE, w * 0.42, row * 3.7 - small);
  const colX = (i: number) => ox + (i % 2 === 0 ? 18 + big / 2 : w - 18 - big / 2);
  const at = (i: number) => ({ x: colX(i), y: y0 + i * row, d: i === index ? big : small });

  // the gold line: from the sprout above the first dish, through every dish
  const sprout = { x: colX(0) - big * 0.34, y: Math.max(30, y0 - Math.min(row * 0.9, 70)) };
  const points = [sprout, ...dishes.map((_, i) => at(i))];
  const curve = (to: number) => {
    let d = `M${points[0].x},${points[0].y}`;
    for (let k = 1; k <= to; k++) {
      const p = points[k - 1];
      const q = points[k];
      const h = (q.y - p.y) * 0.6;
      d += ` C${p.x},${p.y + h} ${q.x},${q.y - h} ${q.x},${q.y}`;
    }
    return d;
  };
  const active = dishes[index];
  const ease = reduced ? undefined : `width ${MOTION_MS}ms cubic-bezier(0.22,0.61,0.36,1), height ${MOTION_MS}ms cubic-bezier(0.22,0.61,0.36,1), left ${MOTION_MS}ms cubic-bezier(0.22,0.61,0.36,1), top ${MOTION_MS}ms cubic-bezier(0.22,0.61,0.36,1)`;

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
          {/* MenuFlex, large and soft, behind the trail */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-center" style={{ height: size.h - infoH }}>
            <Wordmark className="text-[min(36vw,220px)] text-gold-bright opacity-[0.2] blur-[5px]" />
          </div>

          <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" fill="none">
            <path d={curve(n)} stroke="rgba(236,196,132,0.3)" strokeWidth="1.5" strokeLinecap="round" />
            {/* the way to the selected dish, brighter */}
            <path d={curve(index + 1)} stroke="rgba(240,196,125,0.85)" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <Sprout className="pointer-events-none absolute h-9 w-9 text-[#e8b86a]" style={{ left: sprout.x - 30, top: sprout.y - 32 }} />

          {dishes.map((dish, i) => {
            const p = at(i);
            const selected = i === index;
            return (
              <button
                key={dish.id}
                type="button"
                tabIndex={selected && dish.photo ? 0 : -1}
                aria-label={selected && dish.photo ? `${s.viewPhoto}: ${dish.name[locale]}` : dish.name[locale]}
                aria-current={selected ? "true" : undefined}
                onClick={() => {
                  if (gesture.current?.used) return;
                  // the selected dish opens its photograph; any other one becomes the selected one
                  if (!selected) go(i);
                  else if (dish.photo) setViewing(dish);
                }}
                className="absolute rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
                style={{ width: p.d, height: p.d, left: p.x - p.d / 2, top: p.y - p.d / 2, zIndex: selected ? 20 : 10, transition: ease }}
              >
                <Plate dish={dish} icon={icon} selected={selected} priority={i < 3} dim={!selected} />
              </button>
            );
          })}

          {/* the selected dish's details */}
          <div className="absolute inset-x-0 bottom-0 flex flex-col justify-end px-6 pb-2" style={{ height: infoH }}>
            <div key={active.id} className={reduced ? "" : "dish-info-in"}>
              <p className="flex items-center gap-3 text-[10.5px] font-medium tracking-[0.32em] text-[#d9a55a] uppercase">
                {categoryLabel}
                <span aria-hidden="true" className="h-px w-8 bg-[#d9a55a]/70" />
              </p>
              <h2
                className={`mt-2 min-w-0 font-serif leading-[1.05] tracking-[-0.01em] text-cream ${roomy ? "line-clamp-2 text-[clamp(26px,7.6vw,32px)]" : "line-clamp-1 text-[clamp(21px,6.4vw,25px)]"}`}
              >
                {active.name[locale]}
              </h2>
              <p className={`line-clamp-2 font-light text-cream-soft ${roomy ? "mt-1.5 text-[14.5px] leading-[1.45]" : "mt-1 text-[13px] leading-[1.4]"}`}>
                {active.description[locale]}
              </p>
            </div>
            <div className={`flex items-end justify-between gap-4 ${roomy ? "mt-3" : "mt-2"}`}>
              <Price
                key={active.id}
                value={active.price}
                className={`bg-[linear-gradient(180deg,#f6dcab_0%,#d9a55a_100%)] bg-clip-text font-serif leading-none text-transparent ${roomy ? "text-[clamp(26px,7.4vw,32px)]" : "text-[clamp(21px,6.2vw,25px)]"} ${reduced ? "" : "dish-info-in"}`}
              />
              {/* where this dish sits in the category */}
              <div aria-hidden="true" className="flex w-[min(46%,calc(var(--n)*36px))] flex-col items-end gap-2 pb-1" style={{ ["--n" as string]: n }}>
                <span className="text-[13px] tracking-[0.12em] text-cream tabular-nums">
                  {index + 1} / {n}
                </span>
                <span className="flex w-full gap-1.5">
                  {dishes.map((d, i) => (
                    <span key={d.id} className={`h-[2px] flex-1 rounded-full transition-colors duration-300 ${i === index ? "bg-[#f0c47d]" : "bg-cream/25"}`} />
                  ))}
                </span>
              </div>
            </div>
          </div>
        </>
      )}
      {viewing && <PhotoViewer dish={viewing} locale={locale} reduced={reduced} onClose={() => setViewing(null)} />}
      <p aria-live="polite" className="sr-only">
        {active ? `${active.name[locale]}, ${active.price}. ${s.position(index + 1, n)}` : ""}
      </p>
    </div>
  );
}

/** Where the trail begins: a small sprout. */
function Sprout({ className, style }: { className: string; style: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 36 36" aria-hidden="true" className={className} style={style} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M30 34c-2-6-4-10-9-14" />
      <path d="M21 20c-1-6 1-12 6-16 2 6 0 12-6 16Z" fill="currentColor" fillOpacity="0.22" />
      <path d="M24 26c-5-3-11-3-15 1 5 3 11 3 15-1Z" fill="currentColor" fillOpacity="0.22" />
    </svg>
  );
}

/** A dish as a round photograph, or its category emblem on bronze when there is none. */
function Plate({ dish, icon, selected, priority, dim }: { dish: Dish; icon: CategoryIconName; selected: boolean; priority: boolean; dim: boolean }) {
  return (
    <span
      className={`relative block h-full w-full overflow-hidden rounded-full bg-[#14100c] transition-[box-shadow,filter] duration-300 ${dim ? "brightness-[0.72]" : ""}`}
      style={{
        boxShadow: selected
          ? "0 0 0 2px rgba(240,196,125,0.9), 0 0 32px rgba(214,150,70,0.4), 0 18px 34px -10px rgba(0,0,0,0.85)"
          : "0 0 0 1.5px rgba(236,196,132,0.45), 0 14px 26px -10px rgba(0,0,0,0.85)",
      }}
    >
      {dish.photo ? (
        <Image
          src={dish.photo.src}
          alt=""
          fill
          priority={priority}
          sizes="(max-width: 480px) 60vw, 280px"
          className="object-cover"
          style={{ objectPosition: dish.photo.position ?? "50% 55%" }}
          draggable={false}
        />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(70%_70%_at_50%_45%,rgba(222,160,80,0.32)_0%,rgba(222,160,80,0)_72%),linear-gradient(165deg,#3a2c1e_0%,#1d1610_60%,#120e0a_100%)] text-gold-bright/80">
          <CategoryIcon name={icon} className="h-[38%] w-[38%] stroke-[0.9]" />
        </span>
      )}
    </span>
  );
}
