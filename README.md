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
    menu/                  # The LIMAN menu: photo object, geometry, and the 3D book
      three/               # React Three Fiber model, camera rig and scene
    scenes/
      scene-01/            # "Paper" hero: headline, menu stage, chapter rail
  content/site.ts          # All copy and nav data (ready for TR/EN)
  lib/gsap.ts              # GSAP + ScrollTrigger registration
  lib/progressStore.ts     # Tiny store that passes scroll progress to the 3D scene
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
(`OpeningSequence` → `MenuStage` → `BookCanvas`). It runs in three phases:

1. **Opening frame.** The approved photograph, unchanged.
2. **Handover.** In the first ~8% of the scroll the photograph dissolves into a
   real-time 3D model. The model was posed by solving the camera and the book's
   position from the photograph, and its cover and page textures are projected
   from the same photo, so both line up during the dissolve. The photo also moves
   with the model while the two are mixed.
3. **Opening.** The hardcover turns on its spine. While it opens, the cover casts
   a shadow across the pages, the pages bloom from pressed-flat into a natural
   gutter curve, the cloth joint flexes, and the menu eases toward the camera
   before settling as a balanced open spread. The spread holds until the pin ends.

The book is built from separate parts: back board, page block, curved page stacks,
cloth spine, and a cover on a hinge. It uses linen and paper materials and soft
shadow maps. Everything is scrubbed by GSAP ScrollTrigger, so it is reversible and
synchronised with the scroll. Pinned distance is 140% of the viewport on desktop;
below `lg` only the menu stage is pinned (110%). Visitors who prefer reduced motion
keep the static Scene 01 frame, and the 3D code (three.js) is never downloaded for
them. For everyone else it loads after the page has finished loading.

Textures live in `public/scene-01/book/`. The cover and the two food photographs
come from the approved mockup. The typography on both interior pages (dish names,
descriptions, prices) is set in Inter and Cormorant Garamond.
