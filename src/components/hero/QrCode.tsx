import QRCode from "qrcode";

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
 * A real, scannable QR code for `url`, generated at build time. Dark modules
 * on a light tile: the polarity every camera app reads.
 */
export function QrCode({ url, label, className = "" }: { url: string; label: string; className?: string }) {
  const code = modulesPath(url);
  const quiet = 3;
  return (
    <div role="img" aria-label={label} data-qr-target={url} className={`rounded-[10%] bg-[#f3ead9] ${className}`}>
      <svg
        viewBox={`${-quiet} ${-quiet} ${code.size + 2 * quiet} ${code.size + 2 * quiet}`}
        className="block h-full w-full"
        shapeRendering="crispEdges"
        aria-hidden="true"
      >
        <path d={code.d} fill="#16130f" />
      </svg>
    </div>
  );
}
