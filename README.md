# MenuFlex website

The MenuFlex service website: digital restaurant menus served through QR codes.
A FASFAR product.

Next.js (App Router) · TypeScript · Tailwind CSS. No backend; every page is
static.

```bash
npm install
cp .env.example .env.local   # fill in the real business details
npm run dev                  # http://localhost:3000
npm run build && npm start
npm run lint
```

## Configuration

Real contact details and pricing come from environment variables
(`src/config/business.ts`, documented in `.env.example`). Nothing is
hard-coded, and anything left empty is simply not shown.

| Variable | Used for |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Absolute links and the demo QR code's address |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | WhatsApp buttons and the contact form (digits, international format) |
| `NEXT_PUBLIC_PHONE` | Call button and contact card |
| `NEXT_PUBLIC_EMAIL` | Email button, contact card and the form's email option |
| `NEXT_PUBLIC_DEMO_MENU_URL` | Where the hero QR code leads (default: `<SITE_URL>/demo/liman/`) |
| `NEXT_PUBLIC_SUBSCRIPTION_PRICE` / `_PERIOD` | The single subscription's price, e.g. `₺1.500` and `month` or `year` |

Until a channel is configured, the hero's WhatsApp, Call and Email buttons
lead to the contact section, and that section says the details are coming
soon. Without a price, the subscription card asks visitors to contact you.

## Pages

| Path | |
| --- | --- |
| `/` | Home, English |
| `/tr/` | Home, Turkish |
| `/demo/liman/` | The example digital menu the demo QR code opens |

Both languages share one set of components. All copy lives in
`src/i18n/dictionaries.ts`, and each language has its own root layout
(`src/app/(en)`, `src/app/(tr)`) so `<html lang>` and metadata are correct.

## Homepage

1. **Hero.** The approved design: headline, contact actions, and the central
   QR code joined to six printed menus by gold lines.
   - **From 1280 px:** the hero is one canvas measured in the reference
     design's pixels. `--u` in `globals.css` is one design pixel, set by the
     viewport's width or height (whichever is tighter), so text and menus keep
     the reference proportions and never collide.
   - **Phones and tablets:** a dedicated stacked layout. The QR code is on
     top, and the menus sit in labelled pairs on one gold spine
     (`MenuConstellationMobile`).
   - **1024–1279 px:** the text and that stacked composition side by side.
   - **Animations:** load-only CSS animations. Text and menus fade in and the
     lines draw. Menus and buttons have hover states. Everything shows
     immediately with reduced motion.
2. **Our Work.** A minimal list of restaurant names, each linking to that
   restaurant's live digital menu, from `src/content/clients.ts`. Add only
   genuine restaurants that have approved being listed, and mark them
   `published: true`. Until at least one is published, the section, its
   "Our Work" nav link and the hero's "Explore Our Work" button are all
   hidden. The LIMAN demonstration menu (`/demo/liman/`, opened by the demo
   QR code) is never listed there.
3. **How It Works.** Three steps.
4. **Subscription.** One plan at the configured price.
5. **Contact.** WhatsApp, phone and email cards, plus a short form. There is
   no server: the form opens the message in WhatsApp or the visitor's mail
   app, addressed to the configured details.

## The QR code

`src/components/hero/QrCode.tsx` generates a real code with the `qrcode`
package. It draws dark modules on a light tile, because every phone camera
reads that polarity; the decorative pattern in the mockup is not used. It
encodes `NEXT_PUBLIC_DEMO_MENU_URL` (or `<SITE_URL>/demo/liman/`). With
neither set, it encodes this site's own `/demo/liman/` from the visitor's
address, so it always opens the example menu on whatever host serves the site.

Each restaurant client will receive its own code for its own menu. This one
is a demonstration.

## Images

The six open menus in `public/menus/` are cut out of the approved hero
mockup, at twice its resolution with transparent edges, including their food
photography. To swap in new photography, replace the files and keep their
sizes in `src/components/hero/menus.ts`. The sharpest result would come from
re-shooting or re-rendering each menu at about 1400 px wide.

## Project structure

```
src/
  app/(en)/            English root layout, home, /demo/liman
  app/(tr)/            Turkish root layout, /tr
  app/globals.css      design tokens, backdrop, animations, --u
  config/business.ts   contact details and price from the environment
  content/             clients (Our Work), the LIMAN demo menu
  i18n/dictionaries.ts EN and TR copy
  components/
    hero/              Hero, MenuConstellation(+Mobile), QrCard, QrCode
    sections/          OurWork, HowItWorks, Pricing, Contact(+Form)
    layout/            SiteHeader, SiteFooter, RootDocument
    digital-menu/      the LIMAN demo menu
    brand/, ui/        wordmark, contact buttons, icons
```
