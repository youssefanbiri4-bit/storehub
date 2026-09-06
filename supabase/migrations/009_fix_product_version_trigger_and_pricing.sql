-- ============================================
-- Migration 009: Fix product version trigger + pricing docs
-- - Prevent view_count/click_count increments from creating product_versions (avoid bloat)
-- - Ensure image_alt_text exists (redundant safety)
-- - Ensure increment functions are correctly permissioned
-- ============================================

-- Ensure image_alt_text exists (idempotent)
alter table public.products add column if not exists image_alt_text text;

-- Fix version trigger to ignore counter-only updates
create or replace function public.create_product_version_on_update()
returns trigger as $$
declare
  latest_version integer;
  changed_cols text[] := '{}';
  col_name text;
  old_data jsonb;
  new_data jsonb;
  -- Columns that should NOT trigger a version when changed alone
  ignored_cols text[] := array['updated_at', 'view_count', 'click_count', 'last_link_check'];
begin
  -- Get the latest version number for this product
  select coalesce(max(version_number), 0) into latest_version
  from public.product_versions
  where product_id = NEW.id;

  -- Build changed_fields array by comparing each column
  for col_name in
    select column_name from information_schema.columns
    where table_name = 'products' and table_schema = 'public'
    order by ordinal_position
  loop
    if col_name = any(ignored_cols) then
      continue;
    end if;

    execute format('select to_jsonb($1.%I)', col_name) into old_data using OLD;
    execute format('select to_jsonb($1.%I)', col_name) into new_data using NEW;

    if old_data is distinct from new_data then
      changed_cols := array_append(changed_cols, col_name);
    end if;
  end loop;

  -- Only create a version if something actually changed (excluding ignored)
  if array_length(changed_cols, 1) > 0 then
    insert into public.product_versions (product_id, version_number, data, changed_fields)
    values (
      NEW.id,
      latest_version + 1,
      to_jsonb(NEW),
      changed_cols
    );
  end if;

  return NEW;
end;
$$ language plpgsql;

-- Ensure increment functions are SECURITY DEFINER with locked search_path (from 006) and not creating versions
-- They already have search_path = public, pg_temp and are granted to anon/authenticated/service_role
-- Verify they exist, if not create fallback (idempotent)
create or replace function public.increment_view_count(pid uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.products set view_count = view_count + 1 where id = pid;
end;
$$;

create or replace function public.increment_click_count(pid uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.products set click_count = click_count + 1 where id = pid;
end;
$$;

revoke all on function public.increment_view_count(uuid) from public;
revoke all on function public.increment_click_count(uuid) from public;
grant execute on function public.increment_view_count(uuid) to anon, authenticated, service_role;
grant execute on function public.increment_click_count(uuid) to anon, authenticated, service_role;

-- Document pricing canonical source:
-- base_price_minor is canonical (minor units, integer), price is legacy mirror.
-- Ensure backfill for zero as valid, not falsy
update public.products set base_price_minor = 0 where base_price_minor is null and price = 0;
-- Ensure currency defaults for legacy rows
update public.products set currency = 'MAD' where currency is null or currency = '';

comment on column public.products.base_price_minor is 'Canonical price in minor units (e.g., cents). Use with currency. Zero is valid.';
comment on column public.products.price is 'Legacy price in major units. Mirrored from base_price_minor for transition. Prefer base_price_minor.';
comment on column public.products.compare_at_price_minor is 'Canonical compare-at price in minor units. Null means no compare.';
comment on column public.products.old_price is 'Legacy compare-at price in major units. Mirrored for transition.';
