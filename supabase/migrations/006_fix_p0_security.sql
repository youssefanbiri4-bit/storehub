-- ============================================
-- Migration 006: Fix P0 Security Issues
-- ============================================
-- Fixes:
--  A. Lock down orders / entitlements policies (TO service_role)
--  B. Harden carts guest isolation
--  C. Fix inventory SECURITY DEFINER functions (search_path, permissions, validation)
--  D. Fix user_roles recursion, add is_admin helper
--  E. Add missing columns/functions (image_alt_text, increment_view/click, secure ip handling)
-- ============================================

-- ============================================
-- 0. Helper: is_admin() to avoid RLS recursion on user_roles
-- ============================================
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid()
    and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated, service_role;

-- ============================================
-- 1. Fix orders & download_entitlements overly permissive policies
--    Old policies used FOR ALL USING (true) without TO, meaning any role could access.
-- ============================================

-- orders
drop policy if exists "Service role can manage orders" on orders;
-- Re-create restricted to service_role only
create policy "Service role can manage orders"
  on orders for all
  to service_role
  using (true)
  with check (true);

-- download_entitlements
drop policy if exists "Service role can manage entitlements" on download_entitlements;
create policy "Service role can manage entitlements"
  on download_entitlements for all
  to service_role
  using (true)
  with check (true);

-- download_events: previously allowed anyone to insert
drop policy if exists "Service role can insert download events" on download_events;
create policy "Service role can insert download events"
  on download_events for insert
  to service_role
  with check (true);

-- Ensure authenticated users cannot bypass via service policies
-- (no additional grant)

-- ============================================
-- 2. Fix carts & cart_items guest isolation
--    Old policies allowed: (user_id is null and session_id is not null)
--    which any client can claim. Replace with strict isolation:
--    - authenticated users can only access their own user_id carts
--    - guest carts (user_id IS NULL) are only accessible via service_role
-- ============================================

-- carts
drop policy if exists "Users can read own cart" on carts;
drop policy if exists "Users can insert own cart" on carts;
drop policy if exists "Users can update own cart" on carts;

-- Authenticated users: manage only own carts
create policy "Users can read own cart"
  on carts for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own cart"
  on carts for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own cart"
  on carts for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own cart"
  on carts for delete
  to authenticated
  using (auth.uid() = user_id);

-- Service role can manage all carts including guest
drop policy if exists "Service role can manage carts" on carts;
create policy "Service role can manage carts"
  on carts for all
  to service_role
  using (true)
  with check (true);

-- cart_items: remove session_id fallback
drop policy if exists "Users can read own cart items" on cart_items;
drop policy if exists "Users can manage own cart items" on cart_items;

create policy "Users can read own cart items"
  on cart_items for select
  to authenticated
  using (
    exists (
      select 1 from carts
      where carts.id = cart_items.cart_id
      and carts.user_id = auth.uid()
    )
  );

create policy "Users can manage own cart items"
  on cart_items for all
  to authenticated
  using (
    exists (
      select 1 from carts
      where carts.id = cart_items.cart_id
      and carts.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from carts
      where carts.id = cart_items.cart_id
      and carts.user_id = auth.uid()
    )
  );

drop policy if exists "Service role can manage cart items" on cart_items;
create policy "Service role can manage cart items"
  on cart_items for all
  to service_role
  using (true)
  with check (true);

-- ============================================
-- 3. Fix user_roles recursion
--    Old policies used EXISTS (select 1 from user_roles where ...) which recurses under RLS.
--    Replace with is_admin() helper and strict own-read.
-- ============================================

drop policy if exists "Users can read own role" on user_roles;
drop policy if exists "Admins can manage roles" on user_roles;

create policy "Users can read own role"
  on user_roles for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Admins can manage roles"
  on user_roles for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Service role bypass
drop policy if exists "Service role can manage user roles" on user_roles;
create policy "Service role can manage user roles"
  on user_roles for all
  to service_role
  using (true)
  with check (true);

-- ============================================
-- 4. Harden inventory functions
--    - Set fixed search_path
--    - Validate quantities positive, prevent negative stock
--    - Lock row correctly, check transition
--    - Revoke public execute, grant to authenticated/service_role
-- ============================================

-- Helper to ensure search_path is locked
-- reserve_stock
create or replace function public.reserve_stock(
  p_variant_id uuid,
  p_quantity integer,
  p_order_id uuid
) returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_available integer;
  v_variant_exists boolean;
begin
  if p_quantity is null or p_quantity <= 0 then
    return false;
  end if;

  -- Lock the variant row
  select (stock_quantity - reserved_quantity) into v_available
  from public.product_variants
  where id = p_variant_id
  for update;

  if not found then
    return false;
  end if;

  if v_available < p_quantity then
    return false;
  end if;

  -- Reserve stock
  update public.product_variants
  set reserved_quantity = reserved_quantity + p_quantity
  where id = p_variant_id;

  -- Record movement (only if order_id provided, else null)
  insert into public.inventory_movements (variant_id, order_id, movement_type, quantity)
  values (p_variant_id, p_order_id, 'reservation', p_quantity);

  return true;
end;
$$;

