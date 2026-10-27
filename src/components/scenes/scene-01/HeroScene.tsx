"use client";

import { useRef } from "react";
import { ArrowIcon, Button } from "@/components/ui/Button";
import { heroCopy } from "@/content/site";
import { gsap, useGSAP } from "@/lib/gsap";
import { HeadlineUnderline } from "./HeadlineUnderline";
import { MenuStage } from "./MenuStage";
import { SceneProgress } from "./SceneProgress";

/**
 * Scene 01 — "Paper". The opening frame of the homepage story.
 */
export function HeroScene() {
  const root = useRef<HTMLElement>(null);
  const [line1, line2, line3] = heroCopy.headline;

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap
          .timeline({ defaults: { ease: "power3.out" } })
          .from("[data-reveal]", { autoAlpha: 0, y: 28, duration: 1.1, stagger: 0.09 })
          .fromTo(
            "[data-underline]",
            { strokeDasharray: 1, strokeDashoffset: 1 },
            { strokeDashoffset: 0, duration: 1.1, ease: "power2.inOut" },
            "-=0.6",
          );
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      id="scene-paper"
      aria-labelledby="hero-title"
      className="studio-backdrop relative isolate flex flex-col overflow-hidden lg:block lg:h-[100svh] lg:min-h-[680px]"
    >
      {/* Menu stage — sits on the right half and bleeds off the edge on desktop */}
      <div data-menu-pin className="pointer-events-none relative z-0 mx-auto mt-2 w-[118%] max-w-none -translate-x-[4%] sm:w-[96%] sm:translate-x-[4%] lg:absolute lg:top-1/2 lg:right-0 lg:mt-0 lg:w-[min(58vw,calc(128svh-230px))] lg:translate-x-0 lg:-translate-y-[47%] order-2">
        <MenuStage />
      </div>

      <div className="relative z-10 order-1 mx-auto flex h-full w-full max-w-[1680px] flex-col px-5 pt-[120px] sm:px-8 lg:justify-center lg:px-[10%] lg:pt-[40px]">
        <div className="max-w-[560px] lg:max-w-[40vw]">
          <p data-reveal className="mb-8 text-[11px] font-medium tracking-[0.3em] text-ink-soft uppercase sm:text-[12px] sm:tracking-[0.42em] lg:mb-[2.6vw]">
            {heroCopy.eyebrow}
          </p>

          <h1
            id="hero-title"
            className="font-serif text-[clamp(3.4rem,6.3vw,7.4rem)] leading-[0.94] font-[550] tracking-[-0.045em] text-ink"
          >
            <span data-reveal className="block">{line1}</span>
            <span data-reveal className="block">{line2}</span>
            <span data-reveal className="relative inline-block">
              {line3}
              <HeadlineUnderline className="absolute top-[calc(100%+0.015em)] left-[0.02em] h-[0.16em] w-[86%]" />
            </span>
          </h1>

          <p data-reveal className="mt-[clamp(2.25rem,3.2vw,3.25rem)] text-[clamp(1.15rem,1.45vw,1.5rem)] leading-[1.32] font-light tracking-[-0.01em] text-ink-soft">
            {heroCopy.supporting[0]}
            <br />
            {heroCopy.supporting[1]}
          </p>

          <div data-reveal className="mt-[clamp(2rem,2.6vw,2.75rem)] flex flex-wrap gap-4 sm:gap-5">
            <Button href={heroCopy.primaryCta.href} variant="primary" className="min-w-[240px]">
              {heroCopy.primaryCta.label}
              <ArrowIcon />
            </Button>
            <Button href={heroCopy.secondaryCta.href} variant="outline" className="min-w-[240px]">
              {heroCopy.secondaryCta.label}
            </Button>
          </div>
        </div>
      </div>

      {/* Footer rail: scroll hint + chapter indicator */}
      <div className="relative z-10 order-3 mx-auto flex w-full max-w-[1680px] flex-col items-start gap-7 md:flex-row md:items-end md:justify-between md:gap-6 px-5 pt-6 pb-8 sm:px-8 lg:absolute lg:inset-x-0 lg:bottom-0 lg:px-[10%] lg:pb-[44px] 2xl:pr-[56px]">
        <div data-reveal>
          <div data-scroll-hint className="flex items-center gap-5 text-[12px] text-ink-soft">
            <span aria-hidden="true" className="h-10 w-px bg-ink/25" />
            {heroCopy.scrollHint}
          </div>
        </div>
        <div data-reveal className="w-full md:w-auto">
          <SceneProgress active={0} />
        </div>
      </div>
    </section>
  );
}
