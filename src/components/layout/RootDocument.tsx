import { Cormorant_Garamond, Inter, Newsreader } from "next/font/google";
import type { ReactNode } from "react";
import type { Locale } from "@/i18n/dictionaries";
import "@/app/globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  display: "swap",
});

// the wordmark and the LIMAN demo menu's typeface
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600"],
  display: "swap",
});

/** `<html>` and `<body>` for each language's root layout. */
export function RootDocument({ lang, children }: { lang: Locale; children: ReactNode }) {
  return (
    <html lang={lang} className={`${inter.variable} ${newsreader.variable} ${cormorant.variable}`}>
      <body>{children}</body>
    </html>
  );
}
