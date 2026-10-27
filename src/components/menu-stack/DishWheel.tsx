"use client";

import Image from "next/image";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { CategoryIcon as CategoryIconName, Dish, MenuLocale } from "@/content/menus/types";
import { Price } from "./Price";
import { CategoryIcon, ExpandIcon } from "./icons";
import { PhotoViewer } from "./PhotoViewer";
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
const STEP_DEG = 36;
/** Plate diameter by distance from the selected one, as a share of the orbit radius. */
const PLATE = [0.74, 0.56, 0.5, 0.46];
/** Height of the dish details under the wheel. */
const INFO_H = 132;

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
  // the dish whose photograph is open, large
  const [viewing, setViewing] = useState<Dish | null>(null);

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
  const wheelH = Math.max(220, size.h - INFO_H);
  // the selected plate's right edge stays clear of the screen edge
  const r = Math.max(120, Math.min(size.w * 0.66, wheelH * 0.6, (size.w - 10) / 1.29));
  const cx = -0.08 * r;
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
        // the wheel fades out at its foot, onto whatever is behind the menu
        <div className="absolute inset-x-0 top-0 overflow-hidden [mask-image:linear-gradient(to_bottom,#000_calc(100%-40px),transparent)]" style={{ height: wheelH }}>
          {/* the wheel: a brass tray, a little see-through, with engraved rings */}
          <div
            aria-hidden="true"
            className="absolute rounded-full bg-[radial-gradient(circle_at_75%_50%,rgba(91,68,41,0.9)_0%,rgba(62,47,30,0.86)_42%,rgba(39,29,19,0.8)_100%)] backdrop-blur-[2px]"
            style={{
              width: discR * 2,
              height: discR * 2,
              left: cx - discR,
              top: cy - discR,
              boxShadow: "inset 0 0 0 2px rgba(236,196,132,0.7), inset 0 0 90px rgba(0,0,0,0.35), 0 0 80px rgba(214,150,70,0.22)",
            }}
          />
          <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" fill="none">
            <circle cx={cx} cy={cy} r={discR * 0.8} stroke="rgba(236,196,132,0.28)" strokeWidth="1" />
            <circle cx={cx} cy={cy} r={discR * 0.765} stroke="rgba(236,196,132,0.16)" strokeWidth="0.75" strokeDasharray="1.5 5" />
            <circle cx={cx} cy={cy} r={discR * 0.55} stroke="rgba(236,196,132,0.2)" strokeWidth="1" />
            <circle cx={cx} cy={cy} r={discR * 0.32} stroke="rgba(236,196,132,0.14)" strokeWidth="1" />
            {/* the rim's marks turn with the plates: one per dish, three finer ones between */}
            {Array.from({ length: n * 4 }, (_, k) => {
              const major = k % 4 === 0;
              const d = loop(k / 4 - pos, n);
              const t = (d * STEP_DEG * Math.PI) / 180;
              const on = major && Math.abs(d) < 0.5;
              const inner = discR * (major ? 0.86 : k % 2 === 0 ? 0.9 : 0.925);
              const outer = discR * 0.965;
              return (
                <line
                  key={k}
                  x1={cx + inner * Math.cos(t)}
                  y1={cy + inner * Math.sin(t)}
                  x2={cx + outer * Math.cos(t)}
                  y2={cy + outer * Math.sin(t)}
                  stroke={on ? "rgba(246,217,165,0.95)" : `rgba(236,196,132,${major ? 0.6 : 0.4})`}
                  strokeWidth={major ? 1.6 : 1}
                  strokeLinecap="round"
                  style={on ? { filter: "drop-shadow(0 0 4px rgba(240,196,125,0.9))" } : undefined}
                />
              );
            })}
          </svg>

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
                tabIndex={selected && dish.photo ? 0 : -1}
                aria-label={selected && dish.photo ? `${s.viewPhoto}: ${dish.name[locale]}` : dish.name[locale]}
                aria-current={selected ? "true" : undefined}
                onClick={() => {
                  if (gesture.current?.used) return;
                  // the selected plate opens its photograph; any other plate turns the wheel to it
                  if (!selected) go(i);
                  else if (dish.photo && Math.abs(index - pos) < 0.02) setViewing(dish);
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
                {/* tells guests the selected photo opens */}
                {dish.photo && (
                  <span
                    aria-hidden="true"
                    className="absolute right-[9%] bottom-[9%] flex h-8 w-8 items-center justify-center rounded-full bg-[rgb(12_10_8/0.72)] text-cream shadow-[0_0_0_1px_rgba(236,196,132,0.5)] backdrop-blur-sm transition-opacity duration-300"
                    style={{ opacity: a < 0.3 ? 1 : 0 }}
                  >
                    <ExpandIcon className="h-4 w-4" />
                  </span>
                )}
              </button>
            );
          })}

          {/* the category tag, tied to the selected plate by a fine gold line */}
          <div aria-hidden="true" className="absolute z-[55] flex items-center" style={{ top: cy - 4, left: 0, width: cx + r * (1 - PLATE[0] / 2) + 2, height: 8 }}>
            <span className="h-px flex-1 bg-[linear-gradient(90deg,rgba(236,196,132,0.2),rgba(240,196,125,0.9))]" />
            <span className="h-2 w-2 rotate-45 bg-[#f0c47d] shadow-[0_0_8px_rgba(240,196,125,0.9)]" />
          </div>
          {/* the category, on the wheel */}
          <div
            className="absolute left-0 z-[60] flex h-[50px] max-w-[44%] items-center rounded-r-full bg-cream pr-6 pl-4 text-[17px] font-medium whitespace-nowrap text-[#17120c] shadow-[0_8px_24px_-10px_rgba(0,0,0,0.8)]"
            style={{ top: cy - 25 }}
          >
            <span className="truncate">{categoryLabel}</span>
          </div>

        </div>
      )}

      {/* the selected dish */}
      {active && (
        <div className="absolute inset-x-0 bottom-0 px-6" style={{ height: INFO_H }}>
          <div key={active.id} className={reduced ? "" : "dish-info-in"}>
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="min-w-0 font-serif text-[clamp(22px,6.8vw,29px)] leading-tight tracking-[-0.01em] text-cream">{active.name[locale]}</h2>
              <Price value={active.price} className="shrink-0 font-serif text-[clamp(20px,6.2vw,27px)] text-cream" />
            </div>
            <p className="mt-2 line-clamp-2 text-[15px] leading-[1.5] font-light text-cream-soft">{active.description[locale]}</p>
            <p className="mt-2 text-[11px] tracking-[0.2em] text-cream-muted tabular-nums" aria-hidden="true">
              {index + 1} / {n}
            </p>
          </div>
        </div>
      )}
      {viewing && <PhotoViewer dish={viewing} locale={locale} reduced={reduced} onClose={() => setViewing(null)} />}
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
          sizes="(max-width: 480px) 50vw, 240px"
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
