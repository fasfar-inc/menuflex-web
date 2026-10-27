import { Hero } from "@/components/hero/Hero";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Contact } from "@/components/sections/Contact";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { OurWork } from "@/components/sections/OurWork";
import { Pricing } from "@/components/sections/Pricing";
import { hasContact } from "@/config/business";
import { publishedClients } from "@/content/clients";
import { dictionaries, homePath, type Locale } from "@/i18n/dictionaries";

export function HomePage({ locale }: { locale: Locale }) {
  const t = dictionaries[locale];
  const home = homePath[locale];
  // links to Our Work only exist while the section does
  const workHref = publishedClients.length > 0 ? `${home}#work` : null;
  // likewise Contact, which needs at least one configured channel
  const contactHref = hasContact ? `${home}#contact` : null;
  return (
    <>
      <SiteHeader locale={locale} t={t} workHref={workHref} contactHref={contactHref} />
      <main>
        <Hero t={t} workHref={workHref} />
        <OurWork t={t.work} />
        <HowItWorks t={t.how} />
        <Pricing t={t.pricing} contactHref={contactHref} />
        <Contact t={t.contact} />
      </main>
      <SiteFooter t={t} home={home} />
    </>
  );
}
