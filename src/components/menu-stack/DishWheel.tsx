"use client";

import Image from "next/image";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { CategoryIcon as CategoryIconName, Dish, MenuLocale } from "@/content/menus/types";
import { Price } from "./Price";
import { Wordmark } from "@/components/brand/BrandLogo";
import { CategoryIcon } from "./icons";
import { menuStrings } from "./strings";

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/** One turn of the wheel, start to finish. Inputs are ignored until it has played out. */
export const MOTION_MS = 460;
export const REDUCED_MS = 200;
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

/** Swipe thresholds: a deliberate pull, or a short quick flick. */
const SWIPE_MIN = 48; // px, or 8% of the wheel's height if larger
const FLICK_MIN = 28; // px
const FLICK_SPEED = 0.45; // px per ms, over the swipe's last 100 ms
/** A wheel or trackpad gesture is over after this long without events. */
const WHEEL_QUIET = 240;
const WHEEL_MIN = 50;

/** Angle between neighbouring plates around the wheel. */
const STEP_DEG = 42;
/** Plate diameter by distance from the selected one, as a share of the orbit radius. */
const PLATE = [0.96, 0.54, 0.46, 0.42];
/** Height of the dish details under the wheel, with and without room for the swipe hint. */
const INFO_H = 204;
const INFO_H_SHORT = 150;

/** Distance around a loop of n plates: the dishes after the selected one below (positive), the rest above. */
function loop(x: number, n: number) {
  const d = ((x % n) + n) % n;
  return d > n / 2 ? d - n : d;
}

const plateSize = (a: number) => {
  const i = Math.min(Math.floor(a), PLATE.length - 2);
  return mix(PLATE[i], PLATE[i + 1], clamp(a - i, 0, 1));
};

/**
 * A category's dishes as round plates around a dark wheel at the left edge.
 * The selected plate sits at the wheel's right, largest; the others follow
 * the curve above and below. Choosing a dish turns the wheel so the plates
 * travel along the circle. One swipe, one wheel gesture, one key press or a
 * tap on a plate moves to exactly one dish; `go` holds the lock that keeps
 * changes from overlapping. The selected dish's name, price and description
 * sit under the wheel.
 */
