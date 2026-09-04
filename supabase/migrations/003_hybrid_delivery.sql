-- ============================================
-- Digital Products Hub - Hybrid Delivery System
-- ============================================

-- ============================================
-- 1. Extend products table with delivery fields
-- ============================================

alter table products
  add column if not exists delivery_method text not null default 'external_link'
    check (delivery_method in ('external_link', 'hosted_file')),
  add column if not exists external_platform text,
  add column if not exists hosted_access_type text
    check (hosted_access_type in ('free', 'paid')),
  add column if not exists download_limit integer,
  add column if not exists download_link_expiry_minutes integer not null default 5,
  add column if not exists payment_provider text,
  add column if not exists payment_provider_product_id text,
  add column if not exists payment_provider_price_id text;

-- Backfill existing products: if external_url is set and delivery_method is still default,
-- ensure external_url is preserved
update products set delivery_method = 'external_link'
where delivery_method = 'external_link' and external_url is not null;

-- Add constraints safely (only after backfill)
-- NOTE: These constraints are added as NOT VALID first, then validated.
-- This prevents breaking existing rows during migration.

-- external_url required when delivery_method is external_link
alter table products
  add constraint check_external_url_required
  check (delivery_method <> 'external_link' or external_url is not null) not valid;

-- hosted_access_type required when delivery_method is hosted_file
alter table products
  add constraint check_hosted_access_type_required
  check (delivery_method <> 'hosted_file' or hosted_access_type is not null) not valid;

-- price > 0 when hosted_access_type is paid
alter table products
  add constraint check_paid_requires_price
  check (hosted_access_type <> 'paid' or price > 0) not valid;

-- Validate constraints (safe to run after backfill)
alter table products validate constraint check_external_url_required;
alter table products validate constraint check_hosted_access_type_required;
alter table products validate constraint check_paid_requires_price;

-- ============================================
-- 2. product_files table
-- ============================================

create table if not exists product_files (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  storage_path text not null,
  original_file_name text not null,
  safe_file_name text not null,
  file_extension text,
  mime_type text not null,
  file_size bigint not null,
  version text,
  checksum text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================
-- 3. Enhanced product_clicks (extend existing)
-- ============================================

-- Add columns to existing product_clicks table
alter table product_clicks
  add column if not exists source text,
  add column if not exists medium text,
  add column if not exists campaign text,
  add column if not exists referrer text,
  add column if not exists user_agent text,
  add column if not exists ip_hash text;

-- ============================================
-- 4. download_events table
-- ============================================

create table if not exists download_events (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  file_id uuid not null references product_files(id) on delete cascade,
  entitlement_id uuid,
  user_id uuid,
  customer_email text,
  ip_hash text,
  user_agent text,
  downloaded_at timestamptz not null default now()
);

-- ============================================
-- 5. orders table
-- ============================================

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  customer_email text not null,
  product_id uuid not null references products(id),
  provider text not null,
  provider_order_id text not null,
  amount integer not null,
  currency text not null default 'USD',
  payment_status text not null default 'pending'
    check (payment_status in ('pending', 'paid', 'failed', 'refunded', 'cancelled')),
  provider_payload jsonb,
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  refunded_at timestamptz
);

-- Unique constraint for webhook idempotency
create unique index if not exists idx_orders_provider_unique
  on orders(provider, provider_order_id);

-- ============================================
-- 6. download_entitlements table
-- ============================================

create table if not exists download_entitlements (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id),
  product_id uuid not null references products(id),
  user_id uuid,
  customer_email text,
  max_downloads integer,
  download_count integer not null default 0,
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================
-- 7. Indexes for new tables
-- ============================================

-- product_files
create index if not exists idx_product_files_product_id on product_files(product_id);
create index if not exists idx_product_files_is_active on product_files(is_active);
create index if not exists idx_product_files_product_active on product_files(product_id, is_active);

-- download_events
create index if not exists idx_download_events_product_id on download_events(product_id);
create index if not exists idx_download_events_file_id on download_events(file_id);
create index if not exists idx_download_events_entitlement_id on download_events(entitlement_id);
create index if not exists idx_download_events_user_id on download_events(user_id);
create index if not exists idx_download_events_downloaded_at on download_events(downloaded_at desc);

-- orders
create index if not exists idx_orders_product_id on orders(product_id);
create index if not exists idx_orders_user_id on orders(user_id);
create index if not exists idx_orders_customer_email on orders(customer_email);
create index if not exists idx_orders_payment_status on orders(payment_status);
create index if not exists idx_orders_created_at on orders(created_at desc);

