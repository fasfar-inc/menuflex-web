# MenuFlex — Web

Marketing website for **MenuFlex**, the digital restaurant menu service by FASFAR.

The homepage is built **one scene at a time**. Only Scene 01 ("Paper") exists right now.

## Stack

- [Next.js 15](https://nextjs.org) (App Router) + TypeScript
- Tailwind CSS v4 (design tokens in `src/app/globals.css`)
- GSAP + `@gsap/react` for entrance and cinematic animations
- Three.js / React Three Fiber / Drei, installed for later scenes that need real 3D

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
```

Other scripts:

```bash
npm run lint     # ESLint
npm run build    # production build
npm run start    # serve the production build
```

## Project structure

```
src/
  app/                     # App Router entry (layout, page, global styles)
  components/
    brand/                 # MenuFlex logo and mark
    layout/                # Site header
    ui/                    # Shared primitives (Button)
    menu/                  # The LIMAN menu: photo object, geometry, opening sequence player
      sequence/            # Scroll-scrubbed frame player for the rendered opening
    scenes/
      scene-01/            # "Paper" hero: headline, menu stage, chapter rail
  content/site.ts          # All copy and nav data (ready for TR/EN)
  lib/gsap.ts              # GSAP + ScrollTrigger registration
  lib/progressStore.ts     # Tiny store that passes scroll progress to the sequence player
tools/menu-render/         # Blender (Cycles) model + render of the menu opening
public/scene-01/           # Scene 01 imagery
```

New scenes go in `src/components/scenes/scene-0X/` and get added to `src/app/page.tsx`.

## Assets

Scene 01's visual is built from three independent layers inside `MenuStage`:

| Layer | File | Notes |
| --- | --- | --- |
| Studio backdrop | `public/scene-01/studio-backdrop.webp` | Window light and leaf shadows with the menu removed |
| Contact shadow | CSS in `MenuStage.tsx` | Softens and fades as the menu floats up |
| Menu object | `public/scene-01/liman-menu-object.webp` | Transparent cut-out, rendered by `components/menu/MenuObject.tsx` |

`components/menu/limanMenu.ts` stores where the menu sits on the backdrop, as fractions of
the backdrop's size, so the layers stay aligned at any size. Later scenes can animate
`MenuObject` (target it with `[data-menu-object]` or its ref) or swap it for a 3D model
without touching the backdrop.

Both images are cut from the approved mockup, so they are sharp at normal screen
resolution and slightly soft on high-resolution screens. When a studio render is
available (about 2900 px wide, menu on a transparent background), replace
`liman-menu-object.webp` and update the sizes and position in `limanMenu.ts`.

## Step 2: menu opening sequence

Scrolling from the first screen pins the hero and plays the opening of the LIMAN menu
(`OpeningSequence` → `MenuStage` → `MenuSequence`).

1. **Opening frame.** The approved photograph, unchanged.
2. **Handover.** In the first ~5% of the scroll the photograph dissolves into frame 0
   of a rendered sequence. The render's camera, the book's proportions and its pose
   were solved from the photograph, and the cover and page textures are projected
   from it, so the two line up.
3. **Opening.** 96 frames rendered with Blender Cycles, scrubbed by GSAP ScrollTrigger:
   the hardcover turns on its cloth joint with natural acceleration and settles back
   a few degrees. Pages bloom from pressed-flat into an open-book curve and the first
   sheets lift at the gutter. The book straightens while the camera eases in and then
   pulls back to frame the spread at a three-quarter angle. Neighbouring frames are
   cross-blended so slow scrolling stays smooth.

Why pre-rendered: the model needs physically based light (soft area-light shadows,
bounce light, cloth sheen, contact shadow on the table), and a browser can't compute
that in real time on every device. The frames carry transparent backgrounds and the
menu's shadow on the table, and they are composited over the CSS studio backdrop.

Delivery: two WebP sets in `public/scene-01/opening/` (`hi` ≈ 6.5 MB for desktop and
high-DPI screens, `lo` ≈ 2.4 MB for phones). They stream after the page has loaded,
first frame first and then progressively finer passes. Visitors who prefer reduced
motion keep the static Scene 01 frame and download none of it.

### Re-rendering

```bash
python3 -m venv .venv && .venv/bin/pip install bpy==5.2.3
.venv/bin/python tools/menu-render/render_menu.py --out /tmp/frames --scale 1.15 --samples 40
python3 tools/menu-render/encode_frames.py /tmp/frames   # needs Pillow
```

`render_menu.py` builds the whole scene in code: bevelled cloth boards, the page block
with layered sheet edges, the cloth spine and joint, the inserts, the materials,
the lights and the shadow-catching table. Motion and framing are defined in `pose()`.
At 4 CPU cores a full render takes about 45 minutes. Textures live in
`tools/menu-render/textures/`. The cover and the two food photographs come from the
approved mockup, and the page typography is set in Inter and Cormorant Garamond.
