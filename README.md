# Fitrack

Single-user mobile-first PWA for tracking IPPT, weight loss and daily training in NS.
Next.js 15 (App Router) · TypeScript · Tailwind · Supabase · Vercel.

## Setup
1. Create a Supabase project and run `supabase/migrations/001_init.sql` in the SQL editor.
2. In Supabase Auth → URL Configuration, set the Site URL to your deployed URL and add `<url>/auth/callback` to the redirect URLs.
3. Copy `.env.example` to `.env.local` and fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. `npm install && npm run dev`

## Scripts
- `npm run dev` · `npm run build` · `npx vitest run`

Official IPPT scoring tables live in `docs/ippt/`.
