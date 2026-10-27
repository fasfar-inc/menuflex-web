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
    menu/                  # The LIMAN menu as a standalone object + its geometry
    scenes/
      scene-01/            # "Paper" hero: headline, menu stage, chapter rail
  content/site.ts          # All copy and nav data (ready for TR/EN)
  lib/gsap.ts              # GSAP registration
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
