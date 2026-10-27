"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { CategoryIcon as CategoryIconName, Dish, MenuLocale } from "@/content/menus/types";
import { DishCard } from "./DishCard";
import { menuStrings } from "./strings";

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

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

/** Where a card sits at (fractional) distance d from the front: negative = above, positive = below. */
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
 * The dishes of one category as a deck: one card in front, the others stacked
 * behind it, smaller and softer. Swipe or scroll up for the next dish, down for
 * the previous; arrow keys, Page Up/Down, Home and End work too. The deck is
 * a loop, like a real stack: the dishes already seen wait at the back above,
 * so after the last dish the first comes round again.
 */
export function DishStack({
  dishes,
  index,
  onIndexChange,
  locale,
  icon,
  categoryLabel,
  reduced,
}: {
  dishes: Dish[];
  index: number;
  onIndexChange: (i: number) => void;
  locale: MenuLocale;
  icon: CategoryIconName;
  categoryLabel: string;
  reduced: boolean;
}) {
  const s = menuStrings[locale];
  const stage = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [drag, setDrag] = useState<number | null>(null);
  const gesture = useRef<{ id: number; y: number; t: number; last: number; vy: number; moved: boolean } | null>(null);
  const shownPos = useRef(index); // deck position on screen after the last render
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

  // card geometry from the space available, in the reference's proportions
  const width = Math.min(size.w - 26, 440);
  const edge = clamp(size.h * 0.046, 18, 34); // each thin edge above
  const next = clamp(size.h * 0.15, 60, 124); // the next dish below
  const after = clamp(size.h * 0.06, 24, 48); // and the one after it
  const g: Geometry = {
    height: 0,
    above: [0, edge, edge * 2, edge * 3, edge * 3 + 4],
    below: [0, next, next + after, next + after + 4],
  };
  const height = Math.max(250, Math.min(size.h - edge * 3 - next - after - 6, width * 1.4));
  g.height = height;
  const pitch = height * 0.45; // drag distance for one dish

  const step = useCallback(
    (dir: -1 | 1) => {
      onIndexChange((indexRef.current + dir + dishes.length) % dishes.length);
    },
    [dishes.length, onIndexChange],
  );

  // mouse wheel and trackpads: one dish per gesture, however long its momentum lasts
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    let acc = 0;
    let locked = false;
    let lockedAt = 0;
    let quiet: number | undefined;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) < Math.abs(e.deltaX)) return;
      e.preventDefault();
      window.clearTimeout(quiet);
      quiet = window.setTimeout(() => {
        locked = false;
        acc = 0;
      }, 160);
      if (locked && performance.now() - lockedAt < 1400) return;
      acc += e.deltaMode === 1 ? e.deltaY * 32 : e.deltaY;
      if (Math.abs(acc) > 44) {
        step(acc > 0 ? 1 : -1);
        acc = 0;
        locked = true;
        lockedAt = performance.now();
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
      const t = e.target as HTMLElement;
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || document.querySelector('[aria-modal="true"]')) return;
      if (t.closest("input, textarea, select, [role=dialog], [role=menu]")) return;
      const key = e.key;
      // the category bar keeps Left/Right, Home/End and Space for itself; Up/Down still change dishes
      if (t.closest("[role=tablist]") && !["ArrowDown", "ArrowUp", "PageDown", "PageUp"].includes(key)) return;
      if (key === "ArrowDown" || key === "PageDown" || (key === " " && !e.shiftKey)) step(1);
      else if (key === "ArrowUp" || key === "PageUp" || (key === " " && e.shiftKey)) step(-1);
      else if (key === "Home") onIndexChange(0);
      else if (key === "End") onIndexChange(dishes.length - 1);
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step, onIndexChange, dishes.length]);

  // touch and pen (and mouse drag): the deck follows the finger, then settles
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 || gesture.current) return;
    gesture.current = { id: e.pointerId, y: e.clientY, t: performance.now(), last: 0, vy: 0, moved: false };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const gs = gesture.current;
    if (!gs || gs.id !== e.pointerId) return;
    const dy = e.clientY - gs.y;
    if (!gs.moved && Math.abs(dy) < 6) return;
    if (!gs.moved) {
      gs.moved = true;
      stage.current?.setPointerCapture(e.pointerId);
    }
    const now = performance.now();
    gs.vy = (dy - gs.last) / Math.max(1, now - gs.t);
    gs.t = now;
    gs.last = dy;
    setDrag(dy);
  };
  const onPointerEnd = (e: React.PointerEvent) => {
    const gs = gesture.current;
    if (!gs || gs.id !== e.pointerId) return;
    gesture.current = null;
    const dy = gs.last;
    setDrag(null);
    if (!gs.moved) return;
    // up (negative) = next dish; a quick flick counts even when short
    if (dy < -pitch * 0.28 || (gs.vy < -0.45 && dy < -12)) step(1);
    else if (dy > pitch * 0.28 || (gs.vy > 0.45 && dy > 12)) step(-1);
  };

  // live position while dragging, with resistance past the ends
  // live position while dragging
  const pos = drag !== null ? index - drag / pitch : index;
  const n = dishes.length;
  const half = n / 2;
  useEffect(() => {
    shownPos.current = pos;
  });

  const transition =
    drag !== null
      ? "none"
      : reduced
        ? "opacity 180ms ease-out"
        : "transform 640ms cubic-bezier(.22,.8,.24,1), filter 640ms cubic-bezier(.22,.8,.24,1), opacity 480ms ease-out";
  const active = dishes[index];

  return (
    <div
      ref={stage}
      role="region"
      aria-roledescription="carousel"
      aria-label={categoryLabel}
      className="relative h-full w-full touch-none overflow-hidden select-none"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
    >
      {size.w > 0 &&
        dishes.map((dish, i) => {
          const d = loop(i - pos, n);
          if (d < -4.2 || d > 3.2) return null;
          const p = place(d, g);
          // the loop's seam is at the very back: cards fade out there before they swap sides
          const seam = n > 1 && (n % 2 === 1 || d < 0) ? clamp((half - Math.abs(d)) / 0.5, 0, 1) : 1;
          // a card that swaps sides jumps there instead of travelling through the deck
          const jumped = Math.abs(d - loop(i - shownPos.current, n)) > 1.5;
          const front = i === index;
          return (
            <div
              key={dish.id}
              role="group"
              aria-roledescription="slide"
              aria-label={s.position(i + 1, dishes.length)}
              aria-hidden={!front}
              onClick={() => {
                if (!front) onIndexChange(i);
              }}
              className={`absolute top-1/2 left-1/2 ${front ? "" : "cursor-pointer"}`}
              style={{
                width,
                height,
                marginLeft: -width / 2,
                // the front card sits where the edges above and the peeks below balance out
                marginTop: -height / 2 + (g.above[3] - g.below[2]) / 2,
                zIndex: p.z,
                opacity: p.opacity * seam,
                transform: `translateY(${p.ty}px) scale(${p.s})`,
                filter: p.blur > 0.05 || p.bright < 0.99 ? `blur(${p.blur}px) brightness(${p.bright})` : "none",
                transition: jumped ? "none" : transition,
                willChange: "transform, filter",
              }}
            >
              {/* cards behind are not focusable, but a tap on one brings it forward */}
              <div
                inert={!front}
                className="h-full w-full rounded-[28px] transition-shadow duration-500"
                style={{
                  boxShadow:
                    Math.abs(d) < 0.5
                      ? "0 0 0 1px rgba(240,196,125,0.6), 0 0 26px rgba(214,150,70,0.22), 0 30px 60px -20px rgba(0,0,0,0.9)"
                      : "0 0 0 1px rgba(255,236,205,0.26), 0 18px 40px -18px rgba(0,0,0,0.8)",
                }}
              >
                <DishCard dish={dish} locale={locale} icon={icon} categoryLabel={categoryLabel} text={p.text} priority={i <= 1} />
              </div>
            </div>
          );
        })}
      <p aria-live="polite" className="sr-only">
        {active ? `${active.name[locale]}, ${active.price}. ${s.position(index + 1, dishes.length)}` : ""}
      </p>
    </div>
  );
}
