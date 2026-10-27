import { Wordmark } from "@/components/brand/BrandLogo";

/** A soft olive branch in fine gold line, drawn along a gentle curve with leaves either side. */
function OliveBranch({ className, flip = false }: { className: string; flip?: boolean }) {
  // stem: a cubic from (10,190) to (190,12)
  const P = [
    [10, 190],
    [60, 150],
    [110, 40],
    [190, 12],
  ];
  const at = (t: number) => {
    const u = 1 - t;
    const k = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t];
    const d = [-3 * u * u, 3 * u * u - 6 * u * t, 6 * u * t - 3 * t * t, 3 * t * t];
    return {
      x: k.reduce((s, c, i) => s + c * P[i][0], 0),
      y: k.reduce((s, c, i) => s + c * P[i][1], 0),
      a: (Math.atan2(d.reduce((s, c, i) => s + c * P[i][1], 0), d.reduce((s, c, i) => s + c * P[i][0], 0)) * 180) / Math.PI,
    };
  };
  const leaves = Array.from({ length: 13 }, (_, i) => {
    const t = 0.1 + i * 0.068;
    const p = at(t);
    const side = i % 2 === 0 ? 1 : -1;
    const len = 30 - i * 1.1;
    return { ...p, rot: p.a + side * 38, len };
  });
  const olives = [0.3, 0.58, 0.8].map((t, i) => ({ ...at(t), side: i % 2 === 0 ? -1 : 1 }));
  return (
    <svg viewBox="0 0 200 200" aria-hidden="true" className={className} style={flip ? { transform: "scaleX(-1)" } : undefined} fill="none" stroke="currentColor" strokeLinecap="round">
      <path d={`M${P[0]} C${P[1]} ${P[2]} ${P[3]}`} strokeWidth="1.3" />
      {leaves.map((l, i) => (
        <path
          key={i}
          transform={`translate(${l.x} ${l.y}) rotate(${l.rot})`}
          d={`M0 0C${l.len * 0.3} ${-l.len * 0.2} ${l.len * 0.75} ${-l.len * 0.2} ${l.len} 0C${l.len * 0.75} ${l.len * 0.2} ${l.len * 0.3} ${l.len * 0.2} 0 0Z`}
          strokeWidth="1"
          fill="currentColor"
          fillOpacity="0.12"
        />
      ))}
      {olives.map((o, i) => (
        <ellipse key={i} cx={o.x + o.side * 9} cy={o.y + 6} rx="4.2" ry="5.6" strokeWidth="1" fill="currentColor" fillOpacity="0.18" />
      ))}
    </svg>
  );
}

/** Fine film grain, so the dark never reads as a flat fill. */
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 0.85 0 0 0 0 0.6 0 0 0 0.55 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

/** Specks of gold dust: fixed positions (percent) and sizes, so the page is the same every visit. */
const DUST = [
  [82, 14, 2.4],
  [91, 31, 1.6],
  [74, 44, 1.4],
  [88, 58, 2],
  [95, 72, 1.4],
  [12, 70, 1.6],
  [6, 52, 1.2],
  [66, 86, 1.8],
  [30, 92, 1.3],
  [52, 8, 1.2],
  [97, 46, 1.2],
  [80, 78, 1.1],
];

/**
 * The room behind the menu: warm candlelight, olive branches in fine gold
 * line, a large soft MenuFlex wordmark, grain and a little gold dust. All
 * drawn here, nothing to download; it sits behind everything and takes no taps.
 */
export function MenuBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {/* candlelight */}
      <span className="menu-glow absolute -top-20 -right-24 h-72 w-72 rounded-full bg-[#e0a85a]/[0.16] blur-[70px]" />
      <span className="menu-glow absolute top-[42%] -right-16 h-60 w-48 rounded-full bg-[#d18a3c]/[0.12] blur-[60px] [animation-delay:-4s]" />
      <span className="absolute -bottom-24 left-1/2 h-56 w-[120%] -translate-x-1/2 rounded-full bg-[#d9a55a]/[0.08] blur-[90px]" />
      {/* bokeh, like candles out of focus across the room */}
      <span className="menu-glow absolute top-[9%] right-[8%] h-10 w-10 rounded-full bg-[#f2c27a]/25 blur-[6px] [animation-delay:-2s]" />
      <span className="absolute top-[16%] right-[22%] h-5 w-5 rounded-full bg-[#f2c27a]/20 blur-[4px]" />
      <span className="menu-glow absolute top-[62%] right-[4%] h-14 w-14 rounded-full bg-[#e8b06a]/[0.14] blur-[9px] [animation-delay:-6s]" />
      <span className="absolute bottom-[14%] left-[6%] h-8 w-8 rounded-full bg-[#e8b06a]/[0.12] blur-[7px]" />

      {/* olive branches */}
      <OliveBranch className="absolute -top-6 -right-10 h-56 w-56 rotate-[200deg] text-[#d9a55a] opacity-[0.22] blur-[0.4px]" flip />
      <OliveBranch className="absolute -bottom-10 -left-12 h-64 w-64 text-[#d9a55a] opacity-[0.16] blur-[0.6px]" />
      <OliveBranch className="absolute top-[46%] -right-20 h-48 w-48 rotate-[-30deg] text-[#d9a55a] opacity-[0.1] blur-[1.4px]" />

      {/* MenuFlex, large and soft */}
      <div className="absolute inset-x-0 top-[38%] flex justify-center">
        <Wordmark className="text-[min(38vw,230px)] text-gold-bright opacity-[0.1] blur-[5px]" />
      </div>

      {/* gold dust */}
      {DUST.map(([x, y, r], i) => (
        <span key={i} className="absolute rounded-full bg-[#f6d9a5]" style={{ left: `${x}%`, top: `${y}%`, width: r, height: r, opacity: 0.35 + (i % 3) * 0.12 }} />
      ))}

      {/* grain and a soft vignette */}
      <span className="absolute inset-0 opacity-[0.07] mix-blend-overlay" style={{ backgroundImage: GRAIN }} />
      <span className="absolute inset-0 bg-[radial-gradient(120%_85%_at_50%_45%,transparent_55%,rgba(0,0,0,0.55)_100%)]" />
    </div>
  );
}
