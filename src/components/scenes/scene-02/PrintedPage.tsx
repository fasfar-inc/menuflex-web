import { forwardRef } from "react";
import { limanMenu } from "@/content/limanMenu";

/**
 * Size of the right-hand printed page in the digital menu's logical pixels.
 * The phone screen (390 px wide) covers the page's MAINS column, u 0.57–0.94.
 */
export const PAGE = { width: 390 / 0.37, height: (390 / 0.37) * (387.25 / 424.5) } as const;
/** Where the phone screen's top-left corner sits on the page (fractions). */
export const SCREEN_ON_PAGE = { u: 0.57, v: 0.03 } as const;

// the page texture was typeset on a 1086 x 1000 grid (tools/menu-render/textures.py)
const unit = PAGE.width / 1086;
// line boxes of 1em put the ascender line 0.1055em below the box top for Inter and Cormorant
const LEAD = 0.1055;
// the texture's ink under the render's light
const INK = "36 31 26";

type Line = { text: string; u: number; v: number; size: number; alpha: number; serif?: boolean; right?: boolean; track?: number };

function lines(): { text: Line[]; rules: { u0: number; u1: number; v: number }[] } {
  const text: Line[] = [];
  const rules: { u0: number; u1: number; v: number }[] = [];
  const block = (title: string, v: number, id: string) => {
    text.push({ text: title.toUpperCase(), u: 0.075, v, size: 25, alpha: 235, serif: true, track: 7 });
    rules.push({ u0: 0.075, u1: 0.535, v: v + 0.055 });
    let y = v + 0.101;
    for (const d of limanMenu.find((c) => c.id === id)!.dishes) {
      text.push({ text: d.name, u: 0.075, v: y, size: 27, alpha: 255 });
      text.push({ text: d.price, u: 0.535, v: y + 0.002, size: 24, alpha: 255, right: true });
      text.push({ text: d.description, u: 0.075, v: y + 0.038, size: 19, alpha: 190 });
      y += 0.125;
    }
    return y;
  };
  const end = block("From the Grill", 0.034, "grill");
  block("From the Sea", end + 0.045, "sea");
  text.push({ text: "Please let us know about any allergies.", u: 0.075, v: 0.905, size: 16, alpha: 130 });
  return { text, rules };
}

const { text, rules } = lines();

/**
 * HTML copy of the printed columns that sit beside MAINS on the right-hand
 * page, set exactly where the print is. When the page lifts off the book they
 * dissolve down the page while MAINS turns into the digital menu.
 */
export const PrintedPage = forwardRef<HTMLDivElement>(function PrintedPage(_, ref) {
  return (
    <div ref={ref} aria-hidden="true" className="pointer-events-none absolute top-0 left-0" style={{ width: PAGE.width, height: PAGE.height }}>
      {rules.map((r) => (
        <span
          key={r.v}
          className="absolute"
          style={{
            left: r.u0 * PAGE.width,
            top: r.v * PAGE.height - 0.33 * unit,
            width: (r.u1 - r.u0) * PAGE.width,
            // a one-pixel rule of the 1629 px texture
            height: 0.67 * unit,
            background: `rgb(${INK} / ${(0.92 * 110) / 255})`,
          }}
        />
      ))}
      {text.map((l) => {
        const size = l.size * unit;
        return (
          <span
            key={`${l.text}-${l.v}`}
            className={`absolute whitespace-nowrap ${l.serif ? "font-[family-name:var(--font-cormorant)] font-semibold" : l.size >= 24 ? "font-semibold" : "font-normal"}`}
            style={{
              left: l.u * PAGE.width,
              top: l.v * PAGE.height + LEAD * size,
              fontSize: size,
              lineHeight: 1,
              letterSpacing: l.track ? l.track * unit : undefined,
              color: `rgb(${INK} / ${(0.92 * l.alpha) / 255})`,
              transform: l.right ? "translateX(-100%)" : undefined,
            }}
          >
            {l.text}
          </span>
        );
      })}
    </div>
  );
});
