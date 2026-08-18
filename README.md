# YouTube Bookmarker

Your private video knowledge library. Save, organize, and rediscover YouTube videos — searchable notes, categories, and tags, all in a fast, dark-only web app.

Built with **Vite**, **React 19**, **Tailwind CSS 4**, **TypeScript**, **React Router**, and **Supabase** (Postgres auth, row-level security, and full-text search). It builds to **100% static files** — no Node server required at runtime — so it deploys on any static host (Plesk, nginx, S3, etc.).

## Requirements

- Node.js 20.9+ (built against 22)
- npm 10+
- A Supabase project (free tier is fine)
- A YouTube Data API v3 key
- The Supabase CLI (for deploying edge functions)

## Getting Started

### 1. Environment variables

Copy `.env.example` to `.env.local` and fill in real values:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_URL=http://localhost:5173
# VITE_BASE_PATH=/youtube-bookmarks   # only if deploying to a subfolder
```

The anon key and URL are public (required for Supabase Auth). Everything secret lives in Supabase edge functions:

- `YOUTUBE_API_KEY` → `supabase secrets set YOUTUBE_API_KEY=<key>`
- `SUPABASE_SERVICE_ROLE_KEY` → set automatically when you deploy with the Supabase CLI

### 2. Set up the database

Open the **Supabase SQL Editor** and run:

1. `supabase/migrations/20240101000000_initial_schema.sql` — creates all tables, indexes, triggers, row-level security policies, and the `set_video_relations` / `add_video_with_relations` RPC functions.
2. Optional: `supabase/seed.sql` — inserts demo categories/tags/videos (replace `REPLACE_WITH_USER_UUID` with your auth user's id first).

Then, in **Auth → Settings → Redirect URLs**, add your app URL and `https://your-host.example/youtube-bookmarks` (use the actual deployed origin) so password-reset links work.

### 3. Deploy edge functions

The browser never talks to YouTube or the database service role directly — it calls two Supabase edge functions:

```bash
supabase functions deploy youtube-metadata
supabase functions deploy admin-stats
supabase secrets set YOUTUBE_API_KEY=<your-youtube-api-key>
```

- `youtube-metadata` — validates the URL server-side, calls the YouTube Data API, and returns title/thumbnail/channel/duration. Handles quota and not-found errors.
- `admin-stats` — verifies the caller is a super admin (via their JWT), then aggregates platform stats with the service role.

### 4. Run it

```bash
npm install
npm run dev
```

Open http://localhost:5173, create an account, and start saving videos.

## Scripts

```bash
npm run dev       # development server
npm run build     # production build (outputs to dist/)
npm run preview   # serve the production build locally
npm run lint      # eslint
npm run typecheck # tsc --noEmit
```

## Deployment

The build output in `dist/` is fully static. Upload its contents to any static host:

1. `npm run build`
2. Copy `dist/` to your host (e.g. Plesk → your domain's document root, or a subfolder).
3. If you deploy to a subfolder, set `VITE_BASE_PATH=/your-folder` in `.env.local` **before** building.
4. Add your deployed URL to Supabase → Auth → Redirect URLs.
5. Deploy the edge functions (see above) pointing at the same Supabase project.

Because routing uses hash-based navigation (`/#/app`), no server-side rewrites are needed.

## Architecture

- **SPA with React Router**: hash-based routing so deep links and refresh work on any static host without rewrites.
- **Auth state** is managed by an `AuthProvider` (Supabase `onAuthStateChange`); protected routes redirect to `/login`.
- **Data**: a shared `AppDataProvider` loads sidebar counts, categories, tags, and profile once; mutations in `src/lib/api.ts` re-fetch it so the UI stays in sync.
- **Supabase**: email/password auth, row-level security on all 6 tables (`profiles`, `videos`, `categories`, `tags`, `video_categories`, `video_tags`), and `SECURITY DEFINER` RPCs that atomically set a video's categories/tags.
- **Full-text search** over title, description, channel, and personal notes via a generated `search_vector` (`'simple'` config, GIN-indexed) — no extra services needed.
- **YouTube integration**: URL parsing (youtube.com / youtu.be / shorts / live), metadata fetched through the `youtube-metadata` edge function, and an in-app privacy-friendly player (`youtube-nocookie.com`). Metadata can be refreshed per video; missing/private/unavailable videos degrade gracefully.
- **Admin**: a super-admin-only dashboard backed by the `admin-stats` edge function (users, videos, activity, top users).
- **Type-safe end to end**: a hand-written `src/types/database.ts` drives the Supabase client types, zod validates every mutation input, and the UI stays in sync via context refreshes.

## Key Folders

```
src/pages/          routes (landing, auth, /app library/category/tag/video/settings, admin, help, deploy, 404)
src/components/     UI kit (ui/) + feature components (layout/, library/, video/, category/, tag/, settings/)
src/context/        auth + app data providers
src/lib/            supabase client, edge-function client, youtube parsing, library & sidebar loaders, validation, api mutations, utils
src/types/          hand-written database types
supabase/           migrations, seed SQL, edge functions (functions/)
```

## Security Notes

- RLS is enabled on every table and all policies are scoped to `auth.uid()`. The security-definer RPCs verify ownership before mutating.
- The anon key is safe to expose; the service-role key and YouTube API key are used only inside edge functions.
- The `admin-stats` edge function verifies the caller's JWT and checks `is_super_admin` before returning any aggregate data.
- User content (notes, tags, categories) is always private to the owner.