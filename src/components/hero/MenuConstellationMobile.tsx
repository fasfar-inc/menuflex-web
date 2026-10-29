import Image from "next/image";
import type { Dictionary } from "@/i18n/dictionaries";
import { heroMenus } from "./menus";
import { QrCard } from "./QrCard";

// a 360-unit-wide layout: the QR card on top, the menus in three pairs below,
// joined by one gold spine with a short branch to each menu
const W = 360;
const CARD = { x: 85, y: 0, w: 190 };
const CARD_H = (CARD.w * 306) / 255;
const BOX = { w: 156, h: 104 };
const COLS = [0, W - BOX.w];
// row pitch = menu + caption + a small gap
const PITCH = BOX.h + 30;
const ROW_Y = [CARD_H + 26, CARD_H + 26 + PITCH, CARD_H + 26 + 2 * PITCH];
const H = ROW_Y[2] + BOX.h + 22;
const SPINE_X = W / 2;
const pct = (v: number, of: number) => `${(v / of) * 100}%`;

export function MenuConstellationMobile({ t, className = "" }: { t: Dictionary; className?: string }) {
  const branchY = ROW_Y.map((y) => y + BOX.h / 2);
  return (
    <div className={`relative ${className}`} style={{ aspectRatio: `${W} / ${H}` }}>
      <svg aria-hidden="true" viewBox={`0 0 ${W} ${H}`} className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" fill="none">
        <defs>
          <filter id="gold-glow-m" x="-50%" y="-10%" width="200%" height="120%">
            <feGaussianBlur stdDeviation="1.6" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <g filter="url(#gold-glow-m)" stroke="#e9b86e" strokeWidth="1.6" strokeLinecap="round">
          <path d={`M${SPINE_X} ${CARD_H + 2}V${branchY[2]}`} pathLength={1} className="anim-draw" style={{ "--delay": "0.9s" } as React.CSSProperties} />
          {branchY.map((y, i) => (
            <path
              key={y}
              d={`M${COLS[0] + BOX.w + 4} ${y}H${COLS[1] - 4}`}
              pathLength={1}
              className="anim-draw"
              style={{ "--delay": `${1.1 + i * 0.12}s` } as React.CSSProperties}
            />
          ))}
        </g>
        <g filter="url(#gold-glow-m)" fill="#ffe2ad">
          {branchY.flatMap((y) => [COLS[0] + BOX.w + 4, COLS[1] - 4].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="2.6" className="anim-fade" style={{ "--delay": "1.6s" } as React.CSSProperties} />))}
        </g>
      </svg>

      <QrCard
        t={t.qr}
        className="anim-settle absolute"
        style={{ left: pct(CARD.x, W), top: 0, width: pct(CARD.w, W), "--delay": "0.3s" } as React.CSSProperties}
      />

      {heroMenus.map((m, i) => (
        <figure
          key={m.id}
          className="anim-settle absolute m-0 flex flex-col items-center"
          style={{
            left: pct(COLS[i % 2], W),
            top: pct(ROW_Y[Math.floor(i / 2)], H),
            width: pct(BOX.w, W),
            "--delay": `${0.5 + i * 0.08}s`,
          } as React.CSSProperties}
        >
          <div className="flex w-full items-center justify-center" style={{ aspectRatio: `${BOX.w} / ${BOX.h}` }}>
            <Image
              src={m.src}
              alt={`${t.menus.alt} ${t.menus[m.id]}`}
              width={m.width}
              height={m.height}
              sizes="(min-width: 640px) 240px, 44vw"
              className="menu-shadow max-h-full w-full object-contain"
            />
          </div>
          <figcaption className="mt-1.5 text-[12px] leading-none font-medium tracking-[0.2em] text-gold uppercase">{t.menus[m.id]}</figcaption>
        </figure>
      ))}
    </div>
  );
}
