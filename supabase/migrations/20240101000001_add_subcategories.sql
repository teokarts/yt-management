-- ============================================================================
-- Reelist — Subcategories
-- Adds a self-referencing parent_id to categories so a category can hold
-- arbitrarily deep subcategories. Idempotent — safe to re-run.
-- ============================================================================

alter table public.categories
  add column if not exists parent_id uuid references public.categories (id) on delete set null;

create index if not exists categories_user_parent_idx
  on public.categories (user_id, parent_id);

-- Prevent a category from being nested inside itself or one of its descendants.
create or replace function public.prevent_category_cycle()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.parent_id is not null then
    if exists (
      with recursive ancestors as (
        select c.id, c.parent_id
        from public.categories c
        where c.id = new.parent_id and c.user_id = new.user_id
        union all
        select c.id, c.parent_id
        from public.categories c
        join ancestors a on c.id = a.parent_id
        where c.user_id = new.user_id
      )
      select 1 from ancestors where id = new.id
    ) then
      raise exception 'A category cannot be nested inside itself';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists set_categories_cycle on public.categories;
create trigger set_categories_cycle
  before insert or update of parent_id on public.categories
  for each row execute procedure public.prevent_category_cycle();