export function DishWheel({
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

  useLayoutEffect(() => {
    const el = stage.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    setSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  // the wheel's rotation, in dishes: eased along the shortest way round to the selected dish
  const [pos, setPos] = useState(index);
  const posRef = useRef(index);
  useEffect(() => {
    const from = posRef.current;
    const delta = loop(index - from, n);
    if (reduced || delta === 0) {
      posRef.current = index;
      setPos(index);
      return;
    }
    const t0 = performance.now();
    let raf = requestAnimationFrame(function frame(now) {
      const t = clamp((now - t0) / MOTION_MS, 0, 1);
      posRef.current = t < 1 ? from + delta * easeOut(t) : index;
      setPos(posRef.current);
      if (t < 1) raf = requestAnimationFrame(frame);
    });
    return () => cancelAnimationFrame(raf);
  }, [index, n, reduced]);

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

  // wheel geometry: orbit radius from the space, everything else in proportion
  const tall = size.h >= 600;
  const infoH = tall ? INFO_H : INFO_H_SHORT;
  const wheelH = Math.max(220, size.h - infoH);
  // the selected plate, big enough to see the dish, keeps its right edge clear of the screen edge
  const r = Math.max(120, Math.min(size.w * 0.7, wheelH * 0.6, (size.w - 12) / 1.48));
  // when height caps the wheel, it moves right so the category pill keeps clear of the plate
  const cx = Math.max(0, size.w - 12 - 1.48 * r);
  const cy = wheelH / 2;
  const discR = 0.9 * r;
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
      {size.w > 0 && (
        <div className="absolute inset-x-0 top-0 overflow-hidden" style={{ height: wheelH }}>
          {/* the wheel */}
          <div
            aria-hidden="true"
            className="absolute rounded-full bg-[radial-gradient(circle_at_75%_50%,#5b4429_0%,#3e2f1e_42%,#271d13_100%)]"
            style={{
              width: discR * 2,
              height: discR * 2,
              left: cx - discR,
              top: cy - discR,
              boxShadow: "inset 0 0 0 2px rgba(236,196,132,0.7), inset 0 0 90px rgba(0,0,0,0.35), 0 0 80px rgba(214,150,70,0.22)",
            }}
          />

          {/* MenuFlex, large and soft, between the wheel and the plates */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <Wordmark className="text-[min(36vw,220px)] text-gold-bright opacity-[0.3] blur-[4px]" />
          </div>

          {/* the plates around it */}
          {dishes.map((dish, i) => {
            const d = loop(i - pos, n);
            const a = Math.abs(d);
            const theta = (d * STEP_DEG * Math.PI) / 180;
            if (Math.abs(theta) > Math.PI * 0.62) return null;
            const dia = plateSize(a) * r;
            const x = cx + r * Math.cos(theta);
            const y = cy + r * Math.sin(theta);
            // plates fade where the loop wraps round, at the far side of the wheel
            const seam = n > 2 ? clamp((n / 2 - a) / 0.5, 0, 1) : 1;
            const selected = i === index;
            return (
              <button
                key={dish.id}
                type="button"
                tabIndex={-1}
                aria-label={dish.name[locale]}
                aria-current={selected ? "true" : undefined}
                onClick={() => {
                  if (!gesture.current?.used && !selected) go(i);
                }}
                className="absolute rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
                style={{
                  width: dia,
                  height: dia,
                  left: x - dia / 2,
                  top: y - dia / 2,
                  zIndex: 50 - Math.round(a * 10),
                  opacity: seam,
                  pointerEvents: seam < 0.5 ? "none" : undefined,
                  transition: reduced ? `opacity ${REDUCED_MS}ms ease-out` : undefined,
                }}
              >
                <Plate dish={dish} icon={icon} selected={a < 0.5} priority={a < 1.5} />
              </button>
            );
          })}

          {/* the category, on the wheel */}
          <div
            className="absolute left-0 z-[60] flex h-[50px] max-w-[44%] items-center rounded-r-full bg-cream pr-6 pl-4 text-[17px] font-medium whitespace-nowrap text-[#17120c] shadow-[0_8px_24px_-10px_rgba(0,0,0,0.8)]"
            style={{ top: cy - 25 }}
          >
            <span className="truncate">{categoryLabel}</span>
          </div>

          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 z-[70] h-8 bg-[linear-gradient(to_bottom,rgba(11,9,7,0),#0b0907)]" />
        </div>
      )}

      {/* the selected dish */}
      {active && (
        <div className="absolute inset-x-0 bottom-0 flex flex-col justify-end px-6" style={{ height: infoH }}>
          <div key={active.id} className={reduced ? "" : "dish-info-in"}>
            {tall && <span aria-hidden="true" className="mb-3 block h-px w-10 bg-[#d9a55a]/80" />}
            <h2
              className={`min-w-0 font-serif leading-[1.05] tracking-[-0.01em] text-cream ${tall ? "line-clamp-2 text-[clamp(28px,8.2vw,34px)]" : "line-clamp-1 text-[clamp(22px,6.8vw,27px)]"}`}
            >
              {active.name[locale]}
            </h2>
            <p className={`line-clamp-2 font-light text-cream-soft ${tall ? "mt-2 text-[15px] leading-[1.5]" : "mt-1 text-[14px] leading-[1.45]"}`}>
              {active.description[locale]}
            </p>
          </div>
          <div className={`flex items-end justify-between gap-4 ${tall ? "mt-3" : "mt-2"}`}>
            <Price
              key={active.id}
              value={active.price}
              className={`bg-[linear-gradient(180deg,#f6dcab_0%,#d9a55a_100%)] bg-clip-text font-serif leading-none text-transparent ${tall ? "text-[clamp(28px,8vw,34px)]" : "text-[clamp(22px,6.6vw,27px)]"} ${reduced ? "" : "dish-info-in"}`}
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
          {tall && (
            <p aria-hidden="true" className="mt-4 mb-1 flex flex-col items-center gap-1 text-[10.5px] tracking-[0.34em] text-cream-soft uppercase">
              <svg viewBox="0 0 24 24" className="h-4 w-4 text-[#d9a55a]" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="m6 9 6 6 6-6" />
              </svg>
              <span className="flex items-center gap-3">
                <span className="h-px w-6 bg-cream/40" />
                {s.hint}
                <span className="h-px w-6 bg-cream/40" />
              </span>
            </p>
          )}
        </div>
      )}
      <p aria-live="polite" className="sr-only">
        {active ? `${active.name[locale]}, ${active.price}. ${s.position(index + 1, n)}` : ""}
      </p>
    </div>
  );
}

/** A dish as a round plate: its photograph cut to a circle, or the category emblem. */
function Plate({ dish, icon, selected, priority }: { dish: Dish; icon: CategoryIconName; selected: boolean; priority: boolean }) {
  return (
    <span
      className="relative block h-full w-full overflow-hidden rounded-full bg-[#14100c] transition-shadow duration-300"
      style={{
        boxShadow: selected
          ? "0 0 0 2px rgba(240,196,125,0.85), 0 0 28px rgba(214,150,70,0.35), 0 18px 34px -10px rgba(0,0,0,0.85)"
          : "0 0 0 1.5px rgba(236,196,132,0.45), 0 14px 26px -10px rgba(0,0,0,0.85)",
      }}
    >
      {dish.photo ? (
        <Image
          src={dish.photo.src}
          alt=""
          fill
          priority={priority}
          sizes="(max-width: 480px) 70vw, 320px"
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
