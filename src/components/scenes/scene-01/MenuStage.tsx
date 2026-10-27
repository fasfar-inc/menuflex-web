"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { limanMenu } from "@/components/menu/limanMenu";
import { MenuObject } from "@/components/menu/MenuObject";
import type { BookFraming, BookPose } from "@/components/menu/three/BookScene";
import { CANVAS_VIEW } from "@/components/menu/three/canvasView";
import { bookRig } from "@/components/menu/three/bookRig";
import { gsap, useGSAP } from "@/lib/gsap";
import { useOpeningProgress } from "./OpeningSequence";

const BookCanvas = dynamic(() => import("@/components/menu/three/BookCanvas"), { ssr: false });

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const span = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));

/** Dissolve window from the approved photograph to the 3D menu. */
const DISSOLVE = [0.012, 0.085] as const;

// canvas box relative to the stage box
const { stage } = bookRig;
const canvasBox = {
  left: `${((CANVAS_VIEW.x - stage.x) / stage.width) * 100}%`,
  top: `${((CANVAS_VIEW.y - stage.y) / stage.height) * 100}%`,
  width: `${(CANVAS_VIEW.width / stage.width) * 100}%`,
  height: `${(CANVAS_VIEW.height / stage.height) * 100}%`,
};

const FRAMING_WIDE: BookFraming = { centerX: 1182, centerY: 470, width: 860 };

/** Below `lg` the stage is wider than the screen: centre the open spread on the viewport instead. */
function compactFraming(stageEl: HTMLElement): BookFraming {
  const r = stageEl.getBoundingClientRect();
  const vw = document.documentElement.clientWidth;
  const fx = (vw / 2 - r.left) / r.width;
  const fit = Math.min(0.88 * vw, 0.92 * r.width) / r.width;
  return { centerX: stage.x + fx * stage.width, centerY: 472, width: fit * stage.width };
}

/**
 * Scene 01 stage. Layers, back to front:
 *   1. studio backdrop (window light + leaf shadows, menu removed)
 *   2. contact shadow on the table, reacting to the menu's height
 *   3. the approved photograph of the menu (opening frame)
 *   4. the 3D LIMAN menu, which takes over as the visitor scrolls
 */
