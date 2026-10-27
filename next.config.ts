import type { NextConfig } from "next";

// Business details the site needs before it is published (see .env.example).
// Missing ones are hidden on the site; the build lists them so none is forgotten.
const set = (key: string) => Boolean(process.env[key]?.trim());
const required = {
  [set("NEXT_PUBLIC_DEMO_MENU_URL") ? "NEXT_PUBLIC_DEMO_MENU_URL" : "NEXT_PUBLIC_SITE_URL"]: "demo QR code",
  NEXT_PUBLIC_WHATSAPP_NUMBER: "WhatsApp button",
  NEXT_PUBLIC_PHONE: "Call button",
  NEXT_PUBLIC_EMAIL: "Email button",
};
const missing = Object.entries(required).filter(([key]) => !set(key));
// build workers load this file too; warn once
if (missing.length && process.env.NODE_ENV === "production" && !process.env.MENUFLEX_CONFIG_WARNED) {
  process.env.MENUFLEX_CONFIG_WARNED = "1";
  console.warn(`\n⚠ MenuFlex: not configured, so hidden on the site: ${missing.map(([k, what]) => `${what} (${k})`).join(", ")}\n`);
}

const nextConfig: NextConfig = {
  // folder-style URLs (/tr/, /demo/liman/) work the same on any static host
  trailingSlash: true,
};

export default nextConfig;
