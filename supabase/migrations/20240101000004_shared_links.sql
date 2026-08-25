-- ============================================================================
-- Reelist — Public shared video links
--
-- A `shared_links` row turns one of a user's videos into a publicly viewable
-- page (/#/share/<token>). Anyone with the token can view the video and save
-- it to their own account; nothing else in the owner's library is exposed.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Table
-- ---------------------------------------------------------------------------

create table if not exists public.shared_links (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  video_id uuid not null unique references public.videos (id) on delete cascade,
  note text,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists shared_links_token_idx
  on public.shared_links (token);

-- ---------------------------------------------------------------------------
-- 2. Row Level Security — only the owner manages their share links.
--    Anonymous reads happen exclusively through the security definer RPCs
--    below, which expose a single whitelisted video per valid token.
-- ---------------------------------------------------------------------------

alter table public.shared_links enable row level security;

create policy "Share links are viewable by owner"
  on public.shared_links for select
  using (auth.uid() = created_by);

create policy "Share links are insertable by owner"
  on public.shared_links for insert
  with check (
    auth.uid() = created_by
    and exists (select 1 from public.videos v where v.id = video_id and v.user_id = auth.uid())
  );

create policy "Share links are updateable by owner"
  on public.shared_links for update
  using (auth.uid() = created_by)
  with check (auth.uid() = created_by);

create policy "Share links are deletable by owner"
  on public.shared_links for delete
  using (auth.uid() = created_by);

-- ---------------------------------------------------------------------------
-- 3. Public RPC: look up a shared video by token.
--    Returns ONLY public-facing fields — never the owner's personal notes.
-- ---------------------------------------------------------------------------

create or replace function public.get_shared_video(p_token text)
returns json
language sql
stable
security definer
set search_path = ''
as $$
  select json_build_object(
    'title',            v.title,
    'youtube_video_id', v.youtube_video_id,
    'youtube_url',      v.youtube_url,
    'thumbnail_url',    v.thumbnail_url,
    'channel_name',     v.channel_name,
    'published_at',     v.published_at,
    'duration',         v.duration,
    'sharer',           p.display_name,
    'note',             sl.note
  )
  from public.shared_links sl
  join public.videos v on v.id = sl.video_id
  left join public.profiles p on p.id = sl.created_by
  where sl.token = p_token;
$$;

revoke all on function public.get_shared_video from public;
grant execute on function public.get_shared_video to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4. RPC: save a shared video into the caller's own library.
--    Returns the new video id, or null when it is already in the library.
-- ---------------------------------------------------------------------------

create or replace function public.save_shared_video(p_token text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_src public.videos%rowtype;
  v_new uuid;
begin
  if v_user is null then
    raise exception 'Not authenticated';
  end if;

  select v.*
  into v_src
  from public.shared_links sl
  join public.videos v on v.id = sl.video_id
  where sl.token = p_token;

  if not found then
    raise exception 'Shared link not found';
  end if;

  insert into public.videos (
    user_id, youtube_video_id, youtube_url, title, description, thumbnail_url,
    channel_name, channel_id, published_at, duration
  ) values (
    v_user, v_src.youtube_video_id, v_src.youtube_url, v_src.title, v_src.description,
    v_src.thumbnail_url, v_src.channel_name, v_src.channel_id, v_src.published_at,
    v_src.duration
  )
  on conflict (user_id, youtube_video_id) do nothing
  returning id into v_new;

  return v_new;
end;
$$;

revoke all on function public.save_shared_video from public;
grant execute on function public.save_shared_video to authenticated;
