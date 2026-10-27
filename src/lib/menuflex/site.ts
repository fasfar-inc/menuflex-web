import "server-only";
import { headers } from "next/headers";
import { business } from "@/config/business";

/** The site's public address: NEXT_PUBLIC_SITE_URL, else the address this request came in on. */
export async function siteOrigin() {
  if (business.siteUrl) return business.siteUrl;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
