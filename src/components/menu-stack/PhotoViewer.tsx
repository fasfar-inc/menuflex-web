"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Dish, MenuLocale } from "@/content/menus/types";
import { CloseIcon } from "./icons";
import { Price } from "./Price";
import { menuStrings } from "./strings";

/** Swipe distance that closes the viewer. */
const CLOSE_DRAG = 90;

/**
 * A dish's photograph, large and uncropped, with its name, price and
 * description. Closes on the ✕, a tap outside the photo, a swipe down or
 * Escape, and hands focus back to whatever opened it.
 */
export function PhotoViewer({ dish, locale, reduced, onClose }: { dish: Dish; locale: MenuLocale; reduced: boolean; onClose: () => void }) {
  const s = menuStrings[locale];
  const close = useRef<HTMLButtonElement>(null);
  const [drag, setDrag] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const start = useRef<{ id: number; y: number } | null>(null);
  const photo = dish.photo!;

  const dismiss = () => {
    if (leaving) return;
    if (reduced) return onClose();
    setLeaving(true);
    window.setTimeout(onClose, 200);
  };

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    close.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        dismiss();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      opener?.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // swipe down to close: the photo follows the finger, then closes or settles back
  // (stopPropagation: the portal still bubbles React events up to the wheel's handlers)
  const onPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    if (e.pointerType !== "mouse" && e.isPrimary) start.current = { id: e.pointerId, y: e.clientY };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    e.stopPropagation();
    if (start.current?.id === e.pointerId) setDrag(Math.max(0, e.clientY - start.current.y));
  };
  const onPointerUp = (e: React.PointerEvent) => {
    e.stopPropagation();
    if (start.current?.id !== e.pointerId) return;
    start.current = null;
    if (drag > CLOSE_DRAG) dismiss();
    else setDrag(0);
  };

  const fade = 1 - Math.min(1, drag / (CLOSE_DRAG * 3));

  // portalled to <body>: the wheel's animated wrappers would otherwise become the fixed box's frame
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={dish.name[locale]}
      className={`fixed inset-0 z-[90] flex touch-none flex-col items-center justify-center px-4 pt-[max(env(safe-area-inset-top),56px)] pb-[max(env(safe-area-inset-bottom),24px)] select-none ${reduced ? "" : leaving ? "photo-out" : "photo-in"}`}
      style={{ backgroundColor: `rgb(5 4 3 / ${0.94 * fade})` }}
      onClick={(e) => {
        e.stopPropagation();
        dismiss();
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={(e) => {
        e.stopPropagation();
        start.current = null;
        setDrag(0);
      }}
    >
      <button
        ref={close}
        type="button"
        aria-label={s.close}
        onClick={(e) => {
          e.stopPropagation();
          dismiss();
        }}
        className="absolute top-[max(env(safe-area-inset-top),10px)] right-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-cream backdrop-blur-sm transition-colors hover:bg-white/20"
      >
        <CloseIcon className="h-6 w-6" />
      </button>

      <figure
        className="m-0 w-full max-w-[560px]"
        style={{
          transform: drag ? `translateY(${drag}px) scale(${1 - Math.min(0.08, drag / 2000)})` : undefined,
          transition: drag && start.current ? "none" : "transform 260ms cubic-bezier(0.22, 0.61, 0.36, 1)",
        }}
      >
        <div
          className="relative mx-auto w-full overflow-hidden rounded-[22px] shadow-[0_0_0_1px_rgba(236,196,132,0.55),0_30px_80px_-20px_rgba(0,0,0,0.9)]"
          style={{ aspectRatio: `${photo.width} / ${photo.height}`, maxHeight: "62dvh", maxWidth: `calc(62dvh * ${photo.width / photo.height})` }}
          onClick={(e) => e.stopPropagation()}
        >
          <Image src={photo.src} alt={dish.name[locale]} fill priority sizes="(max-width: 600px) 94vw, 560px" className="object-cover" draggable={false} />
        </div>
        <figcaption className="mx-auto mt-5 max-w-[520px] px-1" style={{ opacity: fade }} onClick={(e) => e.stopPropagation()}>
          <div className="flex items-baseline justify-between gap-4">
            <span className="font-serif text-[clamp(24px,7vw,30px)] leading-tight text-cream">{dish.name[locale]}</span>
            <Price value={dish.price} className="shrink-0 font-serif text-[clamp(22px,6.4vw,28px)] text-cream" />
          </div>
          <p className="mt-2 text-[15.5px] leading-[1.55] font-light text-cream-soft">{dish.description[locale]}</p>
        </figcaption>
      </figure>
    </div>,
    document.body,
  );
}
