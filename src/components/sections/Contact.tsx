import type { ReactNode } from "react";
import { MailIcon, PhoneIcon, WhatsAppIcon } from "@/components/ui/icons";
import { business, emailLink, hasContact, phoneLink, whatsappLink } from "@/config/business";
import type { Dictionary } from "@/i18n/dictionaries";
import { ContactForm } from "./ContactForm";
import { Section } from "./Section";

function Channel({ href, icon, label, value }: { href: string; icon: ReactNode; label: string; value: string }) {
  const external = href.startsWith("https://");
  return (
    <li className="border-b border-cream/10 last:border-b-0">
      <a
        href={href}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        className="group flex min-h-[76px] items-center gap-4 px-5 py-4 transition-colors duration-300 hover:bg-gold/[0.04] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-gold sm:gap-5 sm:px-7"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gold/40 text-gold">{icon}</span>
        <span className="min-w-0 flex-1">
          <span className="block text-[12px] font-medium tracking-[0.2em] text-cream-muted uppercase">{label}</span>
          <span className="mt-1 block font-serif text-[19px] break-words text-cream transition-colors group-hover:text-gold-bright sm:text-[21px]">{value}</span>
        </span>
        <span aria-hidden="true" className="text-[20px] text-gold/50 transition-[color,transform] duration-300 group-hover:translate-x-1 group-hover:text-gold">
          →
        </span>
      </a>
    </li>
  );
}

/** How to reach MenuFlex: the configured channels and a short form. Hidden until a channel is configured. */
export function Contact({ t }: { t: Dictionary["contact"] }) {
  if (!hasContact) return null;
  const wa = whatsappLink();
  const tel = phoneLink();
  const mail = emailLink();
  return (
    <Section id="contact" eyebrow={t.eyebrow} title={t.title} intro={t.body} split>
      <div className="grid gap-6">
        <ul className="overflow-hidden rounded-2xl border border-gold/25 bg-night-900/70">
          {wa && <Channel href={wa} icon={<WhatsAppIcon className="h-5 w-5" />} label={t.whatsapp} value={`+${business.whatsapp}`} />}
          {tel && <Channel href={tel} icon={<PhoneIcon className="h-[18px] w-[18px]" />} label={t.phone} value={business.phone!} />}
          {mail && <Channel href={mail} icon={<MailIcon className="h-5 w-5" />} label={t.email} value={business.email!} />}
        </ul>
        <ContactForm t={t.form} />
      </div>
    </Section>
  );
}
