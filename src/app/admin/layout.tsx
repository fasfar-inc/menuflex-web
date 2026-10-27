import type { Metadata, Viewport } from "next";
import { RootDocument } from "@/components/layout/RootDocument";

export const metadata: Metadata = {
  title: { default: "MenuFlex Admin", template: "%s · MenuFlex Admin" },
  // private: never indexed or followed
  robots: { index: false, follow: false, nocache: true },
};

export const viewport: Viewport = { themeColor: "#0f0d0b" };

// always rendered on request, so access is checked for every visit and nothing is cached
export const dynamic = "force-dynamic";

/** The private MenuFlex admin, for the MenuFlex team only. */
export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <RootDocument lang="en">{children}</RootDocument>;
}
