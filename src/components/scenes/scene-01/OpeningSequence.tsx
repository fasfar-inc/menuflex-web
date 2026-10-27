"use client";

import { createContext, useContext, useMemo, useRef, type ReactNode } from "react";
import { createProgressStore, type ProgressStore } from "@/lib/progressStore";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";

const SequenceContext = createContext<ProgressStore | null>(null);

/** Scroll progress (0–1) of the menu opening sequence. */
export function useOpeningProgress() {
  const store = useContext(SequenceContext);
  if (!store) throw new Error("useOpeningProgress must be used inside <OpeningSequence>");
  return store;
}

/**
 * Pins the opening frame and maps scroll distance to a 0–1 progress value.
 * Desktop pins the whole first screen (header + hero); below `lg` the hero
 * is taller than the viewport, so only the menu stage is pinned.
 * Visitors who prefer reduced motion keep the static Scene 01 frame.
 */
export function OpeningSequence({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const store = useMemo(() => createProgressStore(0), []);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      const build = (trigger: Element, start: string, distance: string) => {
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger,
            pin: true,
            pinSpacing: true,
            start,
            end: distance,
            scrub: 0.9,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });
        const proxy = { p: 0 };
        tl.to(proxy, { p: 1, duration: 1, onUpdate: () => store.set(proxy.p) }, 0)
          .to("[data-scroll-hint]", { autoAlpha: 0, y: 8, duration: 0.12 }, 0.02);
        return () => {
          store.set(0);
        };
      };

      mm.add("(prefers-reduced-motion: no-preference) and (min-width: 1024px)", () =>
        build(root.current!, "top top", "+=140%"),
      );
      mm.add("(prefers-reduced-motion: no-preference) and (max-width: 1023.98px)", () => {
        const stage = root.current!.querySelector("[data-menu-pin]");
        return stage ? build(stage, "center center", "+=110%") : undefined;
      });

      // Fonts and images can change layout height after first paint.
      const refresh = () => ScrollTrigger.refresh();
      document.fonts?.ready.then(refresh);
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <SequenceContext.Provider value={store}>
      <div ref={root} className="relative">
        {children}
      </div>
    </SequenceContext.Provider>
  );
}
