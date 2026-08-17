# YouTube Bookmarker

Your private video knowledge library. Save, organize, and rediscover YouTube videos — searchable notes, categories, and tags, all in a fast, dark-only web app.

Built with **Next.js 16 (App Router)**, **React 19**, **Tailwind CSS 4**, **TypeScript**, and **Supabase** (Postgres auth, row-level security, and full-text search).

## Requirements

- Node.js 20.9+ (built against 22)
- npm 10+
- A Supabase project (free tier is fine)
- A YouTube Data API v3 key

## Getting Started

### 1. Environment variables

Copy `.env.example` to `.env.local` and fill in real values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
YOUTUBE_API_KEY=your-youtube-api-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

All keys come from your Supabase project (Project Settings → API) and the [Google Cloud Console](https://console.cloud.google.com/apis/credentials). Keep `SUPABASE_SERVICE_ROLE_KEY` server-only — it is never exposed to the browser.

### 2. Set up the database

Open the **Supabase SQL Editor** and run:

1. `supabase/migrations/20240101000000_initial_schema.sql` — creates all tables, indexes, triggers, row-level security policies, and the `set_video_relations` / `add_video_with_relations` RPC functions.
2. Optional: `supabase/seed.sql` — inserts demo categories/tags/videos (replace `REPLACE_WITH_USER_UUID` with your auth user's id first).

Then, in **Auth → Settings → Redirect URLs**, add `http://localhost:3000` (and `http://localhost:3000/reset-password` for password resets).

### 3. Configure YouTube API

Enable the **YouTube Data API v3** in Google Cloud Console, create an API key, and add it to `.env.local`. The key is only used server-side to fetch video metadata when you add a video.

### 4. Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000, create an account, and start saving videos.

## Scripts

```bash
npm run dev       # development server
npm run build     # production build
npm run start     # serve production build
npm run lint      # eslint
npx tsc --noEmit  # typecheck
```

## Architecture

- **App Router** with Server Components for initial data (library pages, sidebar counts, video detail) and server actions for every mutation — no API routes required.
- **Supabase**: email/password auth via `@supabase/ssr`, row-level security on all 6 tables (`profiles`, `videos`, `categories`, `tags`, `video_categories`, `video_tags`), and `SECURITY DEFINER` RPCs that atomically set a video's categories/tags.
- **Full-text search** over title, description, channel, and personal notes via a generated `search_vector` (`'simple'` config, GIN-indexed) — no extra services needed.
- **YouTube integration**: URL parsing (youtube.com / youtu.be / shorts / live), server-side metadata fetch, and an in-app privacy-friendly player (`youtube-nocookie.com`). Metadata can be refreshed per video; missing/private/unavailable videos degrade gracefully.
- **Type-safe end to end**: a hand-written `src/types/database.ts` drives the Supabase client types, zod validates every server action input, and mutations revalidate the app layout so the UI stays in sync.
- **UX**: dark-only design system, keyboard shortcuts (`n` add video, `/` search), load-more pagination, offline-friendly empty/loading/error states, and a responsive sidebar with category counts and pinned tags.

## Key Folders

```
src/app/            routes (landing, auth, /app library/category/tag/video/settings)
src/app/actions/    server actions (auth, videos, categories, tags, profile)
src/components/     UI kit (ui/) + feature components (layout/, library/, video/, category/, tag/, settings/)
src/lib/            supabase clients, youtube parsing/api, library & sidebar loaders, validation, utils
supabase/           migrations + optional seed SQL
```

## Deployment

Build and deploy anywhere Next.js runs (Vercel, Railway, Fly.io, a VPS). Set the same environment variables in your host, add the production URL to Supabase's auth redirect list, and run the migration against the production database.

## Security Notes

- RLS is enabled on every table and all policies are scoped to `auth.uid()`. The security-definer RPCs verify ownership before mutating.
- API keys stay server-side; only the anon key and Supabase URL are public (required for Supabase Auth).
- User content (notes, tags, categories) is always private to the owner.