"use client";

import Image from "next/image";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Wordmark } from "@/components/brand/BrandLogo";
import type { CategoryIcon as CategoryIconName, Dish, MenuLocale } from "@/content/menus/types";
import { Price } from "./Price";
import { CategoryIcon } from "./icons";
import { PhotoViewer } from "./PhotoViewer";
import { menuStrings } from "./strings";

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/** One step along the trail, start to finish. Inputs are ignored until it has played out. */
export const MOTION_MS = 460;
export const REDUCED_MS = 200;
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

/** Swipe thresholds: a deliberate pull, or a short quick flick. */
const SWIPE_MIN = 48; // px, or 8% of the stage's height if larger
const FLICK_MIN = 28; // px
const FLICK_SPEED = 0.45; // px per ms, over the swipe's last 100 ms
/** A wheel or trackpad gesture is over after this long without events. */
const WHEEL_QUIET = 240;
const WHEEL_MIN = 50;

/** Size of the dishes either side of the selected one, as a share of its size. */
const SIDE_SCALE = 0.74;

/**
 * A category's dishes as round photographs along a winding gold trail: left,
 * right, left, from a sprout at the top. The selected dish sits in the middle
 * of the screen, largest, with its name, description and price in the space
 * beside it; the trail moves up and down to bring the next one to the middle.
 * One swipe, one wheel gesture or one key press moves exactly one dish; a tap
 * on another dish goes to it, and a tap on the selected one opens its
 * photograph whole. `go` holds the lock that keeps changes from overlapping.
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

  // how far along the trail we are, in dishes: eased to the selected dish
  const [pos, setPos] = useState(index);
  const posRef = useRef(index);
  useEffect(() => {
    const from = posRef.current;
    if (reduced || from === index) {
      posRef.current = index;
      setPos(index);
      return;
    }
    const t0 = performance.now();
    let raf = requestAnimationFrame(function frame(now) {
      const t = clamp((now - t0) / MOTION_MS, 0, 1);
      posRef.current = t < 1 ? mix(from, index, easeOut(t)) : index;
      setPos(posRef.current);
      if (t < 1) raf = requestAnimationFrame(frame);
    });
    return () => cancelAnimationFrame(raf);
  }, [index, reduced]);

  // the trail has a start and an end: past either, a step does nothing
  const step = useCallback(
    (dir: 1 | -1) => {
      const to = indexRef.current + dir;
      return to >= 0 && to < n && go(to);
    },
    [go, n],
  );

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

  // layout: the trail zigzags between two columns; the selected dish sits mid-screen
  const w = Math.min(size.w, 520);
  const ox = (size.w - w) / 2;
  const roomy = size.h >= 560;
  const big = Math.min(w * 0.5, size.h * 0.42);
  const gap = size.h * (roomy ? 0.36 : 0.38);
  const colX = (i: number) => ox + (i % 2 === 0 ? 16 + big / 2 : w - 16 - big / 2);
  const at = (i: number) => {
    const a = Math.abs(i - pos);
    return { x: colX(i), y: size.h / 2 + (i - pos) * gap, d: big * mix(1, SIDE_SCALE, clamp(a, 0, 1)), a };
  };

  // the gold line: from the sprout above the first dish, through every dish, to a point past the last
  const sprout = { x: colX(0) - big * 0.32, y: at(0).y - gap * 0.62 };
  const end = { x: colX(n - 1) + (n % 2 === 0 ? -1 : 1) * big * 0.32, y: at(n - 1).y + gap * 0.5 };
  const points = [sprout, ...dishes.map((_, i) => at(i)), end];
  const curve = (from: number, to: number) => {
    let d = `M${points[from].x},${points[from].y}`;
    for (let k = from + 1; k <= to; k++) {
      const p = points[k - 1];
      const q = points[k];
      const h = (q.y - p.y) * 0.55;
      d += ` C${p.x},${p.y + h} ${q.x},${q.y - h} ${q.x},${q.y}`;
    }
    return d;
  };
  const active = dishes[index];
  // the details sit in the column opposite the selected dish
  const textOnLeft = index % 2 === 1;
  const textW = w - 32 - big - 14;

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
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <Wordmark className="text-[min(36vw,220px)] text-gold-bright opacity-[0.2] blur-[5px]" />
          </div>

          <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" fill="none">
            <path d={curve(0, points.length - 1)} stroke="rgba(236,196,132,0.28)" strokeWidth="1.5" strokeLinecap="round" />
            {/* the way already travelled, brighter */}
            <path d={curve(0, index + 1)} stroke="rgba(240,196,125,0.85)" strokeWidth="1.8" strokeLinecap="round" />
            <circle cx={end.x} cy={end.y} r="3" fill="rgba(236,196,132,0.5)" />
          </svg>
          <Sprout className="pointer-events-none absolute h-9 w-9 text-[#e8b86a]" style={{ left: sprout.x - 30, top: sprout.y - 32 }} />

          {dishes.map((dish, i) => {
            const p = at(i);
            if (p.a > 2.2) return null;
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
                  // the selected dish opens its photograph; any other one is brought to the middle
                  if (!selected) go(i);
                  else if (dish.photo && Math.abs(index - pos) < 0.02) setViewing(dish);
                }}
                className="absolute rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
                style={{ width: p.d, height: p.d, left: p.x - p.d / 2, top: p.y - p.d / 2, zIndex: 20 - Math.round(p.a * 4), opacity: clamp(2.2 - p.a, 0, 1) }}
              >
                <Plate dish={dish} icon={icon} selected={p.a < 0.5} priority={p.a < 1.5} />
              </button>
            );
          })}

          {/* the selected dish's details, beside it */}
          <div
            key={`text-${active.id}`}
            className={`pointer-events-none absolute z-30 -translate-y-1/2 ${reduced ? "" : "dish-info-in"} ${textOnLeft ? "text-left" : "text-right"}`}
            style={{ top: size.h / 2, width: textW, left: textOnLeft ? ox + 20 : ox + w - 20 - textW }}
          >
            <p className={`font-medium tracking-[0.32em] text-[#d9a55a] uppercase ${roomy ? "text-[10.5px]" : "text-[10px]"}`}>{categoryLabel}</p>
            <span aria-hidden="true" className={`block h-px w-8 bg-[#d9a55a]/80 ${roomy ? "my-3" : "my-2"} ${textOnLeft ? "" : "ml-auto"}`} />
            <h2
              className={`line-clamp-3 font-serif leading-[1.02] tracking-[-0.01em] text-cream [overflow-wrap:anywhere] ${roomy ? "text-[clamp(24px,7vw,30px)]" : "text-[clamp(20px,6vw,24px)]"}`}
            >
              {active.name[locale]}
            </h2>
            <p className={`font-light text-cream-soft ${roomy ? "mt-2 line-clamp-4 text-[13.5px] leading-[1.45]" : "mt-1.5 line-clamp-2 text-[12.5px] leading-[1.4]"}`}>
              {active.description[locale]}
            </p>
            <Price
              value={active.price}
              className={`mt-3 inline-block bg-[linear-gradient(180deg,#f6dcab_0%,#d9a55a_100%)] bg-clip-text font-serif leading-none text-transparent ${roomy ? "text-[clamp(24px,7vw,30px)]" : "mt-2 text-[22px]"}`}
            />
            <p aria-hidden="true" className="mt-2 text-[11px] tracking-[0.18em] text-cream-muted tabular-nums">
              {index + 1} / {n}
            </p>
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
function Plate({ dish, icon, selected, priority }: { dish: Dish; icon: CategoryIconName; selected: boolean; priority: boolean }) {
  return (
    <span
      className="relative block h-full w-full overflow-hidden rounded-full bg-[#14100c] transition-shadow duration-300"
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
