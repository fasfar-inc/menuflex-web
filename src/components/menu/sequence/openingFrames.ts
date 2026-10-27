/**
 * Pre-rendered opening of the LIMAN menu (Blender Cycles, see tools/menu-render).
 * Frames cover the CANVAS_VIEW region of the 1672x941 mockup frame, with
 * transparent backgrounds and the menu's shadow on the table baked in.
 */
export const openingFrames = {
  /** 96 frames of the opening, 48 of the open menu turning to face the viewer, then one extra frame. */
  count: 145,
  opening: 96,
  turn: 48,
  /**
   * Last frame: the final pose with the right-hand page left blank. It sits
   * under the lifted page once the page's print has been handed to HTML.
   */
  blank: 144,
  sets: [
    { name: "lo", width: 732, height: 525, dir: "/scene-01/opening/lo" },
    { name: "hi", width: 1463, height: 1049, dir: "/scene-01/opening/hi" },
  ],
} as const;

/** Rendered area in mockup-frame pixels (stage plus room for the camera move). */
export const CANVAS_VIEW = { x: 400, y: 0, width: 1272, height: 912 } as const;

/** Where the stage sits in the mockup frame. */
export const STAGE_VIEW = { x: 700, y: 95, width: 972, height: 757 } as const;

/**
 * The right-hand page in the last rendered frame (mockup-frame pixels), from
 * `render_menu.py --layout`. The website lifts this page off the book.
 */
export const PRINT_PAGE = { x: 1176, y: 282.5, width: 424.5, height: 387.25 } as const;

/** Spine centre in the last rendered frame; the book recedes around it. */
export const SPINE = { x: 1176, y: 476 } as const;

export const frameUrl = (dir: string, i: number) => `${dir}/${String(i).padStart(4, "0")}.webp`;
