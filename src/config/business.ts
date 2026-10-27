/**
 * MenuFlex business details, read from environment variables so real
 * contact information and pricing are configured, never hard-coded.
 * See `.env.example`. Anything left empty is simply not shown.
 */
const env = (v: string | undefined) => (v && v.trim() ? v.trim() : null);

const siteUrl = env(process.env.NEXT_PUBLIC_SITE_URL)?.replace(/\/+$/, "") ?? null;

export const business = {
  /** WhatsApp number in international format, digits only (e.g. 905xxxxxxxxx). */
  whatsapp: env(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER)?.replace(/\D/g, "") || null,
  /** Phone number as it should be dialled and shown (e.g. +90 5xx xxx xx xx). */
  phone: env(process.env.NEXT_PUBLIC_PHONE),
  email: env(process.env.NEXT_PUBLIC_EMAIL),
  /** Public address of this website, used for absolute links. */
  siteUrl,
  /**
   * Where the hero's demonstration QR code leads. Defaults to this site's
   * example menu; without a site URL it is derived from the visitor's address.
   */
  demoMenuUrl: env(process.env.NEXT_PUBLIC_DEMO_MENU_URL) ?? (siteUrl ? `${siteUrl}/demo/liman/` : null),
  /** The single subscription: price as displayed (e.g. "₺1.500") and its billing period. */
  price: env(process.env.NEXT_PUBLIC_SUBSCRIPTION_PRICE),
  pricePeriod: (env(process.env.NEXT_PUBLIC_SUBSCRIPTION_PERIOD) ?? "month") as "month" | "year",
} as const;

/** Path of the example digital menu on this site. */
export const DEMO_MENU_PATH = "/demo/liman/";

export function whatsappLink(text?: string) {
  if (!business.whatsapp) return null;
  return `https://wa.me/${business.whatsapp}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

export function phoneLink() {
  return business.phone ? `tel:${business.phone.replace(/[^\d+]/g, "")}` : null;
}

export function emailLink(subject?: string, body?: string) {
  if (!business.email) return null;
  const q = new URLSearchParams();
  if (subject) q.set("subject", subject);
  if (body) q.set("body", body);
  const qs = q.toString().replace(/\+/g, "%20");
  return `mailto:${business.email}${qs ? `?${qs}` : ""}`;
}
