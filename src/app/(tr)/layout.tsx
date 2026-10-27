import type { Metadata, Viewport } from "next";
import { RootDocument } from "@/components/layout/RootDocument";
import { business } from "@/config/business";
import { dictionaries } from "@/i18n/dictionaries";

const t = dictionaries.tr;

export const metadata: Metadata = {
  metadataBase: business.siteUrl ? new URL(business.siteUrl) : undefined,
  title: t.meta.title,
  description: t.meta.description,
  alternates: { canonical: "/tr/", languages: { en: "/", tr: "/tr/" } },
};

export const viewport: Viewport = { themeColor: "#15120f" };

export default function TurkishLayout({ children }: { children: React.ReactNode }) {
  return <RootDocument lang="tr">{children}</RootDocument>;
}
