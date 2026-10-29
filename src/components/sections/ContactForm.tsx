"use client";

import { useState } from "react";
import { emailLink, whatsappLink } from "@/config/business";
import type { Dictionary } from "@/i18n/dictionaries";

const field =
  "mt-2 w-full rounded-xl border border-cream/15 bg-night-950/60 px-4 py-3 text-[15px] text-cream placeholder:text-cream-muted/70 transition-colors focus:border-gold/70 focus:outline-none";

/**
 * Short enquiry form. There is no server: the message opens in WhatsApp or
 * the visitor's mail app, addressed to the configured MenuFlex details.
 */
export function ContactForm({ t }: { t: Dictionary["contact"]["form"] }) {
  const [form, setForm] = useState({ name: "", restaurant: "", message: "" });
  const canWhatsapp = whatsappLink() !== null;
  const canEmail = emailLink() !== null;
  if (!canWhatsapp && !canEmail) return null;

  const text = () =>
    [t.intro, "", form.message.trim(), "", [form.name.trim(), form.restaurant.trim()].filter(Boolean).join(" — ")].join("\n").trim();

  const send = (via: "whatsapp" | "email") => {
    const href = via === "whatsapp" ? whatsappLink(text()) : emailLink(t.subject, text());
    if (!href) return;
    if (via === "whatsapp") window.open(href, "_blank", "noopener,noreferrer");
    else window.location.href = href;
  };

  return (
    <form
      className="rounded-2xl border border-cream/10 bg-night-900/70 p-6 sm:p-8"
      onSubmit={(e) => {
        e.preventDefault();
        send(canWhatsapp ? "whatsapp" : "email");
      }}
    >
      <h3 className="font-serif text-[24px] text-cream">{t.title}</h3>
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <label className="block text-[13px] font-medium tracking-[0.04em] text-cream-soft">
          {t.name}
          <input className={field} name="name" autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </label>
        <label className="block text-[13px] font-medium tracking-[0.04em] text-cream-soft">
          {t.restaurant}
          <input className={field} name="restaurant" autoComplete="organization" value={form.restaurant} onChange={(e) => setForm({ ...form, restaurant: e.target.value })} />
        </label>
      </div>
      <label className="mt-5 block text-[13px] font-medium tracking-[0.04em] text-cream-soft">
        {t.message}
        <textarea
          className={`${field} min-h-[120px] resize-y`}
          name="message"
          required
          placeholder={t.placeholder}
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
        />
      </label>
      <div className="mt-6 flex flex-wrap gap-3">
        {canWhatsapp && (
          <button type="submit" className="h-[50px] rounded-full bg-gold px-7 text-[15px] font-medium text-night-950 transition-colors hover:bg-gold-bright">
            {t.viaWhatsapp}
          </button>
        )}
        {canEmail && (
          <button
            type={canWhatsapp ? "button" : "submit"}
            onClick={canWhatsapp ? (e) => e.currentTarget.form?.reportValidity() && send("email") : undefined}
            className={
              canWhatsapp
                ? "h-[50px] rounded-full border border-gold/70 px-7 text-[15px] font-medium text-cream transition-colors hover:bg-gold/10"
                : "h-[50px] rounded-full bg-gold px-7 text-[15px] font-medium text-night-950 transition-colors hover:bg-gold-bright"
            }
          >
            {t.viaEmail}
          </button>
        )}
      </div>
    </form>
  );
}
