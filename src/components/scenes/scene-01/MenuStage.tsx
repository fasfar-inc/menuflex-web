"use client";

import Image from "next/image";
import { useRef } from "react";
import { limanMenu } from "@/components/menu/limanMenu";
import { MenuObject } from "@/components/menu/MenuObject";
import { gsap, useGSAP } from "@/lib/gsap";

/**
 * Scene 01 stage, three independent layers:
 *   1. studio backdrop (window light + leaf shadows, menu removed)
 *   2. contact shadow on the table, reacting to the menu's height
 *   3. the menu object itself
 */
export function MenuStage() {
  const root = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(root.current, { autoAlpha: 0, duration: 1.4, ease: "power2.out", delay: 0.15 });
        gsap.from(menuRef.current, { y: 46, rotation: 1.2, duration: 1.8, ease: "power3.out", delay: 0.25 });
        gsap.from(shadowRef.current, { opacity: 0, scaleX: 0.8, duration: 1.8, ease: "power3.out", delay: 0.25 });

        // Idle drift: as the menu rises its shadow softens, spreads and fades.
        gsap
          .timeline({ repeat: -1, yoyo: true, delay: 2, defaults: { duration: 4.5, ease: "sine.inOut" } })
          .to(menuRef.current, { y: -12, rotation: -0.5 }, 0)
          .to(shadowRef.current, { opacity: 0.62, scaleX: 1.06, filter: "blur(4px)" }, 0);
      });

      mm.add("(prefers-reduced-motion: no-preference) and (pointer: fine)", () => {
        const el = tiltRef.current;
        if (!el) return;
        const xTo = gsap.quickTo(el, "x", { duration: 1.2, ease: "power3.out" });
        const rxTo = gsap.quickTo(el, "rotationX", { duration: 1.2, ease: "power3.out" });
        const ryTo = gsap.quickTo(el, "rotationY", { duration: 1.2, ease: "power3.out" });

        const onMove = (e: PointerEvent) => {
          const nx = e.clientX / window.innerWidth - 0.5;
          const ny = e.clientY / window.innerHeight - 0.5;
          xTo(nx * 12);
          ryTo(nx * 3);
          rxTo(-ny * 3);
        };
        window.addEventListener("pointermove", onMove);
        return () => window.removeEventListener("pointermove", onMove);
      });

      return () => mm.revert();
    },
    { scope: root },
  );

  const { stage } = limanMenu;

  return (
    <div
      ref={root}
      className="relative w-full"
      style={{ aspectRatio: `${stage.width} / ${stage.height}` }}
    >
      <Image
        src={stage.src}
        alt=""
        fill
        priority
        sizes="(min-width: 1024px) 58vw, 100vw"
        className="select-none"
        draggable={false}
      />

      {/* Contact shadow: tight core under the cover edge, wider falloff under the pages */}
      <div ref={shadowRef} aria-hidden="true" className="absolute inset-0 origin-[48%_96%]">
        <span className="absolute top-[89%] left-[6%] h-[8%] w-[46%] rotate-[16deg] rounded-[50%] bg-[radial-gradient(closest-side,rgba(74,56,38,0.46),rgba(74,56,38,0))] blur-[12px]" />
        <span className="absolute top-[96%] left-[42%] h-[6%] w-[38%] rotate-[2deg] rounded-[50%] bg-[radial-gradient(closest-side,rgba(74,56,38,0.42),rgba(74,56,38,0))] blur-[10px]" />
        <span className="absolute top-[90%] left-[0%] h-[18%] w-[86%] rotate-[7deg] rounded-[50%] bg-[radial-gradient(closest-side,rgba(96,74,50,0.2),rgba(96,74,50,0))] blur-[26px]" />
      </div>

      <div className="absolute inset-0 [perspective:1600px]">
        <div ref={tiltRef} className="absolute inset-0">
          <MenuObject ref={menuRef} />
        </div>
      </div>
    </div>
  );
}
