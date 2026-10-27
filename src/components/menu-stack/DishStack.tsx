"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { CategoryIcon as CategoryIconName, Dish, MenuLocale } from "@/content/menus/types";
import { DishCard, type CardFaces } from "./DishCard";
import { menuStrings } from "./strings";

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/** Depth levels for a card's distance from the front (0) up to three places away. */
const LEVELS = {
  scale: [1, 0.92, 0.85, 0.8],
  blur: [0, 1.6, 3.2, 5],
  bright: [1, 0.78, 0.6, 0.5],
  opacity: [1, 1, 1, 0],
};
const level = (values: number[], a: number) => {
  const i = Math.min(Math.floor(a), values.length - 2);
  return mix(values[i], values[i + 1], clamp(a - i, 0, 1));
};

type Geometry = { width: number; height: number; peek: [number, number] };

/** Where a card sits at (fractional) distance d from the front: negative = above, positive = below. */
function place(d: number, g: Geometry) {
  const a = Math.min(Math.abs(d), 3);
  const s = level(LEVELS.scale, a);
  // how far the card's outer edge reaches beyond the front card's edge
  const reach = a <= 1 ? g.peek[0] * a : a <= 2 ? g.peek[0] + g.peek[1] * (a - 1) : g.peek[0] + g.peek[1] + 6 * (a - 2);
  const ty = Math.sign(d) * (((1 - s) * g.height) / 2 + reach);
  const faces: CardFaces = {
    full: clamp(1 - a * 1.6, 0, 1),
    top: d < 0 ? clamp(a * 1.6 - 0.4, 0, 1) : 0,
    bottom: d > 0 ? clamp(a * 1.6 - 0.4, 0, 1) : 0,
  };
  return { ty, s, blur: level(LEVELS.blur, a), bright: level(LEVELS.bright, a), opacity: level(LEVELS.opacity, a), z: 100 - Math.round(a * 10), faces };
}

/**
 * The dishes of one category as a deck: one card in front, the others stacked
 * behind it, smaller and softer. Swipe or scroll up for the next dish, down for
 * the previous; arrow keys, Page Up/Down, Home and End work too. Past either
 * end, `onBoundary` lets the menu move on to the neighbouring category.
 */
export function DishStack({
  dishes,
  index,
  onIndexChange,
  onBoundary,
  locale,
  icon,
  categoryLabel,
  reduced,
}: {
  dishes: Dish[];
  index: number;
  onIndexChange: (i: number) => void;
  /** Called when the visitor goes past the first (-1) or last (+1) dish; returns whether it moved on. */
  onBoundary: (direction: -1 | 1) => boolean;
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

  // card geometry from the space available
  // the two cards on each side peek out by about a strip each, as in the reference
  const peek1 = clamp(size.h * 0.1, 40, 74);
  const peek: [number, number] = [peek1, peek1 * 0.82];
  const width = Math.min(size.w - 28, 440);
  const height = Math.max(250, Math.min(size.h - 2 * (peek[0] + peek[1]) - 8, width * 1.25));
  const g: Geometry = { width, height, peek };
  const pitch = height * 0.45; // drag distance for one dish

  const step = useCallback(
    (dir: -1 | 1) => {
      const next = indexRef.current + dir;
      if (next < 0 || next >= dishes.length) return onBoundary(dir);
      onIndexChange(next);
      return true;
    },
    [dishes.length, onBoundary, onIndexChange],
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
  let pos = index;
  if (drag !== null) {
    pos = index - drag / pitch;
    if (pos < 0) pos = -Math.min(0.6, -pos * 0.35);
    if (pos > dishes.length - 1) pos = dishes.length - 1 + Math.min(0.6, (pos - dishes.length + 1) * 0.35);
  }

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
          const d = i - pos;
          if (Math.abs(d) > 3.2) return null;
          const p = place(d, g);
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
                marginTop: -height / 2,
                zIndex: p.z,
                opacity: p.opacity,
                transform: `translateY(${p.ty}px) scale(${p.s})`,
                filter: p.blur > 0.05 || p.bright < 0.99 ? `blur(${p.blur}px) brightness(${p.bright})` : "none",
                transition,
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
                      ? "0 0 0 1px rgba(240,196,125,0.55), 0 0 28px rgba(214,150,70,0.28), 0 30px 60px -20px rgba(0,0,0,0.85)"
                      : "0 18px 40px -18px rgba(0,0,0,0.8)",
                }}
              >
                <DishCard dish={dish} locale={locale} icon={icon} categoryLabel={categoryLabel} width={width} height={height} faces={p.faces} priority={i === 0} />
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
