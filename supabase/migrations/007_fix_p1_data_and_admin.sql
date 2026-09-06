-- ============================================
-- Migration 007: P1 Data Integrity + Admin Unification
-- ============================================
-- 1. Unify admin checks to use is_admin() instead of app.admin_email
-- 2. Ensure image_alt_text handling (already added in 006)
-- 3. Ensure base_price_minor vs price consistency
-- 4. Ensure increment functions locked (already in 006)
-- 5. Fix products RLS to use is_admin()
-- ============================================

-- Helper already exists: public.is_admin()

-- ---- Products: replace email-based policy with is_admin ----
drop policy if exists "Admin can manage products" on products;
create policy "Admin can manage products"
  on products for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Keep public read for published
drop policy if exists "Public can view published products" on products;
-- Recreate to ensure hidden/archived handled consistently (from 002)
create policy "Public can view published products"
  on products for select
  using (
    status = 'published'
    and hidden_at is null
    and archived_at is null
  );

-- Service role bypass for products
drop policy if exists "Service role can manage products" on products;
create policy "Service role can manage products"
  on products for all
  to service_role
  using (true)
  with check (true);

-- ---- Categories: similarly unify ----
drop policy if exists "Admin can manage categories" on categories;
create policy "Admin can manage categories"
  on categories for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Service role can manage categories" on categories;
create policy "Service role can manage categories"
  on categories for all
  to service_role
  using (true)
  with check (true);

-- ---- product_files / product_images etc: unify admin checks ----
-- product_files (from 003)
drop policy if exists "Admin can manage product files" on product_files;
create policy "Admin can manage product files"
  on product_files for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Service role can manage product files" on product_files;
create policy "Service role can manage product files"
  on product_files for all
  to service_role
  using (true)
  with check (true);

-- product_images (from 004)
drop policy if exists "Admins can manage product images" on product_images;
create policy "Admins can manage product images"
  on product_images for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- product_variants
drop policy if exists "Admins can manage variants" on product_variants;
create policy "Admins can manage variants"
  on product_variants for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- product_options / values
drop policy if exists "Admins can manage product options" on product_options;
create policy "Admins can manage product options"
  on product_options for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can manage product option values" on product_option_values;
create policy "Admins can manage product option values"
  on product_option_values for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Brands
drop policy if exists "Admins can manage brands" on brands;
create policy "Admins can manage brands"
  on brands for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Addresses remain user-owned, no change

-- Ensure base_price_minor backfill handles zero correctly (preserve 0 as 0, not null)
-- Previously backfilled only where price > 0; keep zero distinct from null
update public.products
  set base_price_minor = 0
  where base_price_minor is null and price = 0;

-- Ensure currency defaults for legacy rows
update public.products
  set currency = 'MAD'
  where currency is null or currency = '';

-- Create index for is_free + stock handling
create index if not exists idx_products_is_free on products(is_free);
create index if not exists idx_products_base_price_zero on products(base_price_minor) where base_price_minor = 0;

-- Done
