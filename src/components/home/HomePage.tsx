import { Hero } from "@/components/hero/Hero";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Contact } from "@/components/sections/Contact";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { OurWork } from "@/components/sections/OurWork";
import { Pricing } from "@/components/sections/Pricing";
import { publishedClients } from "@/content/clients";
import { dictionaries, homePath, type Locale } from "@/i18n/dictionaries";

export function HomePage({ locale }: { locale: Locale }) {
  const t = dictionaries[locale];
  const home = homePath[locale];
  // links to Our Work only exist while the section does
  const workHref = publishedClients.length > 0 ? `${home}#work` : null;
  return (
    <>
      <SiteHeader locale={locale} t={t} workHref={workHref} />
      <main>
        <Hero t={t} workHref={workHref} />
        <OurWork t={t.work} />
        <HowItWorks t={t.how} />
        <Pricing t={t.pricing} contactHref={`${home}#contact`} />
        <Contact t={t.contact} />
      </main>
      <SiteFooter t={t} home={home} />
    </>
  );
}
