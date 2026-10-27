"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { CategoryIcon as CategoryIconName, Dish, MenuLocale } from "@/content/menus/types";
import { CARD_RADIUS, DishCard } from "./DishCard";
import { menuStrings } from "./strings";

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/** Height : width of the front card: the reference's portrait frame. */
const CARD_RATIO = 1.25;

/** One dish change, start to finish. Inputs are ignored until it has played out. */
export const MOTION_MS = 460;
export const REDUCED_MS = 200;
const EASE = "cubic-bezier(0.22, 0.61, 0.36, 1)";

/** Swipe thresholds: a deliberate pull, or a short quick flick. */
const SWIPE_MIN = 56; // px, or 9% of the deck's height if larger
const FLICK_MIN = 28; // px
const FLICK_SPEED = 0.45; // px per ms, over the swipe's last 100 ms
/** A wheel or trackpad gesture is over after this long without events. */
const WHEEL_QUIET = 240;
const WHEEL_MIN = 50;

/** Depth levels by distance from the front card (0) up to four places away. */
const LEVELS = {
  scale: [1, 0.86, 0.73, 0.62, 0.55],
  blur: [0, 3, 5, 7, 8],
  bright: [1, 0.82, 0.68, 0.58, 0.5],
};
const level = (values: number[], a: number) => {
  const i = Math.min(Math.floor(a), values.length - 2);
  return mix(values[i], values[i + 1], clamp(a - i, 0, 1));
};

/**
 * How far each card behind reaches past the front card's edge, cumulatively:
 * the dishes already seen sit above as three thin edges, the ones to come
 * below, the next one showing a good part of its photograph.
 */
type Geometry = { height: number; above: number[]; below: number[] };

const reachAt = (steps: number[], a: number) => {
  const i = Math.min(Math.floor(a), steps.length - 2);
  return mix(steps[i], steps[i + 1], clamp(a - i, 0, 1));
};

/** Distance around a loop of n cards: the dishes after the front one below (positive), the rest above. */
function loop(x: number, n: number) {
  const d = ((x % n) + n) % n;
  return d > n / 2 ? d - n : d;
}

/** Where a card sits at distance d from the front: negative = above, positive = below. */
function place(d: number, g: Geometry) {
  const steps = d < 0 ? g.above : g.below;
  const visible = steps.length - 2; // levels that show; the last step is where cards fade out
  const a = Math.min(Math.abs(d), steps.length - 1);
  const s = level(LEVELS.scale, a);
  const ty = Math.sign(d) * (((1 - s) * g.height) / 2 + reachAt(steps, a));
  return {
    ty,
    s,
    blur: level(LEVELS.blur, a),
    bright: level(LEVELS.bright, a),
    opacity: clamp(visible + 1 - a, 0, 1),
    z: 100 - Math.round(a * 10),
    text: clamp(1 - a * 2, 0, 1),
  };
}

/**
 * Cards that change sides of the loop (from the back above to the back below,
 * or back) would otherwise fly through the deck. They leave on their own side
 * and fade out, then reappear in place and fade in.
 */
type Crossing = { ids: Set<string>; from: number; dir: 1 | -1; stage: "leave" | "place" };

/**
 * The dishes of one category as a deck: one card in front, the others stacked
 * behind it, smaller and softer. One deliberate swipe, one wheel gesture or one
 * key press moves exactly one dish: up (or down the keys) for the next,
 * the other way for the previous. The deck is a loop, like a real stack: the
 * dishes already seen wait at the back above. `go` decides whether a change
 * may start (the menu holds one lock for every input while a change plays).
 */
