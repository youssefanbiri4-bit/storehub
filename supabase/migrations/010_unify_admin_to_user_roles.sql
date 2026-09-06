-- ============================================
-- Migration 010: Unify admin to user_roles (is_admin)
-- Remove all ADMIN_EMAIL / app.admin_email fallbacks
-- Fix remaining RLS self-reference and storage policies
-- ============================================

-- Ensure helper exists
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
-- products (ensure consistent)
-- ============================================
drop policy if exists "Admin can manage products" on public.products;
create policy "Admin can manage products"
  on public.products for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Service role can manage products" on public.products;
create policy "Service role can manage products"
  on public.products for all
  to service_role
  using (true) with check (true);

-- Keep public read
drop policy if exists "Public can view published products" on public.products;
create policy "Public can view published products"
  on public.products for select
  using (status = 'published' and hidden_at is null and archived_at is null);

-- ============================================
-- categories
-- ============================================
drop policy if exists "Admin can manage categories" on public.categories;
create policy "Admin can manage categories"
  on public.categories for all
  to authenticated
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Service role can manage categories" on public.categories;
create policy "Service role can manage categories"
  on public.categories for all to service_role using (true) with check (true);
drop policy if exists "Public can view categories" on public.categories;
create policy "Public can view categories" on public.categories for select using (true);

-- ============================================
-- product_clicks / product_views
-- ============================================
drop policy if exists "Admin can view clicks" on public.product_clicks;
create policy "Admin can view clicks" on public.product_clicks for select to authenticated using (public.is_admin());
drop policy if exists "Service role can manage clicks" on public.product_clicks;
create policy "Service role can manage clicks" on public.product_clicks for all to service_role using (true) with check (true);
-- keep Anyone can track clicks (insert with check true) for anon

drop policy if exists "Admin can view views" on public.product_views;
create policy "Admin can view views" on public.product_views for select to authenticated using (public.is_admin());
drop policy if exists "Service role can manage views" on public.product_views;
create policy "Service role can manage views" on public.product_views for all to service_role using (true) with check (true);

-- ============================================
-- product_versions
-- ============================================
drop policy if exists "Admin can manage product versions" on public.product_versions;
create policy "Admin can manage product versions" on public.product_versions for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Service role can manage product versions" on public.product_versions;
create policy "Service role can manage product versions" on public.product_versions for all to service_role using (true) with check (true);

-- ============================================
-- activity_logs
-- ============================================
drop policy if exists "Admin can view activity logs" on public.activity_logs;
drop policy if exists "Admin can insert activity logs" on public.activity_logs;
create policy "Admin can view activity logs" on public.activity_logs for select to authenticated using (public.is_admin());
create policy "Admin can insert activity logs" on public.activity_logs for insert to authenticated with check (public.is_admin());
drop policy if exists "Service role can manage activity logs" on public.activity_logs;
create policy "Service role can manage activity logs" on public.activity_logs for all to service_role using (true) with check (true);

-- ============================================
-- media_library
-- ============================================
drop policy if exists "Admin can manage media library" on public.media_library;
create policy "Admin can manage media library" on public.media_library for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Service role can manage media library" on public.media_library;
create policy "Service role can manage media library" on public.media_library for all to service_role using (true) with check (true);

-- ============================================
-- campaigns
-- ============================================
drop policy if exists "Admin can manage campaigns" on public.campaigns;
create policy "Admin can manage campaigns" on public.campaigns for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Service role can manage campaigns" on public.campaigns;
create policy "Service role can manage campaigns" on public.campaigns for all to service_role using (true) with check (true);

-- ============================================
-- admin_notifications
-- ============================================
drop policy if exists "Admin can manage notifications" on public.admin_notifications;
create policy "Admin can manage notifications" on public.admin_notifications for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Service role can manage notifications" on public.admin_notifications;
create policy "Service role can manage notifications" on public.admin_notifications for all to service_role using (true) with check (true);

-- ============================================
-- product_faqs / product_complements
-- ============================================
drop policy if exists "Admin can manage product FAQs" on public.product_faqs;
create policy "Admin can manage product FAQs" on public.product_faqs for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Service role can manage product FAQs" on public.product_faqs;
create policy "Service role can manage product FAQs" on public.product_faqs for all to service_role using (true) with check (true);
-- public can view remains

drop policy if exists "Admin can manage product complements" on public.product_complements;
create policy "Admin can manage product complements" on public.product_complements for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Service role can manage product complements" on public.product_complements;
create policy "Service role can manage product complements" on public.product_complements for all to service_role using (true) with check (true);

-- ============================================
-- category_views / search_queries
-- ============================================
drop policy if exists "Admin can view category views" on public.category_views;
create policy "Admin can view category views" on public.category_views for select to authenticated using (public.is_admin());
drop policy if exists "Service role can manage category views" on public.category_views;
create policy "Service role can manage category views" on public.category_views for all to service_role using (true) with check (true);

drop policy if exists "Admin can view search queries" on public.search_queries;
create policy "Admin can view search queries" on public.search_queries for select to authenticated using (public.is_admin());
drop policy if exists "Service role can manage search queries" on public.search_queries;
create policy "Service role can manage search queries" on public.search_queries for all to service_role using (true) with check (true);

