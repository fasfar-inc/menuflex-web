import Image from "next/image";
import type { Dictionary } from "@/i18n/dictionaries";
import { heroMenus } from "./menus";
import { QrCard } from "./QrCard";

// stage = the right-hand part of the reference design, in its pixels
const STAGE = { x: 500, y: 80, w: 991, h: 870 };
const CARD = { x: 875, y: 352, w: 255, h: 306 };

const pct = (v: number, of: number) => `${(v / of) * 100}%`;
const place = (r: { x: number; y: number; w: number; h: number }) => ({
  left: pct(r.x - STAGE.x, STAGE.w),
  top: pct(r.y - STAGE.y, STAGE.h),
  width: pct(r.w, STAGE.w),
  height: pct(r.h, STAGE.h),
});

/** Gold connectors, drawn from the QR card out to each menu. */
const lines = [
  "M875 390H773Q748 390 748 365V316",
  "M1130 390H1175Q1200 390 1200 365V309",
  "M875 495H797",
  "M1130 496H1198",
  "M875 628H790Q765 628 765 653V700",
  "M1130 628H1207Q1232 628 1232 653V702",
];
const dots: [number, number][] = [
  [748, 316],
  [1200, 309],
  [797, 495],
  [868, 495],
  [1137, 496],
  [1198, 496],
  [765, 700],
  [1232, 702],
];

function Connectors() {
  return (
    <svg
      aria-hidden="true"
      viewBox={`${STAGE.x} ${STAGE.y} ${STAGE.w} ${STAGE.h}`}
      className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
      fill="none"
    >
      <defs>
        <filter id="gold-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id="gold-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f0c47d" stopOpacity="0.8" />
          <stop offset="1" stopColor="#f0c47d" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g filter="url(#gold-glow)" stroke="#e9b86e" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        {lines.map((d, i) => (
          <path key={d} d={d} pathLength={1} className="anim-draw" style={{ "--delay": `${1 + i * 0.06}s` } as React.CSSProperties} />
        ))}
      </g>
      <path d="M1002 660V780" stroke="url(#gold-fade)" strokeWidth="1.6" className="anim-fade" style={{ "--delay": "1.4s" } as React.CSSProperties} />
      <g filter="url(#gold-glow)" fill="#ffe2ad">
        {dots.map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="4" className="anim-fade" style={{ "--delay": "1.75s" } as React.CSSProperties} />
        ))}
      </g>
    </svg>
  );
}

/** Desktop hero composition: the QR code with six printed menus around it. */
export function MenuConstellation({ t, className = "" }: { t: Dictionary; className?: string }) {
  return (
    <div className={`aspect-[991/870] ${className}`}>
      <Connectors />
      {heroMenus.map((m, i) => (
        <figure
          key={m.id}
          className="anim-settle absolute m-0"
          style={{ ...place(m.rect), "--delay": `${0.5 + i * 0.08}s` } as React.CSSProperties}
        >
          <Image
            src={m.src}
            alt={`${t.menus.alt} ${t.menus[m.id]}`}
            width={m.width}
            height={m.height}
            sizes="(min-width: 1024px) 26vw, 50vw"
            priority={i < 2}
            className="menu-shadow h-full w-full transition-[transform,filter] duration-500 ease-out hover:-translate-y-1.5 hover:brightness-[1.06]"
          />
        </figure>
      ))}
      <QrCard t={t.qr} className="anim-settle absolute" style={{ ...place(CARD), height: "auto", "--delay": "0.3s" } as React.CSSProperties} />
    </div>
  );
}
