import { Wordmark } from "@/components/brand/BrandLogo";

/** Fine film grain, so the dark never reads as a flat fill. */
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 0.85 0 0 0 0 0.6 0 0 0 0.55 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

/**
 * Behind the menu: one even dark, a large soft MenuFlex wordmark and a fine
 * grain. Drawn here, nothing to download; it sits behind everything and takes
 * no taps.
 */
export function MenuBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-x-0 top-[40%] flex -translate-y-1/2 justify-center">
        <Wordmark className="text-[min(40vw,240px)] text-gold-bright opacity-[0.16] blur-[4px]" />
      </div>
      <span className="absolute inset-0 opacity-[0.06] mix-blend-overlay" style={{ backgroundImage: GRAIN }} />
    </div>
  );
}
