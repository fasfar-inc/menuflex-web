import { Hero } from "@/components/hero/Hero";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Contact } from "@/components/sections/Contact";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { OurWork } from "@/components/sections/OurWork";
import { Pricing } from "@/components/sections/Pricing";
import { dictionaries, homePath, type Locale } from "@/i18n/dictionaries";

export function HomePage({ locale }: { locale: Locale }) {
  const t = dictionaries[locale];
  const home = homePath[locale];
  return (
    <>
      <SiteHeader locale={locale} t={t} />
      <main>
        <Hero t={t} workHref={`${home}#work`} />
        <OurWork t={t.work} locale={locale} />
        <HowItWorks t={t.how} />
        <Pricing t={t.pricing} contactHref={`${home}#contact`} />
        <Contact t={t.contact} />
      </main>
      <SiteFooter t={t} home={home} />
    </>
  );
}
