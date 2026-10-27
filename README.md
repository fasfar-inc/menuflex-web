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

Each item appears only once it is configured, so nothing on the site is a
dead end:

- the hero's WhatsApp, Call and Email buttons, one per configured channel;
- the Contact section, its nav link and the subscription's "Get started"
  button, once at least one channel is set;
- the demo QR code, once `NEXT_PUBLIC_SITE_URL` or `NEXT_PUBLIC_DEMO_MENU_URL`
  is set. Until then the card links to the demo menu instead; it never shows
  a decorative code;
- the subscription price (otherwise "Ask us for the current price").

`npm run build` prints a warning listing anything still missing.

## Pages

| Path | |
| --- | --- |
| `/` | Home, English |
| `/tr/` | Home, Turkish |
| `/demo/liman/` | The example digital menu the demo QR code opens |
| `/m/<slug>/` | A restaurant's interactive menu, e.g. `/m/liman/` (demo) |

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
   - **Phones and tablets:** a dedicated, compact stacked layout. The QR code
     is on top, and the menus sit in labelled pairs on one gold spine
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
5. **Contact.** One panel listing the configured channels (WhatsApp, phone,
   email), plus a short form. There is no server: the form opens the message
   in WhatsApp or the visitor's mail app, addressed to the configured details.

## Interactive menus (`/m/<slug>/`)

A mobile-first menu for each restaurant (`src/components/menu-stack/`):

- **Layout:** the restaurant header (menu index, logo, TR | EN) and a row of
  category pills stay on screen.
- **The dish wheel:** choosing a category shows its dishes that have a photo
  as round plates along the curve of an unseen wheel at the left edge,
  straight on the background. The selected plate sits at the wheel's right,
  largest, with a gold ring; the other dishes follow the curve above and
  below, spaced so no two plates overlap. A category with no photos yet shows
  its dishes as a plain list instead (`DishList.tsx`). Its name, price and
  description sit under the wheel. This is `DishWheel.tsx`.
- **Turning it:** one deliberate swipe up or down, one wheel or trackpad
  gesture, an arrow key or Page Up/Down, or a tap on a plate turns the wheel by
  exactly one dish (a tap goes straight to that dish). The plates travel along
  the circle for 460 ms with a gentle ease-out.
- **One change at a time:** a single lock covers every input, so nothing new
  starts until the turn has finished. The wheel is a loop: after the last dish
  the first comes round again.
- **Other controls:** the menu button lists every dish, and the language switch
  changes between TR and EN (remembered; `?lang=tr` works).
- **Behaviour:** the page fits the screen and never scrolls, so nothing locks.
  It respects iPhone safe areas. With reduced motion the wheel turns instantly
  and the details cross-fade.

Add a restaurant with one file in `src/content/menus/` (see `types.ts` and
`liman.ts`), registered in `src/content/menus/index.ts`. Photos go in
`public/m/<slug>/` and are cut to a circle (top-down shots suit the wheel best);
tapping the selected plate opens the whole photo full screen (✕, a tap
outside, a swipe down or Escape closes it). A dish without one stays off the
wheel (it is still in the full-menu list) until its photo is added. Behind the menu, `MenuBackdrop.tsx` draws
one even dark with a large, soft MenuFlex wordmark and a fine grain (nothing
to download).
Entries marked `demo: true` are kept out of search engines.
LIMAN at `/m/liman/` is fictional and is never listed in Our Work.

## The QR code

`src/components/hero/QrCode.tsx` generates a real code at build time with
the `qrcode` package. It draws dark modules on a light tile, because every
phone camera reads that polarity; the decorative pattern in the mockup is not
used. It encodes `NEXT_PUBLIC_DEMO_MENU_URL`, or `<SITE_URL>/demo/liman/`,
and is drawn only when one of them is configured.

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
