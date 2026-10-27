# MenuFlex website

The MenuFlex service website: digital restaurant menus served through QR codes.
A FASFAR product.

Next.js (App Router) · TypeScript · Tailwind CSS · Supabase. The marketing
pages are static; the private admin at `/admin` and the restaurants managed
there use Supabase (auth, database, image storage). Without Supabase
configured the site still builds and works, with its built-in content.

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
| `NEXT_PUBLIC_SUPABASE_URL` / `_ANON_KEY` | The admin dashboard and restaurants published from it (see below) |

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
| `/r/<code>/` | A published restaurant's QR code address; leads to its menu |
| `/admin/` | The private MenuFlex admin (team only, never indexed) |

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

## Admin dashboard (`/admin/`)

A private dashboard for the MenuFlex team. Restaurants and their guests have
no accounts.

- **Restaurants:** a list with an Add button. Each one has its name, web
  address (slug), English and Turkish subtitle, logo, accent and background
  colours, contact details (shown at the foot of the menu's full list),
  currency and opening language.
- **Menu:** categories (English and Turkish name, icon) and their dishes
  (photo, names, short descriptions, price, category, visibility), each
  with add, edit, delete and up/down ordering.
- **Preview:** the menu in the approved circular design, drafts and all,
  for admins only.
- **Draft / Published:** a new restaurant is a draft, visible to admins only.
  Publishing puts its menu live at `/m/<slug>/`, lists it by name in Our Work
  (both languages) and gives it a QR code. Unpublishing takes all three down.
- **QR code:** each restaurant's code points at `/r/<code>/`, a stable
  address that never changes, even if its slug does. Download it as PNG or
  SVG from the restaurant's page once it is published.

Dishes with a photo turn on the menu's wheel; a category with no photos yet
is shown as a plain list. Prices are formatted for the restaurant's currency
(₺1.250, €12,50).

### Security

- Sign-in is email and password through Supabase Auth. Every admin page and
  every server action checks, on the server, that the user is signed in
  (verified with Supabase, not just read from the cookie) and is listed in
  `public.admins`. Anyone else is sent to the sign-in page.
- Row level security is on for every table. The public can read only
  published restaurants, their categories and their visible dishes; only
  admins can write anything, reorder or upload images. Nobody can make
  themselves an admin from the app.
- The app only uses the public anon key. The service role key is never
  needed or read by the site.
- Images live in the public `menu-images` bucket so menus load them straight
  from Supabase's CDN. Files get random names, but anyone holding a draft
  photo's exact address could open it; nothing else about a draft is
  readable.

### Setting up Supabase

1. Create a Supabase project.
2. In **SQL Editor**, run `supabase/migrations/20261027120000_menuflex_admin.sql`
   (or `supabase db push` with the Supabase CLI). It only creates what is
   missing and is safe to run again. It adds the tables, row level security,
   the reorder function and the `menu-images` storage bucket with its
   policies.
3. In **Authentication → Providers → Email**, keep email sign-in on, and in
   **Authentication → Sign In / Providers** turn **Allow new users to sign up**
   off. Admins are invited, never self-registered.
4. Create each team member in **Authentication → Users → Add user** (email
   and a strong password), then make them an admin in the SQL Editor:

   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email = 'name@example.com';
   ```

5. Copy **Project URL** and the **anon public** key from **Project Settings →
   API** into `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   in the hosting environment (or `.env.local`), and set
   `NEXT_PUBLIC_SITE_URL` to the public domain so QR codes use it. Redeploy.
6. Sign in at `/admin/`.

The site needs a Node.js host for the admin (for example Vercel): sign-in,
server actions and on-demand menus don't work on a purely static export.

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
supabase/migrations/   database schema, row level security, storage
src/
  app/(en)/            English root layout, home, /demo/liman, /m/<slug>
  app/(tr)/            Turkish root layout, /tr
  app/admin/           the private admin: sign-in, restaurants, menu, preview
  app/r/[code]/        stable QR code addresses
  lib/supabase/        Supabase clients and settings
  lib/menuflex/        admin check, public queries, rows → menu, prices
  middleware.ts        keeps the admin session fresh
  app/globals.css      design tokens, backdrop, animations, --u
  config/business.ts   contact details and price from the environment
  content/             clients (Our Work), the LIMAN demo menu
  i18n/dictionaries.ts EN and TR copy
  components/
    hero/              Hero, MenuConstellation(+Mobile), QrCard, QrCode
    sections/          OurWork, HowItWorks, Pricing, Contact(+Form)
    layout/            SiteHeader, SiteFooter, RootDocument
    digital-menu/      the LIMAN demo menu
    menu-stack/        the interactive menu (wheel, photo viewer)
    admin/             the admin's forms and buttons
    brand/, ui/        wordmark, contact buttons, icons
```
