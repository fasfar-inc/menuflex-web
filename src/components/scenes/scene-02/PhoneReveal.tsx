"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { DigitalMenu, MENU_BG, SCREEN, mix, type DigitalMenuHandle } from "@/components/digital-menu/DigitalMenu";
import { PRINT_PAGE, STAGE_VIEW } from "@/components/menu/sequence/openingFrames";
import { useSequence } from "@/components/scenes/scene-01/OpeningSequence";
import { PAGE, PrintedPage, SCREEN_ON_PAGE } from "./PrintedPage";

/** Phone screen in the mockup frame at the end of the chapter (desktop size). */
export const PHONE_SCREEN = { x: 1036, y: 146, width: 308, height: 660 } as const;

/** Device frame around the 390x836 logical screen. */
const BEZEL = 13;
const RADIUS = 60;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const span = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
const smoother = (t: number) => t * t * t * (t * (6 * t - 15) + 10);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Timeline of the paper-to-digital chapter (digital progress, 0–1). */
export const DIGITAL = {
  frames: [0, 0.34] as const, // rendered: the open menu turns to face the viewer
  ui: [0.34, 0.39] as const, // HTML copy of the right-hand page fades in over its render
  blank: 0.4, // the book underneath switches to its blank-page frame
  lift: [0.4, 0.56] as const, // the page comes forward off the book
  book: [0.42, 0.68] as const, // the book falls back and fades
  print: [0.41, 0.53] as const, // the columns beside MAINS dissolve down the page
  shape: [0.44, 0.84] as const, // page -> phone screen: position, size and layout
  paper: [0.44, 0.6] as const, // rendered paper texture gives way to a flat surface
  color: [0.56, 0.86] as const, // paper becomes the dark digital menu
  corner: [0.6, 0.86] as const, // square page corners become the screen's
  device: [0.7, 0.88] as const, // phone frame forms around the screen
  interactive: 0.97,
};

// the phone screen on the printed page, in mockup-frame pixels
const printScreen = {
  x: PRINT_PAGE.x + SCREEN_ON_PAGE.u * PRINT_PAGE.width,
  y: PRINT_PAGE.y + SCREEN_ON_PAGE.v * PRINT_PAGE.height,
  width: (SCREEN.width / PAGE.width) * PRINT_PAGE.width,
};

const box = {
  left: `${((PHONE_SCREEN.x - STAGE_VIEW.x) / STAGE_VIEW.width) * 100}%`,
  top: `${((PHONE_SCREEN.y - STAGE_VIEW.y) / STAGE_VIEW.height) * 100}%`,
  width: `${(PHONE_SCREEN.width / STAGE_VIEW.width) * 100}%`,
  height: `${(PHONE_SCREEN.height / STAGE_VIEW.height) * 100}%`,
};

/**
 * The right-hand page of the printed menu becomes the phone. Once the book
 * faces the viewer, an exact HTML copy of the page takes over from the
 * render; the page then lifts off the book and reshapes into the phone
 * screen while its MAINS column becomes the live digital menu, the columns
 * beside it dissolve, the paper turns black and the device forms around it.
 */
