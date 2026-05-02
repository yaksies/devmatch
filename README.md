# devmatch — Next + Expo + Supabase

A compact demo app combining a Next.js web frontend, an Expo React Native mobile app, and Supabase for auth and data persistence. Built for quick iteration and experimenting with swipe-first interactions and native-feeling mobile tabs. 🚀

## About

- **Web:** Next.js App Router (server & client components)
- **Mobile:** Expo + Expo Router
- **Auth & DB:** Supabase (client + server usage)
- **Features:** swipe-first discover cards, native tabs on mobile, homepage intro gate, auth gating.

## Quick start — run locally 🖥️

Prerequisites: `node` (16+), `npm` or `pnpm`/`yarn`, and `expo` (for mobile).

1. Install deps

```bash
npm install
# or pnpm install
```

2. Start the web dev server

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

3. Run the mobile app (optional)

```bash
cd mobile
npm install
expo start
```

Then open in the Expo Go app or run on a simulator/device.

## Environment

- The web and mobile app expect Supabase credentials. Create a `.env.local` (web) and set the usual Supabase keys:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=(only for server-side tasks)
```

For mobile, set the same variables in `mobile/.env` or use `expo secrets`/Env config.

## Important scripts

- `npm run dev` — run Next.js in development
- `npm run build` — build Next.js for production
- `npm run start` — run built Next app
- `cd mobile && expo start` — start Expo for mobile development

## Notes & tips 🎯

- The homepage is wrapped in `src/components/HomepageIntroGate.tsx` which shows a first-time intro overlay for logged-out users.
- Swipe interactions live in `src/components/SwipeDemo.tsx` and `mobile/app/(tabs)/discover.tsx` (mobile uses `PanResponder`).
- Auth gating is enforced by `src/middleware.ts` on the web; if you change routes update middleware accordingly.
- Use WebP or SVG for intro graphics; SVG works well for vector icons and scales crisply.

## Deploy

- Deploy the web app to Vercel. Remember to add Supabase env vars in the Vercel project settings before deploying.

## Contributing

- Open an issue or PR. Keep changes focused and run the dev server to verify UI/UX before submitting.

---

Made with ❤️ — tweak any instructions to match your environment.