-- ============================================
-- product_files (003) / download_events / orders / download_entitlements
-- ============================================
drop policy if exists "Admin can manage product files" on public.product_files;
create policy "Admin can manage product files" on public.product_files for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Service role can manage product files" on public.product_files;
create policy "Service role can manage product files" on public.product_files for all to service_role using (true) with check (true);

drop policy if exists "Admin can view all download events" on public.download_events;
create policy "Admin can view all download events" on public.download_events for select to authenticated using (public.is_admin());
-- Users can view own remains, Service role insert already exists in 006

drop policy if exists "Admin can view all orders" on public.orders;
create policy "Admin can view all orders" on public.orders for select to authenticated using (public.is_admin());

drop policy if exists "Admin can manage entitlements" on public.download_entitlements;
create policy "Admin can manage entitlements" on public.download_entitlements for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ============================================
-- profiles
-- ============================================
drop policy if exists "Admins can read all profiles" on public.profiles;
create policy "Admins can read all profiles" on public.profiles for select to authenticated using (public.is_admin());
drop policy if exists "Service role can manage profiles" on public.profiles;
create policy "Service role can manage profiles" on public.profiles for all to service_role using (true) with check (true);

-- ============================================
-- storage.objects (buckets)
-- ============================================
-- product-images
drop policy if exists "Admin can upload product images" on storage.objects;
create policy "Admin can upload product images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'product-images' and public.is_admin());
drop policy if exists "Admin can delete product images" on storage.objects;
create policy "Admin can delete product images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'product-images' and public.is_admin());
drop policy if exists "Service role can manage product images" on storage.objects;
create policy "Service role can manage product images"
  on storage.objects for all to service_role using (bucket_id = 'product-images') with check (bucket_id = 'product-images');

-- product-previews
drop policy if exists "Admin can upload product previews" on storage.objects;
create policy "Admin can upload product previews"
  on storage.objects for insert to authenticated with check (bucket_id = 'product-previews' and public.is_admin());
drop policy if exists "Admin can delete product previews" on storage.objects;
create policy "Admin can delete product previews"
  on storage.objects for delete to authenticated using (bucket_id = 'product-previews' and public.is_admin());
drop policy if exists "Service role can manage product previews" on storage.objects;
create policy "Service role can manage product previews"
  on storage.objects for all to service_role using (bucket_id = 'product-previews') with check (bucket_id = 'product-previews');

-- product-files (private bucket)
drop policy if exists "Admin can upload product files" on storage.objects;
create policy "Admin can upload product files"
  on storage.objects for insert to authenticated with check (bucket_id = 'product-files' and public.is_admin());
drop policy if exists "Admin can delete product files" on storage.objects;
create policy "Admin can delete product files"
  on storage.objects for delete to authenticated using (bucket_id = 'product-files' and public.is_admin());
drop policy if exists "Service role can manage product files storage" on storage.objects;
create policy "Service role can manage product files storage"
  on storage.objects for all to service_role using (bucket_id = 'product-files') with check (bucket_id = 'product-files');

-- ============================================
-- 004 remaining: unify those that used exists(...) to is_admin for consistency
-- ============================================
drop policy if exists "Admins can manage brands" on public.brands;
create policy "Admins can manage brands" on public.brands for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins can manage variants" on public.product_variants;
create policy "Admins can manage variants" on public.product_variants for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins can manage product images" on public.product_images;
create policy "Admins can manage product images" on public.product_images for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins can manage product options" on public.product_options;
create policy "Admins can manage product options" on public.product_options for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins can manage product option values" on public.product_option_values;
create policy "Admins can manage product option values" on public.product_option_values for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins can manage orders" on public.customer_orders;
create policy "Admins can manage orders" on public.customer_orders for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins can manage order items" on public.order_items;
create policy "Admins can manage order items" on public.order_items for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins can manage inventory" on public.inventory_movements;
create policy "Admins can manage inventory" on public.inventory_movements for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins can manage shipping zones" on public.shipping_zones;
create policy "Admins can manage shipping zones" on public.shipping_zones for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins can manage shipping methods" on public.shipping_methods;
create policy "Admins can manage shipping methods" on public.shipping_methods for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins can manage shipments" on public.shipments;
create policy "Admins can manage shipments" on public.shipments for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins can manage payments" on public.payments;
create policy "Admins can manage payments" on public.payments for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins can read payment events" on public.payment_events;
create policy "Admins can read payment events" on public.payment_events for select to authenticated using (public.is_admin());

drop policy if exists "Admins can manage coupons" on public.coupons;
create policy "Admins can manage coupons" on public.coupons for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins can manage coupon usages" on public.coupon_usages;
create policy "Admins can manage coupon usages" on public.coupon_usages for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins can read activity logs" on public.admin_activity_logs;
create policy "Admins can read activity logs" on public.admin_activity_logs for select to authenticated using (public.is_admin());
drop policy if exists "Admins can insert activity logs" on public.admin_activity_logs;
create policy "Admins can insert activity logs" on public.admin_activity_logs for insert to authenticated with check (public.is_admin());

-- user_roles already unified in 006, ensure service role bypass remains
drop policy if exists "Service role can manage user roles" on public.user_roles;
create policy "Service role can manage user roles" on public.user_roles for all to service_role using (true) with check (true);

-- contact_messages
drop policy if exists "Admins can manage contact messages" on public.contact_messages;
create policy "Admins can manage contact messages" on public.contact_messages for all to authenticated using (public.is_admin()) with check (public.is_admin());
