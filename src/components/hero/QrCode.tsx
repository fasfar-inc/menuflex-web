"use client";

import QRCode from "qrcode";
import { useEffect, useMemo, useState } from "react";
import { DEMO_MENU_PATH } from "@/config/business";

/** QR modules as one SVG path (one unit per module). */
function modulesPath(text: string) {
  const qr = QRCode.create(text, { errorCorrectionLevel: "M" });
  const { size, data } = qr.modules;
  let d = "";
  for (let y = 0; y < size; y++) {
    let x = 0;
    while (x < size) {
      if (!data[y * size + x]) {
        x++;
        continue;
      }
      // merge horizontal runs into one rectangle
      let run = 1;
      while (x + run < size && data[y * size + x + run]) run++;
      d += `M${x} ${y}h${run}v1h-${run}z`;
      x += run;
    }
  }
  return { size, d };
}

/**
 * A real, scannable QR code (dark modules on a light tile, the polarity every
 * camera app reads). It encodes the configured demo menu address, or this
 * site's own example menu when none is configured.
 */
export function QrCode({ url, label, className = "" }: { url: string | null; label: string; className?: string }) {
  const [target, setTarget] = useState(url);
  useEffect(() => {
    if (!url) setTarget(new URL(DEMO_MENU_PATH, window.location.href).toString());
  }, [url]);
  const code = useMemo(() => (target ? modulesPath(target) : null), [target]);
  const quiet = 3;

  return (
    <div role="img" aria-label={label} data-qr-target={target ?? undefined} className={`rounded-[10%] bg-[#f3ead9] ${className}`}>
      {code && (
        <svg
          viewBox={`${-quiet} ${-quiet} ${code.size + 2 * quiet} ${code.size + 2 * quiet}`}
          className="anim-fade block h-full w-full"
          shapeRendering="crispEdges"
          aria-hidden="true"
        >
          <path d={code.d} fill="#16130f" />
        </svg>
      )}
    </div>
  );
}
