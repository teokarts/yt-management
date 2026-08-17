-- ============================================================================
-- Reelist — Super admin support
-- Adds the is_super_admin flag to profiles plus admin-only stats functions.
-- ============================================================================

-- 1. Flag on profiles
alter table public.profiles
  add column if not exists is_super_admin boolean not null default false;

-- 2. Promote the designated super admin account (matched by email).
update public.profiles
set is_super_admin = true
where id in (select id from auth.users where email = 'tkarts@sch.gr');

-- ---------------------------------------------------------------------------
-- 3. Admin-only statistics functions
-- Executable solely by the service_role key (which bypasses RLS). Regular app
-- clients (anon/authenticated) can never call them, so no user data leaks.
-- ---------------------------------------------------------------------------

-- Daily signups and video additions for the last N days.
create or replace function public.admin_daily_series(days integer)
returns table (day date, users bigint, videos bigint)
language sql
security definer
set search_path = ''
as $$
  select d.day,
    (select count(*) from public.profiles p where p.created_at::date = d.day)::bigint,
    (select count(*) from public.videos v where v.created_at::date = d.day)::bigint
  from generate_series(current_date - (days - 1), current_date, interval '1 day') as d(day)
  order by d.day asc;
$$;

-- Distinct users who saved a video within the last N days.
create or replace function public.admin_active_users(days integer)
returns bigint
language sql
security definer
set search_path = ''
as $$
  select count(distinct v.user_id)::bigint
  from public.videos v
  where v.created_at >= (now() - make_interval(days => days));
$$;

-- Top users by number of videos saved.
create or replace function public.admin_top_users(lim integer)
returns table (user_id uuid, video_count bigint)
language sql
security definer
set search_path = ''
as $$
  select v.user_id, count(*)::bigint as video_count
  from public.videos v
  group by v.user_id
  order by video_count desc
  limit lim;
$$;

-- Per-user aggregates for every account (used for the users table).
create or replace function public.admin_user_stats()
returns table (user_id uuid, video_count bigint, last_active timestamptz)
language sql
security definer
set search_path = ''
as $$
  select v.user_id, count(*)::bigint as video_count, max(v.created_at) as last_active
  from public.videos v
  group by v.user_id;
$$;

revoke all on function public.admin_daily_series(integer) from public;
revoke all on function public.admin_active_users(integer) from public;
revoke all on function public.admin_top_users(integer) from public;
revoke all on function public.admin_user_stats() from public;

grant execute on function public.admin_daily_series(integer) to service_role;
grant execute on function public.admin_active_users(integer) to service_role;
grant execute on function public.admin_top_users(integer) to service_role;
grant execute on function public.admin_user_stats() to service_role;