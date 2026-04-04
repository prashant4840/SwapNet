# SkillBridge

SkillBridge is a modern Skill Swap Platform built with React, Tailwind, Framer Motion, React Router, and a Supabase-backed data model. Users can offer a skill they know, request a skill they want to learn, send swap requests, chat after acceptance, and leave ratings when the exchange is complete.

## Highlights

- Email signup/login flow with Supabase auth
- Google auth button wired for Supabase OAuth when valid env vars are present
- Profile editor with bio, city, optional age, availability, mode, custom skill tags, and completion progress
- Live explore feed with search, filters, smart match scores, and reciprocal `Perfect Match 🎯` badges
- Swap request workflow with pending, accepted, declined, and completed states
- Real-time-style preserved chat threads after acceptance
- Ratings and reviews after swap completion
- Dashboard with active swaps, pending requests, completed swaps, charts, and swap score
- Community board for `Looking for` posts
- Dark mode, responsive sidebar/bottom nav layout, and Framer Motion transitions
- 10+ seeded profiles plus sample requests, reviews, chats, and notifications

## Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Framer Motion
- React Router v6
- Supabase client
- Recharts
- Lucide React
- React Hot Toast
- Playwright for browser verification

## Screenshots

### Landing

![Landing page](public/screenshots/landing.png)

### Explore Feed

![Explore feed](public/screenshots/explore.png)

### Dashboard

![Dashboard](public/screenshots/dashboard.png)

### Chat

![Chat thread](public/screenshots/chat.png)

### Public Profile

![Profile page](public/screenshots/profile.png)

<!-- ### Mobile Explore

![Mobile explore page](public/screenshots/mobile-explore.png) -->

<!-- ### Mobile

| Explore | Profile | Chat |
|--------|---------|------|
| ![Mobile explore](public/screenshots/mobile-explore.png) | ![Profile](public/screenshots/profile.png) | ![Chat](public/screenshots/chat.png) | -->


## Local Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the dev server:

   ```bash
   npm run dev
   ```

3. Open the app at `http://127.0.0.1:5173` unless you override the port.

4. Optional: copy `.env.example` to `.env` and add Supabase credentials.

5. Optional: install Playwright’s Chromium binary before running browser verification:

   ```bash
   npx playwright install chromium
   ```

## Available Scripts

- `npm run dev` starts the Vite dev server
- `npm run build` creates the production build
- `npm run lint` runs ESLint
- `npm run preview` serves the production build locally
- `npm run verify:browser` runs the Playwright route walkthrough and refreshes screenshots

## Supabase Setup

The app includes a Supabase-ready client helper at [`src/lib/supabase.ts`](src/lib/supabase.ts).

To provision the backend:

1. Create a new Supabase project.
2. Run [`supabase/schema.sql`](supabase/schema.sql).
3. Run [`supabase/seed.sql`](supabase/seed.sql).
4. Add your keys to `.env`:

   ```bash
   VITE_SUPABASE_URL=...
   VITE_SUPABASE_ANON_KEY=...
   ```

5. In Supabase Auth, enable Google as an OAuth provider if you want Google login.

## Deployment

This repo includes a Vercel SPA rewrite config at [`vercel.json`](vercel.json) so React Router routes resolve correctly in production.

Typical deployment flow:

```bash
npm install
npm run build
vercel
```

## Architecture Notes

- The database schema mirrors the requested entities: users, skills offered, skills wanted, swap requests, chats, reviews, notifications, posts, and abuse reports.
- Chat persistence is modeled against Supabase tables.
- Browser verification is scripted in [`scripts/verify.mjs`](scripts/verify.mjs).

## Verification

These checks were run successfully:

```bash
npm run build
npm run lint
npx playwright install chromium
npm run verify:browser
```

The browser verification confirms `/`, `/explore`, `/auth`, and, when test credentials are provided, authenticated routes such as `/dashboard` and `/messages` render without console errors or page errors.