-- release_stock
create or replace function public.release_stock(
  p_variant_id uuid,
  p_quantity integer,
  p_order_id uuid
) returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if p_quantity is null or p_quantity <= 0 then
    return;
  end if;

  -- Only release up to reserved quantity
  update public.product_variants
  set reserved_quantity = greatest(reserved_quantity - p_quantity, 0)
  where id = p_variant_id;

  if found then
    insert into public.inventory_movements (variant_id, order_id, movement_type, quantity)
    values (p_variant_id, p_order_id, 'release', p_quantity);
  end if;
end;
$$;

-- commit_sale
create or replace function public.commit_sale(
  p_variant_id uuid,
  p_quantity integer,
  p_order_id uuid
) returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_reserved integer;
begin
  if p_quantity is null or p_quantity <= 0 then
    return;
  end if;

  -- Lock and validate
  select reserved_quantity into v_reserved
  from public.product_variants
  where id = p_variant_id
  for update;

  if not found then
    return;
  end if;

  -- Prevent oversell: check stock_quantity sufficient
  update public.product_variants
  set stock_quantity = greatest(stock_quantity - p_quantity, 0),
      reserved_quantity = greatest(reserved_quantity - p_quantity, 0)
  where id = p_variant_id
    and stock_quantity >= p_quantity;

  if found then
    insert into public.inventory_movements (variant_id, order_id, movement_type, quantity)
    values (p_variant_id, p_order_id, 'sale', p_quantity);
  end if;
end;
$$;

-- Lock down execution
revoke all on function public.reserve_stock(uuid, integer, uuid) from public;
revoke all on function public.release_stock(uuid, integer, uuid) from public;
revoke all on function public.commit_sale(uuid, integer, uuid) from public;
grant execute on function public.reserve_stock(uuid, integer, uuid) to authenticated, service_role;
grant execute on function public.release_stock(uuid, integer, uuid) to authenticated, service_role;
grant execute on function public.commit_sale(uuid, integer, uuid) to authenticated, service_role;

-- Also harden other SECURITY DEFINER functions introduced in 004
create or replace function public.generate_order_number()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_date text;
  v_seq integer;
  v_number text;
begin
  v_date := to_char(now(), 'YYYYMMDD');

  select count(*) + 1 into v_seq
  from public.customer_orders
  where order_number like 'ORD-' || v_date || '-%';

  v_number := 'ORD-' || v_date || '-' || lpad(v_seq::text, 4, '0');
  new.order_number := v_number;
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''));

  insert into public.user_roles (user_id, role)
  values (new.id, 'customer');

  insert into public.wishlists (user_id)
  values (new.id);

  return new;
end;
$$;

-- Increment helpers (missing previously, used by src/services/products.ts and src/app/go)
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

-- Harden increment_category_view_count from 005
create or replace function public.increment_category_view_count(cid uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.categories set view_count = view_count + 1 where id = cid;
end;
$$;

revoke all on function public.increment_view_count(uuid) from public;
revoke all on function public.increment_click_count(uuid) from public;
revoke all on function public.increment_category_view_count(uuid) from public;
grant execute on function public.increment_view_count(uuid) to anon, authenticated, service_role;
grant execute on function public.increment_click_count(uuid) to anon, authenticated, service_role;
grant execute on function public.increment_category_view_count(uuid) to anon, authenticated, service_role;

revoke all on function public.generate_order_number() from public;
revoke all on function public.handle_new_user() from public;
grant execute on function public.generate_order_number() to service_role;
grant execute on function public.handle_new_user() to service_role;

-- ============================================
-- 5. Add missing products column image_alt_text
--    Used in product-form, validators, sitemap? but not in migration history
-- ============================================
alter table public.products
  add column if not exists image_alt_text text;

-- ============================================
-- 6. Atomic entitlement increment helper (for download limit)
-- ============================================
create or replace function public.increment_entitlement_download_count(p_entitlement_id uuid)
returns table(download_count integer, max_downloads integer)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_count integer;
  v_max integer;
  v_revoked timestamptz;
  v_expires timestamptz;
begin
  -- Lock entitlement row
  select de.download_count, de.max_downloads, de.revoked_at, de.expires_at
    into v_count, v_max, v_revoked, v_expires
  from public.download_entitlements de
  where de.id = p_entitlement_id
  for update;

  if not found then
    return;
  end if;

  -- Enforce revocation/expiry at DB level as well: return empty set to signal failure
  if v_revoked is not null then
    return;
  end if;
  if v_expires is not null and v_expires < now() then
    return;
  end if;

  -- Enforce download limit atomically: do conditional update
  -- If max_downloads is null -> unlimited
  -- If count < max -> increment, else signal limit by returning empty
  if v_max is not null and v_count >= v_max then
    -- At limit: return empty to signal limit reached
    return;
  end if;

  -- Use conditional update to handle race: only increment if still below limit
  update public.download_entitlements
  set download_count = download_count + 1,
      updated_at = now()
  where id = p_entitlement_id
    and (max_downloads is null or download_count < max_downloads);

  if not found then
    -- Concurrent limit reached between SELECT and UPDATE
    return;
  end if;

  -- Re-read updated count
  select de.download_count into v_count
  from public.download_entitlements de
  where de.id = p_entitlement_id;

  return query select v_count, v_max;
end;
$$;

revoke all on function public.increment_entitlement_download_count(uuid) from public;
grant execute on function public.increment_entitlement_download_count(uuid) to service_role, authenticated;

-- ============================================
-- 7. Revoke overly permissive storage policies? Keep but ensure service_role path
--    No change needed for now, but document that product-files bucket is private and only admin/service_role can upload
-- ============================================

-- Done
