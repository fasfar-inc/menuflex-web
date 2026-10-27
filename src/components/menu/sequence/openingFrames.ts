/**
 * Pre-rendered opening of the LIMAN menu (Blender Cycles, see tools/menu-render).
 * Frames cover the CANVAS_VIEW region of the 1672x941 mockup frame, with
 * transparent backgrounds and the menu's shadow on the table baked in.
 */
export const openingFrames = {
  count: 96,
  sets: [
    { name: "lo", width: 732, height: 525, dir: "/scene-01/opening/lo" },
    { name: "hi", width: 1463, height: 1049, dir: "/scene-01/opening/hi" },
  ],
} as const;

/** Rendered area in mockup-frame pixels (stage plus room for the camera move). */
export const CANVAS_VIEW = { x: 400, y: 0, width: 1272, height: 912 } as const;

/** Where the stage sits in the mockup frame. */
export const STAGE_VIEW = { x: 700, y: 95, width: 972, height: 757 } as const;

export const frameUrl = (dir: string, i: number) => `${dir}/${String(i).padStart(4, "0")}.webp`;
