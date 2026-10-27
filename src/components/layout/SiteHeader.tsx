"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { CloseIcon, MenuIcon } from "@/components/ui/icons";
import { homePath, type Dictionary, type Locale } from "@/i18n/dictionaries";

function LanguageSwitch({ locale, t }: { locale: Locale; t: Dictionary }) {
  return (
    <div role="group" aria-label={t.language.label} className="flex items-center gap-2 text-[15px] font-medium tracking-[0.04em] xl:text-[calc(var(--u)*17.5)]">
      {(["tr", "en"] as const).map((l, i) => (
        <span key={l} className="flex items-center gap-2">
          {i > 0 && <span aria-hidden="true" className="text-cream-muted">/</span>}
          <Link
            href={homePath[l]}
            hrefLang={l}
            lang={l}
            aria-label={t.language[l]}
            aria-current={l === locale ? "true" : undefined}
            className={l === locale ? "text-gold" : "text-cream-soft transition-colors hover:text-cream"}
          >
            {l.toUpperCase()}
          </Link>
        </span>
      ))}
    </div>
  );
}

export function SiteHeader({ locale, t, workHref }: { locale: Locale; t: Dictionary; workHref: string | null }) {
  const [open, setOpen] = useState(false);
  const home = homePath[locale];
  const links = [
    { label: t.nav.home, href: home, current: true },
    ...(workHref ? [{ label: t.nav.work, href: workHref }] : []),
    { label: t.nav.how, href: `${home}#how-it-works` },
    { label: t.nav.contact, href: `${home}#contact` },
  ];

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="anim-fade absolute inset-x-0 top-0 z-40">
      <div className="relative mx-auto flex h-[84px] items-center justify-between px-5 sm:px-8 xl:h-[calc(var(--u)*106)] xl:w-[calc(var(--u)*1491)] xl:px-[calc(var(--u)*77)] xl:pr-[calc(var(--u)*66)]">
        <BrandLogo href={home} />

        <nav aria-label="Primary" className="absolute left-[calc(var(--u)*511)] hidden xl:block">
          <ul className="flex items-center gap-[calc(var(--u)*66)] text-[max(14px,calc(var(--u)*17.5))]">
            {links.map((l) => (
              <li key={l.label}>
                <Link
                  href={l.href}
                  aria-current={l.current ? "page" : undefined}
                  className={`relative py-2 transition-colors ${
                    l.current
                      ? "text-gold after:absolute after:inset-x-0 after:-bottom-[6px] after:h-[2px] after:rounded-full after:bg-gold"
                      : "text-cream hover:text-gold-bright"
                  }`}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-5">
          <div className="hidden items-center gap-5 sm:flex xl:gap-[calc(var(--u)*25)]">
            <span aria-hidden="true" className="h-9 w-px bg-cream/25 xl:h-[calc(var(--u)*32)]" />
            <LanguageSwitch locale={locale} t={t} />
          </div>
          <button
            type="button"
            className="-mr-2 flex h-11 w-11 items-center justify-center rounded-full text-cream transition-colors hover:text-gold xl:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? t.nav.close : t.nav.menu}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {/* phones and tablets: a simple panel under the bar */}
      <div
        id="mobile-nav"
        hidden={!open}
        className="mx-4 rounded-2xl border border-gold/25 bg-night-900/95 p-2 shadow-[0_24px_50px_-20px_rgba(0,0,0,0.8)] backdrop-blur-md sm:mx-8 xl:hidden"
      >
        <ul className="flex flex-col">
          {links.map((l) => (
            <li key={l.label}>
              <Link
                href={l.href}
                onClick={() => setOpen(false)}
                className={`block rounded-xl px-4 py-3.5 text-[17px] transition-colors hover:bg-white/[0.04] ${l.current ? "text-gold" : "text-cream"}`}
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-1 border-t border-cream/10 px-4 pt-3 pb-2 sm:hidden">
          <LanguageSwitch locale={locale} t={t} />
        </div>
      </div>
    </header>
  );
}
