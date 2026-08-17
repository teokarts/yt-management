-- ============================================================================
-- Reelist — OPTIONAL demo seed data
-- This script inserts sample categories/tags/videos for ONE given user.
-- It will NEVER run automatically and is NOT part of production logic.
--
-- Usage:
--   1. Replace 'REPLACE_WITH_USER_UUID' below with your auth user's UUID.
--   2. Run this file AFTER the initial schema migration.
-- ============================================================================

do $$
declare
  v_user uuid := 'REPLACE_WITH_USER_UUID';
  v_dev uuid;
  v_ai uuid;
  v_design uuid;
  v_watch_later uuid;
  v_frontend uuid;
  v_backend uuid;
  v_ml uuid;
  v_nextjs uuid;
  v_supabase uuid;
  v_react uuid;
  v_video uuid;
begin
  if v_user = 'REPLACE_WITH_USER_UUID' then
    raise exception 'Please set v_user to your auth user UUID first.';
  end if;

  -- Categories
  insert into public.categories (user_id, name, slug, color, icon, sort_order) values
    (v_user, 'Development', 'development', '#4fb477', 'code', 0),
    (v_user, 'AI', 'ai', '#5aa2d8', 'sparkles', 1),
    (v_user, 'Design', 'design', '#e6b34c', 'palette', 2),
    (v_user, 'Watch Later', 'watch-later', '#e5484d', 'clock', 3)
  returning id, name into v_dev, v_dev; -- not used; see below

  select id into v_dev from public.categories where user_id = v_user and slug = 'development';
  select id into v_ai from public.categories where user_id = v_user and slug = 'ai';
  select id into v_design from public.categories where user_id = v_user and slug = 'design';
  select id into v_watch_later from public.categories where user_id = v_user and slug = 'watch-later';

  -- Subcategories
  insert into public.categories (user_id, name, slug, color, icon, parent_id, sort_order) values
    (v_user, 'Frontend', 'frontend', '#4fb477', 'code', v_dev, 10),
    (v_user, 'Backend', 'backend', '#4fb477', 'code', v_dev, 11),
    (v_user, 'Machine Learning', 'machine-learning', '#5aa2d8', 'brain', v_ai, 12);

  select id into v_frontend from public.categories where user_id = v_user and slug = 'frontend';
  select id into v_backend from public.categories where user_id = v_user and slug = 'backend';
  select id into v_ml from public.categories where user_id = v_user and slug = 'machine-learning';

  -- Tags
  insert into public.tags (user_id, name, normalized_name, slug, is_pinned) values
    (v_user, 'nextjs', 'nextjs', 'nextjs', true),
    (v_user, 'supabase', 'supabase', 'supabase', false),
    (v_user, 'react', 'react', 'react', true),
    (v_user, 'tutorial', 'tutorial', 'tutorial', true)
  on conflict (user_id, normalized_name) do nothing;

  select id into v_nextjs from public.tags where user_id = v_user and normalized_name = 'nextjs';
  select id into v_supabase from public.tags where user_id = v_user and normalized_name = 'supabase';
  select id into v_react from public.tags where user_id = v_user and normalized_name = 'react';

  -- A couple of real, well-known public videos so thumbnails render.
  insert into public.videos (user_id, youtube_video_id, youtube_url, title, description, thumbnail_url, channel_name, channel_id, published_at, duration, personal_notes, watch_status, is_favorite, is_watch_later) values
    (
      v_user,
      'zOrejQ0MTDM',
      'https://www.youtube.com/watch?v=zOrejQ0MTDM',
      'The Future of Supabase',
      'Announcement of Supabase products and the direction of the platform.',
      'https://i.ytimg.com/vi/zOrejQ0MTDM/hqdefault.jpg',
      'Supabase',
      'UCzQR9XzFQm7z7Yh5Kq1N2gA',
      now() - interval '2 years',
      'PT27M13S',
      'Watch the platform announcement.',
      'watched',
      true,
      false
    ),
    (
      v_user,
      'wm5gMKuwSYk',
      'https://www.youtube.com/watch?v=wm5gMKuwSYk',
      'Next.js: The Modern Web Framework',
      'An overview of Next.js features and how to build with the App Router.',
      'https://i.ytimg.com/vi/wm5gMKuwSYk/hqdefault.jpg',
      'Vercel',
      'UCZ9qV1T8Xq1aC2YzTQnVj3w',
      now() - interval '1 year',
      'PT18M45S',
      'Great intro to the App Router.',
      'watching',
      false,
      true
    )
  returning id into v_video;

  -- Relationships
  select id into v_video from public.videos where user_id = v_user order by created_at desc limit 1;

  insert into public.video_categories (video_id, category_id) values
    (v_video, v_dev),
    (v_video, v_ai),
    (v_video, v_watch_later),
    (v_video, v_frontend),
    (v_video, v_ml);

  insert into public.video_tags (video_id, tag_id) values
    (v_video, v_nextjs),
    (v_video, v_supabase),
    (v_video, v_react);

  raise notice 'Demo data inserted for user %', v_user;
end $$;
