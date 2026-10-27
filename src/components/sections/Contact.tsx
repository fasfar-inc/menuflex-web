import type { ReactNode } from "react";
import { MailIcon, PhoneIcon, WhatsAppIcon } from "@/components/ui/icons";
import { business, emailLink, phoneLink, whatsappLink } from "@/config/business";
import type { Dictionary } from "@/i18n/dictionaries";
import { ContactForm } from "./ContactForm";
import { Section } from "./Section";

function Channel({ href, icon, label, value }: { href: string; icon: ReactNode; label: string; value: string }) {
  const external = href.startsWith("https://");
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="group flex items-center gap-4 rounded-2xl border border-cream/10 bg-night-900/70 p-5 transition-colors duration-300 hover:border-gold/50"
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-gold/40 text-gold">{icon}</span>
      <span className="min-w-0">
        <span className="block text-[12px] font-medium tracking-[0.2em] text-cream-muted uppercase">{label}</span>
        <span className="mt-1 block truncate text-[17px] text-cream group-hover:text-gold-bright">{value}</span>
      </span>
    </a>
  );
}

/** Contact channels from the configured business details, and a short form. */
export function Contact({ t }: { t: Dictionary["contact"] }) {
  const wa = whatsappLink();
  const tel = phoneLink();
  const mail = emailLink();
  const any = wa || tel || mail;
  return (
    <Section id="contact" eyebrow={t.eyebrow} title={t.title} intro={t.body} split>
      <div className="grid gap-6">
        <div className="grid gap-4">
          {wa && <Channel href={wa} icon={<WhatsAppIcon className="h-5 w-5" />} label={t.whatsapp} value={`+${business.whatsapp}`} />}
          {tel && <Channel href={tel} icon={<PhoneIcon className="h-[18px] w-[18px]" />} label={t.phone} value={business.phone!} />}
          {mail && <Channel href={mail} icon={<MailIcon className="h-5 w-5" />} label={t.email} value={business.email!} />}
          {!any && <p className="rounded-2xl border border-dashed border-cream/15 p-6 text-[15px] text-cream-muted">{t.unavailable}</p>}
        </div>
        <ContactForm t={t.form} />
      </div>
    </Section>
  );
}