export function MenuStage() {
  const store = useOpeningProgress();
  const root = useRef<HTMLDivElement>(null);
  const floatRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const shadowFade = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<HTMLDivElement>(null);
  const photoRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const ready = useRef(false);
  const idle = useRef<gsap.core.Timeline | null>(null);
  const [load3d, setLoad3d] = useState(false);
  const [framing, setFraming] = useState<BookFraming>(FRAMING_WIDE);

  // Load the 3D menu after first paint, only for visitors who will see it move.
  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: no-preference)");
    if (!motion.matches) return;
    const compact = window.matchMedia("(max-width: 1023.98px)");
    const pick = () => setFraming(compact.matches && root.current ? compactFraming(root.current) : FRAMING_WIDE);
    pick();
    window.addEventListener("resize", pick);
    const start = () => setLoad3d(true);
    const ric = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number })
      .requestIdleCallback;
    let handle: number | undefined;
    if (document.readyState === "complete") handle = ric ? ric(start, { timeout: 1500 }) : window.setTimeout(start, 300);
    else window.addEventListener("load", start, { once: true });
    return () => {
      window.removeEventListener("resize", pick);
      window.removeEventListener("load", start);
      if (handle) window.clearTimeout(handle);
    };
  }, []);

  const apply = useCallback(
    (p: number) => {
      const mix = ready.current ? span(p, DISSOLVE[0], DISSOLVE[1]) : 0;
      if (photoRef.current) photoRef.current.style.opacity = String(1 - mix);
      if (canvasRef.current) canvasRef.current.style.opacity = String(mix);
      if (shadowFade.current) shadowFade.current.style.opacity = String(1 - span(p, 0.02, 0.35));

      // hand the floating idle motion over to the scroll sequence
      const tl = idle.current;
      if (!tl) return;
      if (p > 0.001 && !tl.paused()) {
        tl.pause();
        gsap.to([floatRef.current, tiltRef.current], { x: 0, y: 0, rotation: 0, rotationX: 0, rotationY: 0, duration: 0.5, ease: "power2.out", overwrite: "auto" });
        gsap.to(shadowRef.current, { opacity: 1, scaleX: 1, filter: "blur(0px)", duration: 0.5, overwrite: "auto" });
      } else if (p <= 0.001 && tl.paused()) {
        tl.resume();
      }
    },
    [],
  );

  useEffect(() => store.subscribe(apply), [store, apply]);

  const onReady = useCallback(() => {
    ready.current = true;
    apply(store.get());
  }, [apply, store]);

  const onPose = useCallback((pose: BookPose) => {
    const el = photoRef.current;
    if (!el || el.style.opacity === "0") return;
    gsap.set(el, {
      xPercent: pose.dx * 100,
      yPercent: pose.dy * 100,
      scale: pose.scale,
      transformOrigin: `${pose.originX * 100}% ${pose.originY * 100}%`,
    });
  }, []);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(root.current, { autoAlpha: 0, duration: 1.4, ease: "power2.out", delay: 0.15 });
        gsap.from(floatRef.current, { y: 46, rotation: 1.2, duration: 1.8, ease: "power3.out", delay: 0.25 });
        gsap.from(shadowRef.current, { opacity: 0, scaleX: 0.8, duration: 1.8, ease: "power3.out", delay: 0.25 });

        // Idle drift: as the menu rises its shadow softens, spreads and fades.
        idle.current = gsap
          .timeline({ repeat: -1, yoyo: true, delay: 2, defaults: { duration: 4.5, ease: "sine.inOut" } })
          .to(floatRef.current, { y: -12, rotation: -0.5 }, 0)
          .to(shadowRef.current, { opacity: 0.62, scaleX: 1.06, filter: "blur(4px)" }, 0);
        if (store.get() > 0.001) idle.current.pause();
      });

      mm.add("(prefers-reduced-motion: no-preference) and (pointer: fine)", () => {
        const el = tiltRef.current;
        if (!el) return;
        const xTo = gsap.quickTo(el, "x", { duration: 1.2, ease: "power3.out" });
        const rxTo = gsap.quickTo(el, "rotationX", { duration: 1.2, ease: "power3.out" });
        const ryTo = gsap.quickTo(el, "rotationY", { duration: 1.2, ease: "power3.out" });

        const onMove = (e: PointerEvent) => {
          if (store.get() > 0.001) return;
          const nx = e.clientX / window.innerWidth - 0.5;
          const ny = e.clientY / window.innerHeight - 0.5;
          xTo(nx * 12);
          ryTo(nx * 3);
          rxTo(-ny * 3);
        };
        window.addEventListener("pointermove", onMove);
        return () => window.removeEventListener("pointermove", onMove);
      });

      return () => {
        idle.current = null;
        mm.revert();
      };
    },
    { scope: root },
  );

  const { stage: backdrop } = limanMenu;

  return (
    <div
      ref={root}
      className="relative w-full"
      style={{ aspectRatio: `${backdrop.width} / ${backdrop.height}` }}
    >
      <Image
        src={backdrop.src}
        alt=""
        fill
        priority
        sizes="(min-width: 1024px) 58vw, 100vw"
        className="select-none"
        draggable={false}
      />

      {/* Contact shadow: tight core under the cover edge, wider falloff under the pages */}
      <div ref={shadowFade} aria-hidden="true" className="absolute inset-0">
        <div ref={shadowRef} className="absolute inset-0 origin-[48%_96%]">
          <span className="absolute top-[89%] left-[6%] h-[8%] w-[46%] rotate-[16deg] rounded-[50%] bg-[radial-gradient(closest-side,rgba(74,56,38,0.46),rgba(74,56,38,0))] blur-[12px]" />
          <span className="absolute top-[96%] left-[42%] h-[6%] w-[38%] rotate-[2deg] rounded-[50%] bg-[radial-gradient(closest-side,rgba(74,56,38,0.42),rgba(74,56,38,0))] blur-[10px]" />
          <span className="absolute top-[90%] left-[0%] h-[18%] w-[86%] rotate-[7deg] rounded-[50%] bg-[radial-gradient(closest-side,rgba(96,74,50,0.2),rgba(96,74,50,0))] blur-[26px]" />
        </div>
      </div>

      <div className="absolute inset-0 [perspective:1600px]">
        <div ref={tiltRef} className="absolute inset-0">
          <div ref={floatRef} className="absolute inset-0 origin-[45%_90%] will-change-transform">
            <div ref={photoRef} data-menu-photo className="absolute inset-0 will-change-transform">
              <MenuObject />
            </div>
            {load3d && (
              <div
                ref={canvasRef}
                data-menu-3d
                className="menu-depth-3d absolute"
                style={{ ...canvasBox, opacity: 0 }}
              >
                <BookCanvas store={store} framing={framing} onReady={onReady} onPose={onPose} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
