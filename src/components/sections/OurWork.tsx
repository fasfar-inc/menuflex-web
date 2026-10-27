import Image from "next/image";
import Link from "next/link";
import { ChevronIcon } from "@/components/ui/icons";
import { clients } from "@/content/clients";
import type { Dictionary, Locale } from "@/i18n/dictionaries";
import { Section } from "./Section";

/** Restaurants using MenuFlex; each card opens that restaurant's live menu. */
export function OurWork({ t, locale }: { t: Dictionary["work"]; locale: Locale }) {
  return (
    <Section id="work" eyebrow={t.eyebrow} title={t.title} intro={t.body}>
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {clients.map((c) => {
          const external = /^https?:\/\//.test(c.menuUrl);
          return (
            <li key={c.name}>
              <Link
                href={c.menuUrl}
                {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-cream/10 bg-night-900 transition-[border-color,transform] duration-300 hover:-translate-y-1 hover:border-gold/50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-[radial-gradient(70%_70%_at_50%_45%,#2b241d_0%,#15120f_100%)]">
                  <Image
                    src={c.image.src}
                    alt={c.image.alt}
                    fill
                    sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
                    className="object-contain p-6 transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                  />
                  {c.demo && (
                    <span className="absolute top-4 left-4 rounded-full border border-gold/60 bg-night-950/80 px-3 py-1 text-[11px] font-semibold tracking-[0.2em] text-gold uppercase backdrop-blur-sm">
                      {t.demo}
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="font-serif text-[24px] leading-tight text-cream">{c.name}</h3>
                  <p className="mt-2 flex-1 text-[15px] leading-[1.6] text-cream-muted">{c.note[locale]}</p>
                  <span className="mt-5 inline-flex items-center gap-2 text-[15px] font-medium text-gold">
                    {t.open}
                    <ChevronIcon className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
