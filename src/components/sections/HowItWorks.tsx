import type { Dictionary } from "@/i18n/dictionaries";
import { Section } from "./Section";

export function HowItWorks({ t }: { t: Dictionary["how"] }) {
  return (
    <Section id="how-it-works" eyebrow={t.eyebrow} title={t.title}>
      <ol className="grid gap-6 md:grid-cols-3">
        {t.steps.map((s, i) => (
          <li key={s.title} className="relative rounded-2xl border border-cream/10 bg-night-900/70 p-7 lg:p-8">
            <span className="font-serif text-[44px] leading-none text-gold">{String(i + 1).padStart(2, "0")}</span>
            <h3 className="mt-6 font-serif text-[23px] leading-snug text-cream">{s.title}</h3>
            <p className="mt-3 text-[15px] leading-[1.65] text-cream-muted">{s.body}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}
