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
    scenes/
      scene-01/            # "Paper" hero: headline, menu render, chapter rail
  content/site.ts          # All copy and nav data (ready for TR/EN)
  lib/gsap.ts              # GSAP registration
public/scene-01/           # Scene 01 imagery
```

New scenes go in `src/components/scenes/scene-0X/` and get added to `src/app/page.tsx`.

## Assets

`public/scene-01/liman-menu.webp` is the photographic LIMAN menu cut from the approved
mockup, with feathered edges so it blends into the CSS studio backdrop. Swap in a
higher-resolution studio render (about 2900 px wide, transparent or ivory background)
when one is available. The component won't need any changes.
