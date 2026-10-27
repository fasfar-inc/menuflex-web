import { CheckIcon } from "@/components/ui/icons";
import { business } from "@/config/business";
import type { Dictionary } from "@/i18n/dictionaries";
import { Section } from "./Section";

/** The single MenuFlex subscription, at the configured price. */
export function Pricing({ t, contactHref }: { t: Dictionary["pricing"]; contactHref: string | null }) {
  return (
    <Section id="pricing" eyebrow={t.eyebrow} title={t.title} intro={t.body} split>
      <div className="max-w-[560px] rounded-3xl border border-gold/40 bg-[linear-gradient(160deg,#211c17_0%,#15120f_70%)] p-8 shadow-[0_0_60px_-30px_rgba(214,150,70,0.6)] sm:p-10">
        {business.price ? (
          <p className="flex items-baseline gap-3">
            <span className="font-serif text-[clamp(2.75rem,6vw,3.5rem)] leading-none text-cream">{business.price}</span>
            <span className="text-[15px] text-cream-muted">{t.period[business.pricePeriod]}</span>
          </p>
        ) : (
          <p className="font-serif text-[26px] leading-snug text-cream">{t.ask}</p>
        )}
        <ul className="mt-8 space-y-3.5">
          {t.features.map((f) => (
            <li key={f} className="flex gap-3 text-[15px] leading-[1.5] text-cream-soft">
              <CheckIcon className="mt-[3px] h-4 w-4 shrink-0 text-gold" />
              {f}
            </li>
          ))}
        </ul>
        {contactHref && (
          <a
            href={contactHref}
            className="mt-9 inline-flex h-[52px] items-center rounded-full bg-gold px-8 text-[16px] font-medium text-night-950 transition-colors duration-300 hover:bg-gold-bright focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
          >
            {t.cta}
          </a>
        )}
      </div>
    </Section>
  );
}
