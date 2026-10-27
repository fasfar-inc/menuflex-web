import Link from "next/link";
import { ContactButtons } from "@/components/ui/ContactButtons";
import { ChevronIcon } from "@/components/ui/icons";
import type { Dictionary } from "@/i18n/dictionaries";
import { MenuConstellation } from "./MenuConstellation";
import { MenuConstellationMobile } from "./MenuConstellationMobile";

const delay = (s: number) => ({ "--delay": `${s}s` }) as React.CSSProperties;

/**
 * Homepage hero. On desktop it is the approved design as one canvas: every
 * size and position is in design pixels (`--u`, see globals.css), so text and
 * menus keep the reference proportions at any viewport. Phones and tablets get
 * their own stacked layout.
 */
export function Hero({ t, workHref }: { t: Dictionary; workHref: string | null }) {
  const h = t.hero;
  return (
    <section aria-labelledby="hero-title" className="stone-backdrop relative isolate overflow-hidden xl:min-h-[100svh]">
      <div className="relative mx-auto px-5 pt-[112px] pb-14 sm:px-8 lg:grid lg:max-w-[1180px] lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-12 lg:px-12 lg:pt-[120px] lg:pb-16 xl:block xl:max-w-none xl:h-[calc(var(--u)*1055)] xl:w-[calc(var(--u)*1491)] xl:p-0">
        <div className="relative z-10 max-w-[560px] lg:max-w-[520px] xl:absolute xl:top-[calc(var(--u)*188)] xl:left-[calc(var(--u)*77)] xl:max-w-none">
          <p
            className="anim-rise flex flex-wrap items-center gap-x-4 text-[11px] font-medium tracking-[0.34em] uppercase sm:text-[12px] xl:gap-x-[calc(var(--u)*18)] xl:text-[calc(var(--u)*13.5)]"
            style={delay(0.1)}
          >
            <span className="text-gold">{h.eyebrow[0]}</span>
            <span aria-hidden="true" className="text-cream-muted">•</span>
            <span className="text-cream-soft">{h.eyebrow[1]}</span>
          </p>

          <h1
            id="hero-title"
            className="mt-6 font-serif text-[clamp(2.75rem,11vw,4rem)] leading-[1.04] font-medium tracking-[-0.025em] xl:mt-[calc(var(--u)*24)] xl:text-[calc(var(--u)*77)] xl:leading-[1.06] xl:whitespace-nowrap"
          >
            <span className="anim-rise block text-cream" style={delay(0.2)}>
              {h.title[0]}
            </span>
            <span className="anim-rise block text-gold" style={delay(0.3)}>
              {h.title[1]}
            </span>
          </h1>

          <p
            className="anim-rise mt-6 max-w-[34em] text-[16px] leading-[1.6] font-light text-cream-soft sm:text-[17px] xl:mt-[calc(var(--u)*22)] xl:w-[calc(var(--u)*440)] xl:max-w-none xl:text-[max(14px,calc(var(--u)*19.5))]"
            style={delay(0.4)}
          >
            {h.body}
          </p>

          <ContactButtons t={h} className="anim-rise mt-8 xl:mt-[calc(var(--u)*38)]" style={delay(0.5)} />

          {workHref && (
            <div className="anim-rise mt-5 xl:mt-[calc(var(--u)*40)]" style={delay(0.6)}>
              <Link
                href={workHref}
                className="group inline-flex h-[54px] items-center gap-6 rounded-full border border-gold/80 px-8 text-[16px] font-medium text-cream transition-[background-color,border-color] duration-300 hover:border-gold-bright hover:bg-gold/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold xl:h-[calc(var(--u)*55)] xl:gap-[calc(var(--u)*26)] xl:px-[calc(var(--u)*33)] xl:text-[calc(var(--u)*18)]"
              >
                {h.explore}
                <ChevronIcon className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>
          )}
        </div>

        {/* desktop: the full composition on the right of the canvas */}
        <MenuConstellation t={t} className="absolute top-[calc(var(--u)*80)] left-[calc(var(--u)*500)] hidden w-[calc(var(--u)*991)] xl:block" />

        {/* phones and tablets: QR code first, menus in pairs below */}
        <MenuConstellationMobile t={t} className="mx-auto mt-14 w-full max-w-[460px] lg:mt-0 lg:w-[min(420px,calc((100svh-150px)*0.6))] xl:hidden" />
      </div>
    </section>
  );
}