export function PhoneReveal() {
  const { digital, reduced } = useSequence();
  const wrap = useRef<HTMLDivElement>(null);
  const scaler = useRef<HTMLDivElement>(null);
  const sheet = useRef<HTMLDivElement>(null);
  const texture = useRef<HTMLDivElement>(null);
  const print = useRef<HTMLDivElement>(null);
  const screen = useRef<HTMLDivElement>(null);
  const device = useRef<HTMLDivElement>(null);
  const island = useRef<HTMLDivElement>(null);
  const menu = useRef<DigitalMenuHandle>(null);
  const fit = useRef({ width: 1, height: 1, grow: 1 });

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;

    const measure = () => {
      // layout size of the final screen box, unaffected by the transforms applied below
      fit.current.width = el.offsetWidth;
      fit.current.height = el.offsetHeight;
      // phones and tablets: the finished phone grows to a comfortable size in the viewport
      const vw = document.documentElement.clientWidth;
      const vh = window.innerHeight;
      const wanted = Math.min(0.8 * vh - 2 * BEZEL, ((vw - 48) * SCREEN.height) / SCREEN.width - 2 * BEZEL, 760);
      fit.current.grow = window.matchMedia("(min-width: 1024px)").matches ? 1 : Math.max(1, wanted / el.offsetHeight);
      apply(digital.get());
    };

    const apply = (q: number) => {
      const { width: wf, height: hf, grow } = fit.current;
      const u = wf / PHONE_SCREEN.width; // CSS px per mockup-frame px
      const k = wf / SCREEN.width; // CSS px per logical px of the finished screen

      const s = reduced ? 1 : smoother(span(q, ...DIGITAL.shape));
      const m = reduced ? 1 : smoother(span(q, ...DIGITAL.color));
      const dv = reduced ? 1 : smoother(span(q, ...DIGITAL.device));
      const lift = reduced ? 0 : smoother(span(q, ...DIGITAL.lift));

      // screen box: from its place on the printed page to the finished (grown) phone
      const t0 = { x: (printScreen.x - PHONE_SCREEN.x) * u, y: (printScreen.y - PHONE_SCREEN.y) * u, s: printScreen.width / PHONE_SCREEN.width };
      const t1 = { x: ((1 - grow) * wf) / 2, y: ((1 - grow) * hf) / 2, s: grow };
      const tx = lerp(t0.x, t1.x, s);
      const ty = lerp(t0.y, t1.y, s);
      const ts = lerp(t0.s, t1.s, s);
      el.style.transform = `translate(${tx}px, ${ty}px) scale(${ts})`;
      if (scaler.current) scaler.current.style.transform = `scale(${k})`;

      // the page itself: from the printed page's outline to the screen's, in CSS px...
      const p0 = { x: (PRINT_PAGE.x - PHONE_SCREEN.x) * u, y: (PRINT_PAGE.y - PHONE_SCREEN.y) * u, w: PRINT_PAGE.width * u, h: PRINT_PAGE.height * u };
      const p1 = { x: t1.x, y: t1.y, w: wf * grow, h: hf * grow };
      // ...expressed in the screen's logical pixels
      const unit = ts * k;
      const radius = reduced ? RADIUS - BEZEL : (RADIUS - BEZEL) * smoother(span(q, ...DIGITAL.corner));
      const sh = sheet.current;
      if (sh) {
        sh.style.left = `${(lerp(p0.x, p1.x, s) - tx) / unit}px`;
        sh.style.top = `${(lerp(p0.y, p1.y, s) - ty) / unit}px`;
        sh.style.width = `${lerp(p0.w, p1.w, s) / unit}px`;
        sh.style.height = `${lerp(p0.h, p1.h, s) / unit}px`;
        sh.style.borderRadius = `${radius}px`;
        sh.style.background = mix(...MENU_BG, m);
        const shadow = lift * (1 - dv);
        sh.style.boxShadow = shadow > 0 ? `0 ${26 * shadow}px ${56 * shadow}px -${14 * shadow}px rgb(40 30 20 / ${0.42 * shadow})` : "none";
      }
      if (texture.current) texture.current.style.opacity = String(reduced ? 0 : 1 - smoother(span(q, ...DIGITAL.paper)));
      if (print.current) {
        const gone = reduced ? 1 : smoother(span(q, ...DIGITAL.print));
        print.current.style.opacity = String(1 - gone);
        print.current.style.transform = `translateY(${36 * gone}px)`;
        print.current.style.visibility = gone < 1 ? "visible" : "hidden";
      }
      if (screen.current) screen.current.style.borderRadius = `${radius}px`;

      menu.current?.setLayout(s);
      menu.current?.setMorph(m);

      const ui = reduced ? span(q, 0.35, 0.65) : span(q, ...DIGITAL.ui);
      el.style.opacity = String(ui);
      el.style.visibility = ui > 0 ? "visible" : "hidden";

      if (device.current) {
        device.current.style.opacity = String(dv);
        device.current.style.transform = `scale(${1.045 - 0.045 * dv})`;
      }
      if (island.current) island.current.style.opacity = String(dv);

      // small screens: the chapter rail sits under the stage, so clear it before the phone grows over it
      const rail = document.querySelector<HTMLElement>("[data-footer-rail]");
      if (rail) {
        const r = grow > 1 ? 1 - span(q, reduced ? 0.35 : DIGITAL.shape[0] + 0.02, reduced ? 0.6 : DIGITAL.shape[0] + 0.16) : 1;
        rail.style.opacity = String(r);
        rail.style.visibility = r > 0 ? "visible" : "hidden";
      }

      const on = q >= DIGITAL.interactive;
      el.style.pointerEvents = on ? "auto" : "none";
      menu.current?.setInteractive(on);
    };

    const ro = new ResizeObserver(measure);
    ro.observe(el);
    measure();
    const unsub = digital.subscribe(apply);
    return () => {
      ro.disconnect();
      unsub();
    };
  }, [digital, reduced]);

  return (
    <div ref={wrap} data-phone className="absolute z-20 origin-top-left opacity-0 will-change-transform" style={{ ...box, visibility: "hidden" }}>
      {/* logical-size phone scaled to the screen box */}
      <div ref={scaler} className="absolute top-0 left-0 origin-top-left" style={{ width: SCREEN.width, height: SCREEN.height }}>
        <div
          ref={device}
          aria-hidden="true"
          className="pointer-events-none absolute opacity-0"
          style={{ left: -BEZEL, top: -BEZEL, width: SCREEN.width + 2 * BEZEL, height: SCREEN.height + 2 * BEZEL }}
        >
          <div
            className="absolute inset-0"
            style={{
              borderRadius: RADIUS,
              background: "linear-gradient(145deg, #3a3835 0%, #1b1a18 38%, #0d0c0b 62%, #2b2926 100%)",
              boxShadow:
                "inset 0 0 0 1.5px rgba(255,255,255,0.14), inset 0 0 0 4px #0a0a09, 0 2px 4px rgba(40,30,20,0.18), 0 30px 60px -18px rgba(40,30,20,0.45), 0 60px 120px -40px rgba(40,30,20,0.35)",
            }}
          />
          {/* side buttons */}
          <span className="absolute -left-[3px] top-[150px] h-[34px] w-[3px] rounded-l bg-[#2a2826]" />
          <span className="absolute -left-[3px] top-[205px] h-[58px] w-[3px] rounded-l bg-[#2a2826]" />
          <span className="absolute -left-[3px] top-[275px] h-[58px] w-[3px] rounded-l bg-[#2a2826]" />
          <span className="absolute -right-[3px] top-[230px] h-[90px] w-[3px] rounded-r bg-[#2a2826]" />
        </div>
        {/* the lifted page: rendered paper first, then the screen's surface */}
        <div ref={sheet} aria-hidden="true" className="pointer-events-none absolute">
          <div ref={texture} className="absolute inset-0 overflow-hidden" style={{ borderRadius: "inherit" }}>
            <Image src="/scene-01/opening/page-lift.webp" alt="" fill sizes="(min-width: 1024px) 26vw, 50vw" className="select-none" draggable={false} />
          </div>
          <PrintedPage ref={print} />
        </div>
        <div ref={screen} className="absolute inset-0 overflow-hidden" style={{ borderRadius: 0, "--menu-surface": "transparent" } as React.CSSProperties}>
          <DigitalMenu ref={menu} />
          {/* dynamic island arrives with the device */}
          <div
            ref={island}
            aria-hidden="true"
            className="pointer-events-none absolute top-[11px] left-1/2 z-20 h-[33px] w-[118px] -translate-x-1/2 rounded-full bg-black opacity-0"
          />
        </div>
      </div>
    </div>
  );
}
