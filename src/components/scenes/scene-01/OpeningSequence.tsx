"use client";

import { createContext, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { createProgressStore, type ProgressStore } from "@/lib/progressStore";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";

type Sequence = {
  /** Paper: the LIMAN menu opening (0–1). */
  opening: ProgressStore;
  /** Paper to digital: the open menu becoming the phone menu (0–1). */
  digital: ProgressStore;
  /** Reduced motion: no camera moves, the scene cross-fades instead. */
  reduced: boolean;
};

const SequenceContext = createContext<Sequence | null>(null);

export function useSequence() {
  const seq = useContext(SequenceContext);
  if (!seq) throw new Error("useSequence must be used inside <OpeningSequence>");
  return seq;
}

/** Scroll progress (0–1) of the menu opening. */
export function useOpeningProgress() {
  return useSequence().opening;
}

/**
 * Pins the first screen and maps scroll distance to the two chapters of the
 * story: the menu opening, then its transformation into the digital menu.
 * Pinned distances are in viewport heights. Desktop pins the whole first
 * screen (header + hero); below `lg` the hero is taller than the viewport, so
 * only the menu stage is pinned.
 */
const DISTANCE = {
  wide: { opening: 1.4, digital: 1.8 },
  compact: { opening: 1.1, digital: 1.6 },
  reduced: { digital: 1.0 },
} as const;

export function OpeningSequence({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const opening = useMemo(() => createProgressStore(0), []);
  const digital = useMemo(() => createProgressStore(0), []);
  const [reduced, setReduced] = useState(false);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      const build = (trigger: Element, start: string, d: { opening?: number; digital: number }) => {
        const total = (d.opening ?? 0) + d.digital;
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger,
            pin: true,
            pinSpacing: true,
            start,
            end: `+=${Math.round(total * 100)}%`,
            scrub: 0.9,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });
        const a = { p: 0 };
        const b = { p: 0 };
        if (d.opening) {
          tl.to(a, { p: 1, duration: d.opening, onUpdate: () => opening.set(a.p) }, 0);
          tl.to("[data-scroll-hint]", { autoAlpha: 0, y: 8, duration: 0.12 * d.opening }, 0.02 * d.opening);
        }
        tl.to(b, { p: 1, duration: d.digital, onUpdate: () => digital.set(b.p) }, d.opening ?? 0);
        return () => {
          opening.set(0);
          digital.set(0);
        };
      };

      mm.add("(prefers-reduced-motion: no-preference) and (min-width: 1024px)", () =>
        build(root.current!, "top top", DISTANCE.wide),
      );
      mm.add("(prefers-reduced-motion: no-preference) and (max-width: 1023.98px)", () => {
        const stage = root.current!.querySelector("[data-menu-pin]");
        return stage ? build(stage, "center center", DISTANCE.compact) : undefined;
      });
      mm.add("(prefers-reduced-motion: reduce)", () => {
        setReduced(true);
        const wide = window.matchMedia("(min-width: 1024px)").matches;
        const trigger = wide ? root.current! : root.current!.querySelector("[data-menu-pin]");
        const undo = trigger ? build(trigger, wide ? "top top" : "center center", DISTANCE.reduced) : undefined;
        return () => {
          setReduced(false);
          undo?.();
        };
      });

      // Fonts and images can change layout height after first paint.
      const refresh = () => ScrollTrigger.refresh();
      document.fonts?.ready.then(refresh);
      return () => mm.revert();
    },
    { scope: root },
  );

  const value = useMemo(() => ({ opening, digital, reduced }), [opening, digital, reduced]);

  return (
    <SequenceContext.Provider value={value}>
      <div ref={root} className="relative">
        {children}
      </div>
    </SequenceContext.Provider>
  );
}
