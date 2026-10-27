import type { ClientRestaurant } from "@/content/clients";
import type { Dictionary } from "@/i18n/dictionaries";
import { Section } from "./Section";

const external = (url: string) => /^https?:\/\//.test(url);

/** Published restaurants, names only; each name opens that restaurant's menu. Hidden while there are none. */
export function OurWork({ t, restaurants }: { t: Dictionary["work"]; restaurants: ClientRestaurant[] }) {
  if (restaurants.length === 0) return null;
  return (
    <Section id="work" eyebrow={t.eyebrow} title={t.title}>
      <ul className="border-t border-cream/10">
        {restaurants.map((c) => (
          <li key={c.name} className="border-b border-cream/10">
            {c.menuUrl ? (
              <a
                href={c.menuUrl}
                {...(external(c.menuUrl) ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                aria-label={`${c.name} — ${t.open}`}
                className="group flex items-baseline justify-between gap-6 py-7 transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold sm:py-9"
              >
                <span className="font-serif text-[clamp(1.75rem,3.6vw,2.75rem)] leading-tight tracking-[-0.015em] text-cream transition-colors duration-300 group-hover:text-gold-bright">
                  {c.name}
                </span>
                <span aria-hidden="true" className="text-[22px] text-gold/50 transition-[color,transform] duration-300 group-hover:translate-x-1 group-hover:text-gold">
                  →
                </span>
              </a>
            ) : (
              <span className="block py-7 font-serif text-[clamp(1.75rem,3.6vw,2.75rem)] leading-tight tracking-[-0.015em] text-cream sm:py-9">{c.name}</span>
            )}
          </li>
        ))}
      </ul>
    </Section>
  );
}
