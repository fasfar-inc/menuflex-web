import type { Metadata, Viewport } from "next";
import { RootDocument } from "@/components/layout/RootDocument";
import { business } from "@/config/business";
import { dictionaries } from "@/i18n/dictionaries";

const t = dictionaries.en;

export const metadata: Metadata = {
  metadataBase: business.siteUrl ? new URL(business.siteUrl) : undefined,
  title: t.meta.title,
  description: t.meta.description,
  alternates: { canonical: "/", languages: { en: "/", tr: "/tr/" } },
};

export const viewport: Viewport = { themeColor: "#15120f" };

export default function EnglishLayout({ children }: { children: React.ReactNode }) {
  return <RootDocument lang="en">{children}</RootDocument>;
}
