"use client";

import { useEffect, useRef } from "react";
import { DigitalMenu, SCREEN, type DigitalMenuHandle } from "@/components/digital-menu/DigitalMenu";
import { STAGE_VIEW } from "@/components/menu/sequence/openingFrames";
import { useSequence } from "@/components/scenes/scene-01/OpeningSequence";

/** Phone screen in the mockup frame; the rendered camera move ends with the MAINS column filling it. */
export const PHONE_SCREEN = { x: 1036, y: 146, width: 308, height: 660 } as const;

/** Device frame around the 390x836 logical screen. */
const BEZEL = 13;
const RADIUS = 60;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const span = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
const smoother = (t: number) => t * t * t * (t * (6 * t - 15) + 10);

/** Timeline of the paper-to-digital chapter (digital progress, 0–1). */
export const DIGITAL = {
  frames: [0, 0.62] as const, // rendered camera move into the MAINS column
  ui: [0.57, 0.65] as const, // HTML page fades in over the rendered column
  render: [0.63, 0.71] as const, // rendered menu fades out
  morph: [0.66, 0.88] as const, // paper becomes the dark digital menu
  device: [0.7, 0.86] as const, // phone frame forms around the screen
  grow: [0.78, 0.96] as const, // small screens: phone grows to fit the viewport
  interactive: 0.975,
};

const box = {
  left: `${((PHONE_SCREEN.x - STAGE_VIEW.x) / STAGE_VIEW.width) * 100}%`,
  top: `${((PHONE_SCREEN.y - STAGE_VIEW.y) / STAGE_VIEW.height) * 100}%`,
  width: `${(PHONE_SCREEN.width / STAGE_VIEW.width) * 100}%`,
  height: `${(PHONE_SCREEN.height / STAGE_VIEW.height) * 100}%`,
};

/**
 * The phone that emerges from the printed page. It sits exactly over the
 * MAINS column of the last rendered frame, then the paper turns into the
 * digital menu and the device forms around it.
 */
export function PhoneReveal() {
  const { digital, reduced } = useSequence();
  const wrap = useRef<HTMLDivElement>(null);
  const scaler = useRef<HTMLDivElement>(null);
  const screen = useRef<HTMLDivElement>(null);
  const device = useRef<HTMLDivElement>(null);
  const island = useRef<HTMLDivElement>(null);
  const menu = useRef<DigitalMenuHandle>(null);
  const fit = useRef({ k: 1, grow: 1 });

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;

    const measure = () => {
      // layout size, unaffected by the grow transform applied below
      const r = { width: el.offsetWidth, height: el.offsetHeight };
      // logical screen -> rendered screen box
      fit.current.k = r.width / SCREEN.width;
      // phones and tablets: grow the device to a comfortable size in the viewport
      const vw = document.documentElement.clientWidth;
      const vh = window.innerHeight;
      const wanted = Math.min(0.8 * vh - 2 * BEZEL, ((vw - 48) * SCREEN.height) / SCREEN.width - 2 * BEZEL, 760);
      fit.current.grow = window.matchMedia("(min-width: 1024px)").matches ? 1 : Math.max(1, wanted / r.height);
      apply(digital.get());
    };

    const apply = (q: number) => {
      const { k, grow } = fit.current;
      if (scaler.current) scaler.current.style.transform = `scale(${k})`;
      const m = reduced ? 1 : smoother(span(q, ...DIGITAL.morph));
      menu.current?.setMorph(m);

      const ui = reduced ? span(q, 0.35, 0.65) : span(q, ...DIGITAL.ui);
      el.style.opacity = String(ui);
      el.style.visibility = ui > 0 ? "visible" : "hidden";

      const dv = reduced ? 1 : smoother(span(q, ...DIGITAL.device));
      if (device.current) {
        device.current.style.opacity = String(dv);
        device.current.style.transform = `scale(${1.045 - 0.045 * dv})`;
      }
      if (island.current) island.current.style.opacity = String(dv);
      if (screen.current) {
        const radius = reduced ? RADIUS - BEZEL : (RADIUS - BEZEL) * smoother(span(q, DIGITAL.morph[0], DIGITAL.device[1]));
        screen.current.style.borderRadius = `${radius}px`;
      }
      const g = reduced ? grow : 1 + (grow - 1) * smoother(span(q, ...DIGITAL.grow));
      el.style.transform = g === 1 ? "" : `scale(${g})`;

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
    <div ref={wrap} data-phone className="absolute z-20 origin-center opacity-0" style={{ ...box, visibility: "hidden" }}>
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
        <div ref={screen} className="absolute inset-0 overflow-hidden" style={{ borderRadius: 0 }}>
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
