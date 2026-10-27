import { Wordmark } from "@/components/brand/BrandLogo";
import { business } from "@/config/business";
import type { Dictionary } from "@/i18n/dictionaries";
import { QrCode } from "./QrCode";

/**
 * The central demonstration QR code: a dark card with a warm gold rim, the
 * code and the MenuFlex wordmark. Sizes follow the card's width (cqw).
 */
export function QrCard({ t, className = "", style }: { t: Dictionary["qr"]; className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`[container-type:inline-size] ${className}`} style={style}>
      <div
        className="relative flex aspect-[255/306] w-full flex-col items-center rounded-[10cqw] border-[0.9cqw] border-gold-bright/90 bg-[linear-gradient(160deg,#211c17_0%,#120f0c_55%,#1a1612_100%)] px-[15cqw] pt-[13cqw]"
        style={{
          boxShadow:
            "0 0 0 0.4cqw rgba(255, 214, 150, 0.25) inset, 0 0 3cqw rgba(240, 180, 100, 0.55), 0 0 14cqw rgba(214, 150, 70, 0.35), 0 4cqw 12cqw rgba(0, 0, 0, 0.6)",
        }}
      >
        <QrCode url={business.demoMenuUrl} label={t.label} className="aspect-square w-full p-[1.5cqw]" />
        <Wordmark className="mt-[8.5cqw] text-[15.5cqw]" />
      </div>
    </div>
  );
}
