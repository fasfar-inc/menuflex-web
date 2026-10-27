"use client";

import { useEffect, useRef } from "react";
import type { ProgressStore } from "@/lib/progressStore";
import { frameUrl, openingFrames } from "./openingFrames";

/** Load order: the first frame, then progressively finer passes over the sequence. */
function loadOrder(count: number) {
  const order: number[] = [0, count - 1];
  for (const stride of [16, 8, 4, 2, 1]) {
    for (let i = 0; i < count; i += stride) if (!order.includes(i)) order.push(i);
  }
  return order;
}

/**
 * Scrubs the pre-rendered menu opening with scroll progress (GSAP smooths the
 * scroll, so frames advance like video). Frames that have not loaded yet fall
 * back to the nearest loaded one.
 */
export function MenuSequence({
  store,
  toFrame,
  onReady,
}: {
  store: ProgressStore;
  /** Maps scroll progress (0–1) to sequence time (0–1). */
  toFrame: (p: number) => number;
  onReady: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { count, sets } = openingFrames;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cssWidth = canvas.getBoundingClientRect().width || 800;
    const set = cssWidth * dpr > sets[0].width * 1.15 ? sets[1] : sets[0];
    canvas.width = set.width;
    canvas.height = set.height;

    const frames: (HTMLImageElement | null)[] = new Array(count).fill(null);
    let disposed = false;
    let raf = 0;
    let readySent = false;
    let shown: HTMLImageElement | null = null;

    const nearest = (i: number) => {
      for (let d = 0; d < count; d++) {
        if (frames[i - d]) return frames[i - d];
        if (frames[i + d]) return frames[i + d];
      }
      return null;
    };

    const draw = () => {
      raf = 0;
      const i = Math.round(toFrame(store.get()) * (count - 1));
      const img = nearest(i);
      if (!img || img === shown) return;
      shown = img;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(draw);
    };

    // a few parallel requests at a time, in load order
    const order = loadOrder(count);
    let cursor = 0;
    const next = () => {
      if (disposed || cursor >= order.length) return;
      const i = order[cursor++];
      const img = new Image();
      img.decoding = "async";
      img.src = frameUrl(set.dir, i);
      img
        .decode()
        .then(() => {
          if (disposed) return;
          frames[i] = img;
          // ready once the first frame and a coarse pass through the sequence are in
          if (!readySent && frames[0] && cursor >= Math.ceil(count / 16) + 2) {
            readySent = true;
            onReady();
          }
          schedule();
        })
        .catch(() => {})
        .finally(next);
    };
    for (let k = 0; k < 4; k++) next();

    const unsubscribe = store.subscribe(schedule);
    return () => {
      disposed = true;
      unsubscribe();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [store, toFrame, onReady]);

  return <canvas ref={canvasRef} aria-hidden="true" className="block h-full w-full" />;
}
