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
    digital-menu/          # LIMAN's interactive digital menu (real HTML, phone-sized)
    scenes/
      scene-01/            # "Paper" hero: headline, menu stage, chapter rail, scroll pin
      scene-02/            # "Paper to digital": the phone emerging from the printed page
  content/site.ts          # All copy and nav data (ready for TR/EN)
  content/limanMenu.ts     # LIMAN dishes, shared by the printed and digital menus
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
   pulls back to frame the spread at a three-quarter angle.

Why pre-rendered: the model needs physically based light (soft area-light shadows,
bounce light, cloth sheen, contact shadow on the table), and a browser can't compute
that in real time on every device. The frames carry transparent backgrounds and the
menu's shadow on the table, and they are composited over the CSS studio backdrop.

Delivery: two WebP sets in `public/scene-01/opening/` (`hi` for desktop and high-DPI
screens, `lo` for phones). They stream after the page has loaded, first frame first and
then progressively finer passes.

## Step 3: from paper to digital

The same pin continues after the opening (desktop: 140% of the viewport for the opening,
then 200% for this chapter). Progress is a second value from `OpeningSequence`, and the
timings live in `DIGITAL` in `scenes/scene-02/PhoneReveal.tsx`. The idea: the printed
right-hand page *is* the phone screen. It never gets cropped or swapped for another object.

1. **The menu faces the viewer** (rendered, frames 96–143). The open menu turns square to
   the camera with the whole spread in view.
2. **Handover.** An exact HTML copy of the right-hand page fades in over its render: the
   rendered paper (`public/scene-01/opening/page-lift.webp`, cut from a render of the
   same pose with the page left blank), the printed side columns
   (`scenes/scene-02/PrintedPage.tsx`, set from the texture's typesetting) and the digital
   menu, whose Mains section is laid out like the printed MAINS column. Under it, the book
   switches to that blank-page frame (frame 144).
3. **The page lifts off.** The page comes forward with a soft shadow while the book falls
   back and fades. The columns beside MAINS dissolve down the page. The page reshapes into
   the phone screen, and MAINS (the same photographs, dish names and prices) moves with it
   into the digital layout. On phones the target is the finished, enlarged phone, so the
   object grows steadily towards the centre of the screen.
4. **Paper becomes screen.** The paper turns deep black, the ink turns light, the status
   bar, LIMAN brand row and sticky categories fade in, the corners round off, and the phone
   frame forms around the screen.
5. **Interactive.** At the end of the pin the menu takes pointer input: the category tabs
   scroll to their section, and the active tab follows the scroll. The menu scrolls
   inside the phone with `overscroll-behavior: contain`, so it never drives the page.

The digital menu (`components/digital-menu/DigitalMenu.tsx`) is real HTML at 390×836
logical pixels, scaled to fit. Its content comes from `content/limanMenu.ts`.

Reduced motion: there is no camera movement and no frames are downloaded. The pin stays,
and the approved photo cross-fades straight to the finished phone.

Photography: the only dish photographs available are the octopus, sea bass and
tagliatelle from the approved mockup. Other dishes are text rows. To add photos, put
licensed images in `public/digital-menu/` and add `photo` to the dish in
`content/limanMenu.ts`.

### Re-rendering

```bash
python3 -m venv .venv && .venv/bin/pip install bpy==5.2.3
.venv/bin/python tools/menu-render/render_menu.py --out /tmp/frames --scale 1.15 --samples 40
.venv/bin/python tools/menu-render/render_menu.py --phase b --out /tmp/frames_b --scale 1.15 --samples 40
.venv/bin/python tools/menu-render/render_menu.py --phase b --blank --frames 47 --out /tmp/frames_blank --scale 1.15 --samples 40
.venv/bin/python tools/menu-render/render_menu.py --layout     # prints the lifted page's outline (PRINT_PAGE)
python3 tools/menu-render/encode_frames.py /tmp/frames --shadow 0.5               # needs Pillow
python3 tools/menu-render/encode_frames.py /tmp/frames_b --shadow 0.5 --offset 96
python3 tools/menu-render/encode_frames.py /tmp/frames_blank --shadow 0.5 --offset 97
python3 tools/menu-render/cut_page.py /tmp/frames_blank/0047.png                  # page-lift.webp
```

The opening frames in the repo were rendered before a lens-shift fix and were encoded
with `--shift=-56.6,4.1` (a pure image translation). Fresh renders don't need it.

`render_menu.py` builds the whole scene in code: bevelled cloth boards, the page block
with layered sheet edges, the cloth spine and joint, the inserts, the materials,
the lights and the shadow-catching table. Motion and framing are defined in `pose()`.
At 4 CPU cores a full render takes about 45 minutes. Textures live in
`tools/menu-render/textures/`. The cover and the two food photographs come from the
approved mockup, and the page typography is set in Inter and Cormorant Garamond.
