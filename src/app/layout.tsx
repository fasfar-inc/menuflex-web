import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter, Newsreader } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

// the LIMAN restaurant's own typeface, used on its printed and digital menus
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "MenuFlex — Restaurant menus, reimagined",
  description:
    "MenuFlex turns your restaurant menu into an effortless digital experience. A FASFAR product.",
};

export const viewport: Viewport = {
  themeColor: "#ece4d8",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${newsreader.variable} ${cormorant.variable}`}>
      <body>{children}</body>
    </html>
  );
}
