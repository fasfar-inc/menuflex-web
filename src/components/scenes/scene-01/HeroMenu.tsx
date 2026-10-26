"use client";

import Image from "next/image";
import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

/**
 * The physical LIMAN menu. Currently a photographic render; in later scenes
 * this slot is where the paper-to-digital transformation will take over
 * (GSAP ScrollTrigger and/or an R3F model).
 */
export function HeroMenu() {
  const floatRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.fromTo(
        floatRef.current,
        { autoAlpha: 0, y: 40, scale: 0.97 },
        { autoAlpha: 1, y: 0, scale: 1, duration: 1.6, ease: "power3.out", delay: 0.25 },
      );

      // Slow idle drift so the menu feels suspended in the light.
      gsap.to(tiltRef.current, {
        y: -10,
        rotation: -0.6,
        duration: 4.5,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
      });
    });

    mm.add("(prefers-reduced-motion: no-preference) and (pointer: fine)", () => {
      const el = floatRef.current;
      if (!el) return;
      const xTo = gsap.quickTo(el, "x", { duration: 1.2, ease: "power3.out" });
      const yTo = gsap.quickTo(el, "rotationX", { duration: 1.2, ease: "power3.out" });
      const rTo = gsap.quickTo(el, "rotationY", { duration: 1.2, ease: "power3.out" });

      const onMove = (e: PointerEvent) => {
        const nx = e.clientX / window.innerWidth - 0.5;
        const ny = e.clientY / window.innerHeight - 0.5;
        xTo(nx * 14);
        rTo(nx * 3);
        yTo(-ny * 3);
      };
      window.addEventListener("pointermove", onMove);
      return () => window.removeEventListener("pointermove", onMove);
    });

    return () => mm.revert();
  });

  return (
    <div className="[perspective:1600px]">
      <div ref={floatRef} className="will-change-transform">
        <div ref={tiltRef}>
          <Image
            src="/scene-01/liman-menu.webp"
            alt="An open LIMAN Kitchen & Bar menu with grilled octopus on the cover, grilled sea bass and hand-cut tagliatelle inside"
            width={1458}
            height={1135}
            priority
            sizes="(min-width: 1024px) 58vw, 100vw"
            className="h-auto w-full select-none"
            draggable={false}
          />
        </div>
      </div>
    </div>
  );
}