export function DishStack({
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
  const sizeShown = useRef(size);
  const [crossing, setCrossing] = useState<Crossing | null>(null);
  const prevIndex = useRef(index);
  const indexRef = useRef(index);
  indexRef.current = index;
  const ms = reduced ? REDUCED_MS : MOTION_MS;

  useLayoutEffect(() => {
    const el = stage.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    setSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  const step = useCallback((dir: 1 | -1) => n > 1 && go((indexRef.current + dir + n) % n), [go, n]);

  // a new front dish: find the cards that change sides and let them fade across
  useLayoutEffect(() => {
    const from = prevIndex.current;
    prevIndex.current = index;
    if (from === index || reduced) return;
    const ids = new Set(
      dishes
        .filter((_, i) => {
          const a = loop(i - from, n);
          const b = loop(i - index, n);
          return a * b < 0 && Math.abs(b - a) > 1.5;
        })
        .map((d) => d.id),
    );
    if (!ids.size) return;
    const dir: 1 | -1 = loop(index - from, n) >= 0 ? 1 : -1;
    setCrossing({ ids, from, dir, stage: "leave" });
    let raf = 0;
    const t = window.setTimeout(() => {
      setCrossing((c) => c && { ...c, stage: "place" });
      raf = requestAnimationFrame(() => (raf = requestAnimationFrame(() => setCrossing(null))));
    }, ms);
    return () => {
      window.clearTimeout(t);
      cancelAnimationFrame(raf);
      setCrossing(null);
    };
  }, [index, dishes, n, ms, reduced]);

  // mouse wheel and trackpads: exactly one dish per gesture, however long its momentum lasts
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    let acc = 0;
    let used = false; // this gesture has already moved a dish
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
        used = true; // even if a change is still playing: this gesture is spent
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
      if (key === "ArrowDown" || key === "PageDown" || (key === " " && !e.shiftKey)) step(1);
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
    if (Math.abs(dy) >= Math.max(SWIPE_MIN, size.h * 0.09) && Math.abs(dy) > Math.abs(dx) * 1.4) {
      gs.used = true; // the rest of this swipe does nothing
      step(dy < 0 ? 1 : -1);
    }
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const gs = gesture.current;
    if (!gs || gs.id !== e.pointerId) return;
    gesture.current = null;
    if (gs.used) return;
    const dy = e.clientY - gs.y;
    const dx = e.clientX - gs.x;
    const [t0, y0] = gs.trail[0];
    const vy = (e.clientY - y0) / Math.max(16, performance.now() - t0);
    // a short but quick, clearly vertical flick also counts
    if (Math.abs(dy) >= FLICK_MIN && Math.abs(vy) >= FLICK_SPEED && Math.abs(dy) > Math.abs(dx) * 1.4) step(dy < 0 ? 1 : -1);
  };
  const onPointerCancel = () => {
    gesture.current = null;
  };

  // card geometry from the space available. The front card keeps the reference's
  // portrait frame; on a short screen (Safari's bars, small phones) it gets
  // narrower rather than flatter.
  const edge = clamp(size.h * 0.036, 10, 28); // each thin edge above
  const next = clamp(size.h * 0.115, 36, 100); // the next dish below
  const after = clamp(size.h * 0.045, 14, 38); // and the one after it
  const g: Geometry = {
    height: 0,
    above: [0, edge, edge * 2, edge * 3, edge * 3 + 4],
    below: [0, next, next + after, next + after + 4],
  };
  const room = size.h - edge * 3 - next - after - 8;
  const maxWidth = Math.min(size.w - 26, 420);
  const height = Math.max(240, Math.min(room, maxWidth * CARD_RATIO));
  const width = Math.min(maxWidth, Math.max(220, height / CARD_RATIO));
  g.height = height;

  // a resize (rotation, browser bars) re-lays the deck at once, without sliding
  const resized = sizeShown.current.w !== size.w || sizeShown.current.h !== size.h;
  useEffect(() => {
    sizeShown.current = size;
  }, [size]);

  const transition = reduced
    ? `opacity ${ms}ms ease-out`
    : `transform ${ms}ms ${EASE}, filter ${ms}ms ${EASE}, opacity ${ms}ms ${EASE}`;
  const active = dishes[index];

  return (
    <div
      ref={stage}
      role="region"
      aria-roledescription="carousel"
      aria-label={categoryLabel}
      className="relative h-full w-full touch-none overflow-hidden select-none [-webkit-tap-highlight-color:transparent] [-webkit-touch-callout:none]"
      style={{ "--deck-t": `${ms}ms ${reduced ? "ease-out" : EASE}` } as React.CSSProperties}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      {size.w > 0 &&
        dishes.map((dish, i) => {
          const d = loop(i - index, n);
          if (d < -4.2 || d > 3.2) return null;
          const cross = crossing?.ids.has(dish.id) ? crossing : null;
          // leaving: keep moving away on the old side while fading; then appear in place, invisible, and fade in
          const p = place(cross?.stage === "leave" ? loop(i - cross.from, n) - cross.dir : d, g);
          const opacity = cross ? 0 : p.opacity;
          const front = i === index;
          return (
            <div
              key={dish.id}
              role="group"
              aria-roledescription="slide"
              aria-label={s.position(i + 1, n)}
              aria-hidden={!front}
              onClick={() => {
                if (!front && !gesture.current?.moved) go(i);
              }}
              className={`absolute top-1/2 left-1/2 ${front ? "" : "cursor-pointer"}`}
              style={{
                width,
                height,
                marginLeft: -width / 2,
                // the front card sits where the edges above and the peeks below balance out
                marginTop: -height / 2 + (g.above[3] - g.below[2]) / 2,
                zIndex: p.z,
                opacity,
                transform: `translate3d(0, ${p.ty}px, 0) scale(${p.s})`,
                filter: p.blur > 0.05 || p.bright < 0.99 ? `blur(${p.blur}px) brightness(${p.bright})` : "blur(0px) brightness(1)",
                transition: resized || cross?.stage === "place" ? "none" : transition,
                backfaceVisibility: "hidden",
                willChange: "transform, filter, opacity",
              }}
            >
              {/* cards behind are not focusable, but a tap on one brings it forward */}
              <div
                inert={!front}
                className="h-full w-full"
                style={{
                  borderRadius: CARD_RADIUS,
                  transition: `box-shadow var(--deck-t)`,
                  boxShadow:
                    // the frame itself is drawn by the card; here only its glow and the shadow it casts
                    d === 0
                      ? "0 0 26px rgba(214,150,70,0.22), 0 30px 60px -20px rgba(0,0,0,0.9)"
                      : "0 0 0 rgba(214,150,70,0), 0 18px 40px -18px rgba(0,0,0,0.8)",
                }}
              >
                <DishCard dish={dish} locale={locale} icon={icon} categoryLabel={categoryLabel} text={p.text} width={width} priority={i <= 1} />
              </div>
            </div>
          );
        })}
      <p aria-live="polite" className="sr-only">
        {active ? `${active.name[locale]}, ${active.price}. ${s.position(index + 1, n)}` : ""}
      </p>
    </div>
  );
}
