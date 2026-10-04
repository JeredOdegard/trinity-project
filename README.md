# The Trinity Project

Grace coffee, Trinity bag campaign. Each bag has a unique QR sticker. Scan it, leave a message for a stranger, and you are matched with the person who planted the leaf before you. Every message is a leaf on a shared tree. Cocoa beans start raining at 500 leaves and pour harder at 1,000, 5,000, and 10,000, piling up on the ground (goals in `lib/goals.js`).

## How it works
- `/t/<code>`: first visit shows the form. Every later visit shows your match, your leaf, and progress toward the next rain level.
- `/t/<code>/tree`: the whole 3D tree (Three.js). Drag to turn it, tap any leaf to read it, and a random message lights up every few seconds. Only visible to bags that have planted.
- Match = latest visible message before yours, worked out each time the page loads. Hiding a message gives the next person the message before it instead. The very first bag gets Grace's seed message.
- Moderation: profanity filter on submit, plus `/admin` (basic auth, `ADMIN_PASSWORD`) to hide or show any message.

## Local dev
```
npm install
cp .env.example .env.local
npm run db:local        # embedded Postgres (PGlite) on :5433, keep running
npm run db:migrate
npm run dev
```
Make stickers at `/admin/stickers` (password from `ADMIN_PASSWORD`), then open one of the links. In dev, add `?leaves=5000` to a tree URL to preview any goal.

## Deploy (Vercel)
1. Import the repo in Vercel.
2. Add Postgres from the Vercel Marketplace (Neon). This sets `DATABASE_URL`.
3. Set `ADMIN_PASSWORD`, `SITE_URL` (the final domain).
4. With the production env pulled locally, run `npm run db:migrate` once.

## Stickers
`/admin/stickers`: enter how many bags, and it creates one private link per bag (`SITE_URL/t/<8-char code>`). You land on a printable sheet (12 stickers per Letter page, Print / save PDF) and can download a CSV of bag number, code and URL for a printer doing variable-data QR printing. Any range can be reopened later. Set `SITE_URL` to the final domain before printing.