-- download_entitlements
create index if not exists idx_download_entitlements_order_id on download_entitlements(order_id);
create index if not exists idx_download_entitlements_product_id on download_entitlements(product_id);
create index if not exists idx_download_entitlements_user_id on download_entitlements(user_id);
create index if not exists idx_download_entitlements_customer_email on download_entitlements(customer_email);

-- products — delivery method index
create index if not exists idx_products_delivery_method on products(delivery_method);

-- ============================================
-- 8. RLS Policies
-- ============================================

-- Enable RLS
alter table product_files enable row level security;
alter table download_events enable row level security;
alter table orders enable row level security;
alter table download_entitlements enable row level security;

-- ---- product_files: admin can manage, no public read (private files) ----
create policy "Admin can manage product files"
  on product_files for all
  using (auth.email() = coalesce(current_setting('app.admin_email', true), 'admin@example.com'));

-- ---- download_events: admin can read all, users can read own ----
create policy "Admin can view all download events"
  on download_events for select
  using (auth.email() = coalesce(current_setting('app.admin_email', true), 'admin@example.com'));

create policy "Users can view own download events"
  on download_events for select
  using (auth.uid() = user_id);

create policy "Service role can insert download events"
  on download_events for insert
  with check (true);

-- ---- orders: customers can read own, admin can read all ----
create policy "Admin can view all orders"
  on orders for select
  using (auth.email() = coalesce(current_setting('app.admin_email', true), 'admin@example.com'));

create policy "Users can view own orders"
  on orders for select
  using (auth.uid() = user_id);

create policy "Service role can manage orders"
  on orders for all
  using (true);

-- ---- download_entitlements: customers can read own, admin can manage ----
create policy "Admin can manage entitlements"
  on download_entitlements for all
  using (auth.email() = coalesce(current_setting('app.admin_email', true), 'admin@example.com'));

create policy "Users can view own entitlements"
  on download_entitlements for select
  using (auth.uid() = user_id);

create policy "Service role can manage entitlements"
  on download_entitlements for all
  using (true);

-- ============================================
-- 9. updated_at triggers for new tables
-- ============================================

create trigger update_product_files_updated_at
  before update on product_files
  for each row execute function update_updated_at_column();

create trigger update_download_entitlements_updated_at
  before update on download_entitlements
  for each row execute function update_updated_at_column();

-- ============================================
-- 10. Storage buckets (run via Supabase Dashboard or CLI)
-- ============================================

-- These SQL statements create the buckets via the storage API.
-- They must be run with service_role permissions.

-- Bucket: product-images (public)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880,  -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
) on conflict (id) do nothing;

-- Bucket: product-previews (public for intentional previews)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-previews',
  'product-previews',
  true,
  10485760,  -- 10 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'application/pdf']
) on conflict (id) do nothing;

-- Bucket: product-files (private)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-files',
  'product-files',
  false,
  104857600,  -- 100 MB
  array['application/pdf', 'application/zip', 'application/x-zip-compressed', 'text/plain']
) on conflict (id) do nothing;

-- Storage RLS policies

-- product-images: anyone can read, admin can upload/delete
create policy "Public can view product images"
  on storage.objects for select
  using (bucket_id = 'product-images');

create policy "Admin can upload product images"
  on storage.objects for insert
  with check (
    bucket_id = 'product-images'
    and auth.email() = coalesce(current_setting('app.admin_email', true), 'admin@example.com')
  );

create policy "Admin can delete product images"
  on storage.objects for delete
  using (
    bucket_id = 'product-images'
    and auth.email() = coalesce(current_setting('app.admin_email', true), 'admin@example.com')
  );

-- product-previews: anyone can read, admin can upload/delete
create policy "Public can view product previews"
  on storage.objects for select
  using (bucket_id = 'product-previews');

create policy "Admin can upload product previews"
  on storage.objects for insert
  with check (
    bucket_id = 'product-previews'
    and auth.email() = coalesce(current_setting('app.admin_email', true), 'admin@example.com')
  );

create policy "Admin can delete product previews"
  on storage.objects for delete
  using (
    bucket_id = 'product-previews'
    and auth.email() = coalesce(current_setting('app.admin_email', true), 'admin@example.com')
  );

-- product-files: no public read (signed URLs only), admin can upload/delete
create policy "Admin can upload product files"
  on storage.objects for insert
  with check (
    bucket_id = 'product-files'
    and auth.email() = coalesce(current_setting('app.admin_email', true), 'admin@example.com')
  );

create policy "Admin can delete product files"
  on storage.objects for delete
  using (
    bucket_id = 'product-files'
    and auth.email() = coalesce(current_setting('app.admin_email', true), 'admin@example.com')
  );

-- ============================================
-- Done
-- ============================================
