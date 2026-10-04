# The Trinity Project

Grace coffee, Trinity bag campaign. Each bag has a unique QR sticker. Scan it, leave a message for a stranger, and you are matched with the person who planted the leaf before you. Every message is a leaf on a shared tree. Every `RAIN_GOAL` leaves, the cocoa rain gets heavier (5 levels).

## How it works
- `/t/<code>`: first visit shows the form. Every later visit shows your match, your leaf, and progress toward the next rain level.
- `/t/<code>/tree`: the whole tree. 4 random messages appear as bubbles, and you can tap any leaf to read it. Only visible to bags that have planted.
- Match = latest visible message before yours, worked out each time the page loads. Hiding a message gives the next person the message before it instead. The very first bag gets Grace's seed message.
- Moderation: profanity filter on submit, plus `/admin` (basic auth, `ADMIN_PASSWORD`) to hide or show any message.

## Local dev
```
npm install
cp .env.example .env.local
npm run db:local        # embedded Postgres (PGlite) on :5433, keep running
npm run db:migrate
npm run codes -- 10     # 10 bag codes + QR SVGs in ./qr
npm run dev
```
Open a URL from `qr/codes.csv`. Set `RAIN_GOAL=3` locally to see the rain quickly.

## Deploy (Vercel)
1. Import the repo in Vercel.
2. Add Postgres from the Vercel Marketplace (Neon). This sets `DATABASE_URL`.
3. Set `ADMIN_PASSWORD`, `RAIN_GOAL`, `SITE_URL` (the final domain).
4. With the production env pulled locally: `npm run db:migrate`, then `npm run codes -- <bags>` to print stickers. QR codes encode `SITE_URL`, so set the final domain before generating.
