import type { Metadata } from "next";
import { DigitalMenu } from "@/components/digital-menu/DigitalMenu";
import { dictionaries } from "@/i18n/dictionaries";

export const metadata: Metadata = {
  title: "LIMAN Kitchen & Bar — MenuFlex demo menu",
  description: "An example digital restaurant menu made with MenuFlex.",
  robots: { index: false },
};

/** The example menu the hero's demo QR code opens. */
export default function LimanDemoPage() {
  const t = dictionaries.en.demo;
  return (
    <main className="min-h-dvh bg-night-950">
      <DigitalMenu badge={t.badge} backHref="/" backLabel={t.back} />
    </main>
  );
}
