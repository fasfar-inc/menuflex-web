/**
 * Geometry of the LIMAN menu assets. All rects are fractions of the stage
 * (the studio backdrop image) so layers stay aligned at any rendered size.
 */
export const limanMenu = {
  stage: { src: "/scene-01/studio-backdrop.webp", width: 1458, height: 1135 },
  menu: {
    src: "/scene-01/liman-menu-object.webp",
    width: 1191,
    height: 1072,
    alt: "An open LIMAN Kitchen & Bar menu with grilled octopus on the cover, grilled sea bass and hand-cut tagliatelle inside",
    rect: { x: 0.0484, y: 0.0357, w: 0.8169, h: 0.9445 },
  },
} as const;

/** CSS box for a stage-relative rect. */
export function rectStyle(r: { x: number; y: number; w: number; h: number }) {
  return {
    left: `${r.x * 100}%`,
    top: `${r.y * 100}%`,
    width: `${r.w * 100}%`,
    height: `${r.h * 100}%`,
  };
}
