-- ============================================================================
-- Reelist — Initial schema, indexes, RLS
-- Run this in the Supabase SQL editor (or via supabase db push).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 0. Helpers
-- ---------------------------------------------------------------------------

-- Keep updated_at fresh on every write.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 1. profiles
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  default_sort text not null default 'recently_added',
  card_density text not null default 'comfortable' check (card_density in ('comfortable', 'compact', 'cozy')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-create a profile row for every new auth user.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'display_name')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 2. videos
-- ---------------------------------------------------------------------------

create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  youtube_video_id text not null,
  youtube_url text not null,
  title text not null,
  description text,
  thumbnail_url text,
  channel_name text,
  channel_id text,
  published_at timestamptz,
  duration text,
  personal_notes text,
  is_favorite boolean not null default false,
  is_watch_later boolean not null default false,
  watch_status text not null default 'unwatched' check (watch_status in ('unwatched', 'watching', 'watched')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Prevent the same user from saving the same video twice.
  constraint videos_user_video_unique unique (user_id, youtube_video_id)
);

-- Full-text search vector (title, channel, description, notes) — kept in sync
-- automatically by Postgres on every insert/update.
alter table public.videos
  add column if not exists search_vector tsvector
  generated always as (
    to_tsvector(
      'simple',
      coalesce(title, '') || ' ' ||
      coalesce(channel_name, '') || ' ' ||
      coalesce(description, '') || ' ' ||
      coalesce(personal_notes, '')
    )
  ) stored;

create index if not exists videos_user_created_idx
  on public.videos (user_id, created_at desc);

create index if not exists videos_user_youtube_idx
  on public.videos (user_id, youtube_video_id);

create index if not exists videos_user_favorite_idx
  on public.videos (user_id, is_favorite) where is_favorite;

create index if not exists videos_user_watch_later_idx
  on public.videos (user_id, is_watch_later) where is_watch_later;

create index if not exists videos_user_status_idx
  on public.videos (user_id, watch_status);

create index if not exists videos_user_channel_idx
  on public.videos (user_id, channel_id);

create index if not exists videos_user_title_idx
  on public.videos (user_id, lower(title));

create index if not exists videos_search_vector_idx
  on public.videos using gin (search_vector);

-- ---------------------------------------------------------------------------
-- 3. categories
-- ---------------------------------------------------------------------------

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  icon text,
  color text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categories_user_slug_unique unique (user_id, slug)
);

create unique index if not exists categories_user_name_unique_idx
  on public.categories (user_id, lower(name));

create index if not exists categories_user_sort_idx
  on public.categories (user_id, sort_order, name);

-- ---------------------------------------------------------------------------
-- 4. tags
-- ---------------------------------------------------------------------------

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  normalized_name text not null,
  slug text not null,
  is_pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tags_user_normalized_unique unique (user_id, normalized_name)
);

create index if not exists tags_user_pinned_idx
  on public.tags (user_id, is_pinned, normalized_name);

create index if not exists tags_user_normalized_idx
  on public.tags (user_id, normalized_name);

-- ---------------------------------------------------------------------------
-- 5. Junction tables
-- ---------------------------------------------------------------------------

