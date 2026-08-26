# AGENTS.md

Vite + React 19 + TypeScript SPA ("YouTube Bookmarker") backed by Supabase (Postgres, auth, RLS, edge functions). Builds to fully static files in `dist/`; no Node server at runtime.

## Commands

```bash
npm run dev        # dev server on http://localhost:5173 (auto-opens browser)
npm run lint       # eslint
npm run typecheck  # tsc -b --noEmit
npm run build      # tsc -b && vite build -> dist/
```

- There are **no tests** and **no CI** — verification means `lint` → `typecheck` → `build`.
- Requires Node 20.9+, npm 10+, and a `.env.local` (copy from `.env.example`) with `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`. Dev won't work without real Supabase values.

## Agent boundaries

- The agent must **not** run `npm run dev` (or any long-running/interactive server). The user runs it themselves; the agent only verifies via `lint` → `typecheck` → `build`.
- The agent must **not** execute or apply SQL migrations against Supabase (no SQL Editor access, no `supabase db push`). When a schema change is needed, write an append-only file under `supabase/migrations/` and give the user the SQL to run manually in the Supabase SQL Editor.

## Gotchas

- **Routing is hash-based** (`HashRouter`, URLs like `/#/app`). Do not convert to BrowserRouter — the whole point is zero server rewrites on static hosts. Never use plain `href="#id"` anchors; the router owns the hash (see `src/components/docs/doc-shell.tsx`).
- **`VITE_BASE_PATH`** sets the build-time base for subfolder deploys but is deliberately ignored by `vite dev` — local dev always runs at root.
- Secrets (`YOUTUBE_API_KEY`, service-role key) live only in Supabase edge-function secrets (`supabase secrets set ...`), never in `.env*`. Only `VITE_`-prefixed vars reach the browser.
- Path alias: `@/` → `src/`.
- TypeScript is strict with `noUnusedLocals`/`noUnusedParameters`; build runs `tsc -b`, so unused code breaks the build.

## Architecture

- **Data flow**: two React contexts own state — `AuthProvider` (`src/context/auth-context.tsx`) and `AppDataProvider` (`src/context/app-data-context.tsx`, loads categories/tags/profile/sidebar counts once). All mutations go through helpers in `src/lib/*.ts` (`api.ts`, `categories.ts`, `playlists.ts`, …) which re-fetch app data so the UI stays consistent. Don't call `supabase.from()` ad hoc in components.
- **DB types are hand-written** in `src/types/database.ts` (not generated). When changing schema/migrations, update this file to match.
- **All mutations validate input with zod** (`src/lib/validation.ts`) before hitting Supabase.
- Writes that touch relations (categories/tags) go through `SECURITY DEFINER` RPCs (`set_video_relations` / `add_video_with_relations`) defined in `supabase/migrations/20240101000000_initial_schema.sql` — RLS is enabled on every table.
- **YouTube metadata** is fetched server-side via the `youtube-metadata` edge function (client helper: `src/lib/edge.ts`); the browser never calls YouTube's API directly. URL parsing lives in `src/lib/youtube/`.
- **Admin dashboard** uses the `admin-stats` edge function, which checks `is_super_admin` from the caller's JWT.

## Supabase workflow

- Migrations in `supabase/migrations/` are applied manually via the Supabase SQL Editor (not `supabase db push`); keep them append-only SQL files.
- Edge functions (`supabase/functions/youtube-metadata`, `admin-stats`) deploy via `supabase functions deploy <name>`.
