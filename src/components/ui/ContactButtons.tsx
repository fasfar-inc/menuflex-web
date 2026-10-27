import type { ReactNode } from "react";
import { emailLink, phoneLink, whatsappLink } from "@/config/business";
import type { Dictionary } from "@/i18n/dictionaries";
import { MailIcon, PhoneIcon, WhatsAppIcon } from "./icons";

// phones: equal buttons on one row; desktop hero: design-pixel sizes (--u)
const base =
  "group inline-flex h-[48px] items-center justify-center gap-2 rounded-[12px] border px-2 text-[14px] font-medium whitespace-nowrap transition-[background-color,border-color,transform] duration-300 hover:-translate-y-px focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold sm:gap-3 sm:px-6 sm:text-[15px] xl:h-[calc(var(--u)*50)] xl:gap-[calc(var(--u)*13)] xl:rounded-[calc(var(--u)*12)] xl:px-[calc(var(--u)*23)] xl:text-[calc(var(--u)*16)]";

function Action({ href, className, children }: { href: string; className: string; children: ReactNode }) {
  const external = href.startsWith("https://");
  return (
    <a href={href} className={`${base} ${className}`} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
      {children}
    </a>
  );
}

/**
 * WhatsApp, Call and Email, wired to the configured business details. Each
 * button appears only once its detail is configured, so none is ever a dead end.
 */
export function ContactButtons({ t, className = "", style }: { t: Dictionary["hero"]; className?: string; style?: React.CSSProperties }) {
  const wa = whatsappLink();
  const tel = phoneLink();
  const mail = emailLink();
  if (!wa && !tel && !mail) return null;
  return (
    <div className={`grid auto-cols-fr grid-flow-col gap-2 sm:flex sm:flex-wrap sm:gap-4 xl:gap-[calc(var(--u)*22)] ${className}`} style={style}>
      {wa && (
        <Action href={wa} className="border-whatsapp/80 bg-whatsapp/[0.06] text-[#b9f1cc] hover:border-whatsapp hover:bg-whatsapp/[0.14]">
          <WhatsAppIcon className="h-5 w-5 shrink-0 text-whatsapp xl:h-[calc(var(--u)*21)] xl:w-[calc(var(--u)*21)]" />
          {t.whatsapp}
        </Action>
      )}
      {tel && (
        <Action href={tel} className="border-gold/70 text-cream hover:border-gold-bright hover:bg-gold/10">
          <PhoneIcon className="h-[18px] w-[18px] shrink-0 text-gold xl:h-[calc(var(--u)*19)] xl:w-[calc(var(--u)*19)]" />
          {t.call}
        </Action>
      )}
      {mail && (
        <Action href={mail} className="border-gold/70 text-cream hover:border-gold-bright hover:bg-gold/10">
          <MailIcon className="h-5 w-5 shrink-0 text-gold xl:h-[calc(var(--u)*21)] xl:w-[calc(var(--u)*21)]" />
          {t.email}
        </Action>
      )}
    </div>
  );
}