create table if not exists public.video_categories (
  video_id uuid not null references public.videos (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  primary key (video_id, category_id)
);

create index if not exists video_categories_category_idx
  on public.video_categories (category_id);

create table if not exists public.video_tags (
  video_id uuid not null references public.videos (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  primary key (video_id, tag_id)
);

create index if not exists video_tags_tag_idx
  on public.video_tags (tag_id);

-- ---------------------------------------------------------------------------
-- 6. updated_at triggers
-- ---------------------------------------------------------------------------

drop trigger if exists set_videos_updated_at on public.videos;
create trigger set_videos_updated_at
  before update on public.videos
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_categories_updated_at on public.categories;
create trigger set_categories_updated_at
  before update on public.categories
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_tags_updated_at on public.tags;
create trigger set_tags_updated_at
  before update on public.tags
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 7. Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.videos enable row level security;
alter table public.categories enable row level security;
alter table public.tags enable row level security;
alter table public.video_categories enable row level security;
alter table public.video_tags enable row level security;

-- profiles
create policy "Profiles are viewable by owner"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Profiles are updateable by owner"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- videos
create policy "Videos are viewable by owner"
  on public.videos for select
  using (auth.uid() = user_id);

create policy "Videos are insertable by owner"
  on public.videos for insert
  with check (auth.uid() = user_id);

create policy "Videos are updateable by owner"
  on public.videos for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Videos are deletable by owner"
  on public.videos for delete
  using (auth.uid() = user_id);

-- categories
create policy "Categories are viewable by owner"
  on public.categories for select
  using (auth.uid() = user_id);

create policy "Categories are insertable by owner"
  on public.categories for insert
  with check (auth.uid() = user_id);

create policy "Categories are updateable by owner"
  on public.categories for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Categories are deletable by owner"
  on public.categories for delete
  using (auth.uid() = user_id);

-- tags
create policy "Tags are viewable by owner"
  on public.tags for select
  using (auth.uid() = user_id);

create policy "Tags are insertable by owner"
  on public.tags for insert
  with check (auth.uid() = user_id);

create policy "Tags are updateable by owner"
  on public.tags for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Tags are deletable by owner"
  on public.tags for delete
  using (auth.uid() = user_id);

-- video_categories: users may only manipulate relations where BOTH the video
-- and the category belong to them.
create policy "Video categories are viewable by owner"
  on public.video_categories for select
  using (
    exists (select 1 from public.videos v where v.id = video_id and v.user_id = auth.uid())
    or exists (select 1 from public.categories c where c.id = category_id and c.user_id = auth.uid())
  );

create policy "Video categories are insertable by owner"
  on public.video_categories for insert
  with check (
    exists (select 1 from public.videos v where v.id = video_id and v.user_id = auth.uid())
    and exists (select 1 from public.categories c where c.id = category_id and c.user_id = auth.uid())
  );

create policy "Video categories are deletable by owner"
  on public.video_categories for delete
  using (
    exists (select 1 from public.videos v where v.id = video_id and v.user_id = auth.uid())
    and exists (select 1 from public.categories c where c.id = category_id and c.user_id = auth.uid())
  );

-- video_tags
create policy "Video tags are viewable by owner"
  on public.video_tags for select
  using (
    exists (select 1 from public.videos v where v.id = video_id and v.user_id = auth.uid())
    or exists (select 1 from public.tags t where t.id = tag_id and t.user_id = auth.uid())
  );

create policy "Video tags are insertable by owner"
  on public.video_tags for insert
  with check (
    exists (select 1 from public.videos v where v.id = video_id and v.user_id = auth.uid())
    and exists (select 1 from public.tags t where t.id = tag_id and t.user_id = auth.uid())
  );

create policy "Video tags are deletable by owner"
  on public.video_tags for delete
  using (
    exists (select 1 from public.videos v where v.id = video_id and v.user_id = auth.uid())
    and exists (select 1 from public.tags t where t.id = tag_id and t.user_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- 8. RPC helpers — atomic relation updates used by server actions
-- ---------------------------------------------------------------------------

create or replace function public.set_video_relations(
  p_video uuid,
  p_categories uuid[],
  p_tags text[]
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_tag uuid;
  t text;
begin
  if v_user is null then
    raise exception 'Not authenticated';
  end if;

  if not exists (select 1 from public.videos where id = p_video and user_id = v_user) then
    raise exception 'Video not found';
  end if;

  delete from public.video_categories where video_id = p_video;

  if p_categories is not null then
    insert into public.video_categories (video_id, category_id)
    select p_video, c.id
    from unnest(p_categories) as x(id)
    join public.categories c on c.id = x.id and c.user_id = v_user;
  end if;

  delete from public.video_tags where video_id = p_video;

  if p_tags is not null then
    foreach t in array p_tags
    loop
      t := btrim(t);
      if t <> '' then
        insert into public.tags (user_id, name, normalized_name, slug)
        values (
          v_user,
          t,
          lower(t),
          regexp_replace(lower(t), '\s+', '-', 'g')
        )
        on conflict (user_id, normalized_name)
          do update set name = excluded.name, slug = excluded.slug
        returning id into v_tag;

        insert into public.video_tags (video_id, tag_id)
        values (p_video, v_tag)
        on conflict do nothing;
      end if;
    end loop;
  end if;
end;
$$;

revoke all on function public.set_video_relations from public;
grant execute on function public.set_video_relations to authenticated;

create or replace function public.add_video_with_relations(
  p_youtube_video_id text,
  p_youtube_url text,
  p_title text,
  p_description text,
  p_thumbnail_url text,
  p_channel_name text,
  p_channel_id text,
  p_published_at timestamptz,
  p_duration text,
  p_notes text,
  p_favorite boolean,
  p_watch_later boolean,
  p_status text,
  p_categories uuid[],
  p_tags text[]
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_video uuid;
begin
  if v_user is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.videos (
    user_id, youtube_video_id, youtube_url, title, description, thumbnail_url,
    channel_name, channel_id, published_at, duration, personal_notes,
    is_favorite, is_watch_later, watch_status
  ) values (
    v_user, p_youtube_video_id, p_youtube_url, p_title, p_description, p_thumbnail_url,
    p_channel_name, p_channel_id, p_published_at, p_duration, p_notes,
    p_favorite, p_watch_later, p_status
  )
  returning id into v_video;

  perform public.set_video_relations(v_video, p_categories, p_tags);
  return v_video;
end;
$$;

revoke all on function public.add_video_with_relations from public;
grant execute on function public.add_video_with_relations to authenticated;
