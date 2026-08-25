-- ============================================================================
-- Reelist — Playlists
-- Run this in the Supabase SQL editor.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. playlists
-- ---------------------------------------------------------------------------

create table if not exists public.playlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint playlists_user_slug_unique unique (user_id, slug)
);

create unique index if not exists playlists_user_name_unique_idx
  on public.playlists (user_id, lower(name));

create index if not exists playlists_user_created_idx
  on public.playlists (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- 2. playlist_videos (junction, ordered)
-- ---------------------------------------------------------------------------

create table if not exists public.playlist_videos (
  playlist_id uuid not null references public.playlists (id) on delete cascade,
  video_id uuid not null references public.videos (id) on delete cascade,
  position integer not null default 0,
  added_at timestamptz not null default now(),
  primary key (playlist_id, video_id)
);

create index if not exists playlist_videos_video_idx
  on public.playlist_videos (video_id);

create index if not exists playlist_videos_playlist_position_idx
  on public.playlist_videos (playlist_id, position);

-- ---------------------------------------------------------------------------
-- 3. updated_at triggers
-- ---------------------------------------------------------------------------

drop trigger if exists set_playlists_updated_at on public.playlists;
create trigger set_playlists_updated_at
  before update on public.playlists
  for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 4. Row Level Security
-- ---------------------------------------------------------------------------

alter table public.playlists enable row level security;
alter table public.playlist_videos enable row level security;

create policy "Playlists are viewable by owner"
  on public.playlists for select
  using (auth.uid() = user_id);

create policy "Playlists are insertable by owner"
  on public.playlists for insert
  with check (auth.uid() = user_id);

create policy "Playlists are updateable by owner"
  on public.playlists for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Playlists are deletable by owner"
  on public.playlists for delete
  using (auth.uid() = user_id);

-- playlist_videos: users may only manipulate relations where BOTH the video
-- and the playlist belong to them.
create policy "Playlist videos are viewable by owner"
  on public.playlist_videos for select
  using (
    exists (select 1 from public.videos v where v.id = video_id and v.user_id = auth.uid())
    or exists (select 1 from public.playlists p where p.id = playlist_id and p.user_id = auth.uid())
  );

create policy "Playlist videos are insertable by owner"
  on public.playlist_videos for insert
  with check (
    exists (select 1 from public.videos v where v.id = video_id and v.user_id = auth.uid())
    and exists (select 1 from public.playlists p where p.id = playlist_id and p.user_id = auth.uid())
  );

create policy "Playlist videos are deletable by owner"
  on public.playlist_videos for delete
  using (
    exists (select 1 from public.videos v where v.id = video_id and v.user_id = auth.uid())
    and exists (select 1 from public.playlists p where p.id = playlist_id and p.user_id = auth.uid())
  );
