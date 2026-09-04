-- ============================================
-- Migration 004: Physical Product E-Commerce
-- ============================================
-- Converts the digital-product marketplace into a full physical-product
-- e-commerce platform. Preserves all existing data while adding new tables
-- and columns for physical products, authentication, cart, checkout, orders,
-- shipping, inventory, and payments.
--
-- Safe to run: All new tables use CREATE TABLE IF NOT EXISTS.
-- New columns use ADD COLUMN IF NOT EXISTS.
-- Existing data is preserved.

-- ============================================
-- 1. PROFILES (extends auth.users)
-- ============================================

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  avatar_path text,
  preferred_language text not null default 'en',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================
-- 2. USER ROLES
-- ============================================

create table if not exists user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('customer', 'admin')),
  created_at timestamptz not null default now()
);

-- Seed admin role from env var (run once, safe to re-run)
-- The application sets this via set_config in the server client.

-- ============================================
-- 3. BRANDS
-- ============================================

create table if not exists brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  logo_path text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_brands_slug on brands(slug);
create index if not exists idx_brands_status on brands(status);

-- ============================================
-- 4. EXTEND CATEGORIES (add parent + status)
-- ============================================

alter table categories
  add column if not exists parent_id uuid references categories(id) on delete set null,
  add column if not exists status text not null default 'active'
    check (status in ('active', 'inactive')),
  add column if not exists brand_id uuid references brands(id) on delete set null;

create index if not exists idx_categories_parent_id on categories(parent_id);
create index if not exists idx_categories_status on categories(status);

-- ============================================
-- 5. EXTEND PRODUCTS (physical product fields)
-- ============================================

-- Add physical-product columns
alter table products
  add column if not exists brand_id uuid references brands(id) on delete set null,
  add column if not exists base_price_minor bigint,
  add column if not exists compare_at_price_minor bigint,
  add column if not exists weight_grams integer,
  add column if not exists length_mm integer,
  add column if not exists width_mm integer,
  add column if not exists height_mm integer,
  add column if not exists requires_shipping boolean not null default true,
  add column if not exists stock_quantity integer not null default 0,
  add column if not exists reserved_quantity integer not null default 0,
  add column if not exists sku text,
  add column if not exists published_at timestamptz;

-- Backfill base_price_minor from existing price (numeric * 100)
update products
  set base_price_minor = round(price * 100)::bigint
  where base_price_minor is null and price > 0;

-- Backfill published_at from created_at for published products
update products
  set published_at = created_at
  where published_at is null and (status = 'published' or is_published = true);

-- Create indexes for new columns
create index if not exists idx_products_brand_id on products(brand_id);
create index if not exists idx_products_base_price_minor on products(base_price_minor);
create index if not exists idx_products_stock_quantity on products(stock_quantity);
create index if not exists idx_products_requires_shipping on products(requires_shipping);

-- ============================================
-- 6. PRODUCT OPTIONS (reusable option definitions)
-- ============================================

create table if not exists product_options (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_product_options_product_id on product_options(product_id);

-- ============================================
-- 7. PRODUCT OPTION VALUES
-- ============================================

create table if not exists product_option_values (
  id uuid primary key default gen_random_uuid(),
  option_id uuid not null references product_options(id) on delete cascade,
  value text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_product_option_values_option_id on product_option_values(option_id);

-- ============================================
-- 8. PRODUCT VARIANTS
-- ============================================

create table if not exists product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  sku text not null unique,
  title text,
  option_values jsonb not null default '{}'::jsonb,
  price_minor bigint,
  compare_at_price_minor bigint,
  stock_quantity integer not null default 0,
  reserved_quantity integer not null default 0,
  image_id uuid,
  weight_grams integer,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_product_variants_product_id on product_variants(product_id);
create index if not exists idx_product_variants_sku on product_variants(sku);
create index if not exists idx_product_variants_is_active on product_variants(is_active);
create index if not exists idx_product_variants_stock on product_variants(stock_quantity, reserved_quantity);

-- ============================================
-- 9. PRODUCT IMAGES
-- ============================================

create table if not exists product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  storage_path text not null,
  alt_text text,
  sort_order integer not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_product_images_product_id on product_images(product_id);
create index if not exists idx_product_images_is_primary on product_images(is_primary);

-- ============================================
-- 10. ADDRESSES (customer shipping addresses)
-- ============================================

create table if not exists addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null default 'home',
  full_name text not null,
  phone text not null,
  country_code text not null,
  city text not null,
  region text,
  postal_code text,
  address_line_1 text not null,
  address_line_2 text,
  delivery_notes text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_addresses_user_id on addresses(user_id);
create index if not exists idx_addresses_country_code on addresses(country_code);
create index if not exists idx_addresses_is_default on addresses(user_id, is_default);

-- ============================================
-- 11. CARTS & CART ITEMS
-- ============================================

create table if not exists carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  session_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Ensure either user_id or session_id is set
alter table carts
  add constraint carts_user_or_session_check
  check (user_id is not null or session_id is not null);

create unique index if not exists idx_carts_user_id on carts(user_id) where user_id is not null;
create index if not exists idx_carts_session_id on carts(session_id) where session_id is not null;

create table if not exists cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references carts(id) on delete cascade,
  variant_id uuid not null references product_variants(id) on delete cascade,
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(cart_id, variant_id)
);

create index if not exists idx_cart_items_cart_id on cart_items(cart_id);
create index if not exists idx_cart_items_variant_id on cart_items(variant_id);

-- ============================================
-- 12. WISHLISTS & WISHLIST ITEMS
-- ============================================

create table if not exists wishlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create unique index if not exists idx_wishlists_user_id on wishlists(user_id);

create table if not exists wishlist_items (
  id uuid primary key default gen_random_uuid(),
  wishlist_id uuid not null references wishlists(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(wishlist_id, product_id)
);

create index if not exists idx_wishlist_items_wishlist_id on wishlist_items(wishlist_id);
create index if not exists idx_wishlist_items_product_id on wishlist_items(product_id);

-- ============================================
-- 13. ORDERS (physical product orders)
-- ============================================

create table if not exists customer_orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  user_id uuid not null references auth.users(id),
  status text not null default 'pending_payment'
    check (status in (
      'pending_payment', 'pending_confirmation', 'confirmed',
      'processing', 'ready_to_ship', 'shipped', 'delivered',
      'cancelled', 'refunded', 'returned'
    )),
  payment_method text not null
    check (payment_method in ('cash_on_delivery', 'online_payment')),
  payment_status text not null default 'unpaid'
    check (payment_status in (
      'unpaid', 'pending', 'paid', 'failed',
      'refunded', 'partially_refunded', 'cancelled'
    )),
  fulfillment_status text not null default 'unfulfilled'
    check (fulfillment_status in (
      'unfulfilled', 'processing', 'ready', 'shipped', 'delivered', 'returned'
    )),
  currency text not null default 'MAD',
  subtotal_minor bigint not null,
  discount_minor bigint not null default 0,
  shipping_minor bigint not null default 0,
  tax_minor bigint not null default 0,
  total_minor bigint not null,
  shipping_address_snapshot jsonb not null,
  billing_address_snapshot jsonb,
  customer_email text not null,
  customer_phone text,
  customer_notes text,
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_customer_orders_user_id on customer_orders(user_id);
create index if not exists idx_customer_orders_status on customer_orders(status);
create index if not exists idx_customer_orders_payment_status on customer_orders(payment_status);
create index if not exists idx_customer_orders_order_number on customer_orders(order_number);
create index if not exists idx_customer_orders_created_at on customer_orders(created_at desc);

-- ============================================
-- 14. ORDER ITEMS (product snapshots)
-- ============================================

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references customer_orders(id) on delete cascade,
  product_id uuid,
  variant_id uuid,
  product_name text not null,
  variant_name text,
  sku text not null,
  product_image text,
  unit_price_minor bigint not null,
  quantity integer not null,
  line_total_minor bigint not null,
  option_values jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_order_items_order_id on order_items(order_id);
create index if not exists idx_order_items_product_id on order_items(product_id);
create index if not exists idx_order_items_variant_id on order_items(variant_id);

-- ============================================
-- 15. INVENTORY MOVEMENTS
-- ============================================

create table if not exists inventory_movements (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references product_variants(id) on delete cascade,
  order_id uuid references customer_orders(id) on delete set null,
  movement_type text not null
    check (movement_type in ('sale', 'restock', 'adjustment', 'reservation', 'release', 'return')),
  quantity integer not null,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_inventory_movements_variant_id on inventory_movements(variant_id);
create index if not exists idx_inventory_movements_order_id on inventory_movements(order_id);
create index if not exists idx_inventory_movements_created_at on inventory_movements(created_at desc);

-- ============================================
-- 16. SHIPPING ZONES, METHODS & RATES
-- ============================================

create table if not exists shipping_zones (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('domestic', 'international')),
  countries text[] default '{}',
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_shipping_zones_type on shipping_zones(type);

create table if not exists shipping_methods (
  id uuid primary key default gen_random_uuid(),
  zone_id uuid not null references shipping_zones(id) on delete cascade,
  name text not null,
  description text,
  base_rate_minor bigint not null default 0,
  per_kg_rate_minor bigint not null default 0,
  free_shipping_threshold_minor bigint,
  estimated_days_min integer,
  estimated_days_max integer,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_shipping_methods_zone_id on shipping_methods(zone_id);

-- ============================================
-- 17. SHIPMENTS
-- ============================================

create table if not exists shipments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references customer_orders(id) on delete cascade,
  shipping_method_id uuid references shipping_methods(id) on delete set null,
  carrier text,
  tracking_number text,
  tracking_url text,
  status text not null default 'pending'
    check (status in ('pending', 'label_created', 'in_transit', 'out_for_delivery', 'delivered', 'returned')),
  shipped_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_shipments_order_id on shipments(order_id);
create index if not exists idx_shipments_status on shipments(status);

-- ============================================
-- 18. PAYMENTS
-- ============================================

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references customer_orders(id) on delete cascade,
  provider text,
  provider_payment_id text,
  method text not null,
  status text not null default 'pending',
  amount_minor bigint not null,
  currency text not null default 'MAD',
  paid_at timestamptz,
  refunded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_payments_order_id on payments(order_id);
create index if not exists idx_payments_provider_payment_id on payments(provider_payment_id);
create index if not exists idx_payments_status on payments(status);

create table if not exists payment_events (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid references payments(id) on delete cascade,
  provider text not null,
  provider_event_id text not null,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(provider, provider_event_id)
);

create index if not exists idx_payment_events_payment_id on payment_events(payment_id);
create index if not exists idx_payment_events_provider_event on payment_events(provider, provider_event_id);

-- ============================================
-- 19. COUPONS
-- ============================================

create table if not exists coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text,
  discount_type text not null check (discount_type in ('percentage', 'fixed')),
  discount_value_minor bigint not null,
  minimum_order_minor bigint default 0,
  usage_limit integer,
  usage_count integer not null default 0,
  per_user_limit integer default 1,
  applies_to text default 'all' check (applies_to in ('all', 'morocco_only', 'international_only', 'specific_products', 'specific_categories')),
  applies_to_ids uuid[] default '{}',
  starts_at timestamptz,
  expires_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_coupons_code on coupons(code);
create index if not exists idx_coupons_is_active on coupons(is_active);

create table if not exists coupon_usages (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references coupons(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  order_id uuid references customer_orders(id) on delete set null,
  used_at timestamptz not null default now()
);

create index if not exists idx_coupon_usages_coupon_id on coupon_usages(coupon_id);
create index if not exists idx_coupon_usages_user_id on coupon_usages(user_id);

-- ============================================
-- 20. ADMIN ACTIVITY LOGS
-- ============================================

create table if not exists admin_activity_logs (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid references auth.users(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_admin_activity_logs_admin_user_id on admin_activity_logs(admin_user_id);
create index if not exists idx_admin_activity_logs_entity on admin_activity_logs(entity_type, entity_id);
create index if not exists idx_admin_activity_logs_created_at on admin_activity_logs(created_at desc);

-- ============================================
-- 21. SEED DEFAULT SHIPPING ZONES
-- ============================================

-- Morocco domestic zones
insert into shipping_zones (name, type, countries, sort_order)
values
  ('Morocco — Major Cities', 'domestic', ARRAY['MA'], 1),
  ('Morocco — Standard Regions', 'domestic', ARRAY['MA'], 2),
  ('Morocco — Remote Areas', 'domestic', ARRAY['MA'], 3)
on conflict do nothing;

-- International zones
insert into shipping_zones (name, type, countries, sort_order)
values
  ('Europe', 'international', ARRAY['FR','DE','ES','IT','NL','BE','PT','GB','IE','AT','CH','SE','NO','DK','FI','PL','CZ','RO','HU','BG','HR','SK','SI','LT','LV','EE','LU','MT','CY','GR'], 10),
  ('North America', 'international', ARRAY['US','CA','MX'], 20),
  ('Middle East', 'international', ARRAY['AE','SA','QA','BH','KW','OM','JO','LB','EG','TR'], 30),
  ('Africa', 'international', ARRAY['TN','DZ','SN','NG','KE','ZA','GH','CI'], 40),
  ('Asia & Pacific', 'international', ARRAY['IN','CN','JP','KR','TH','VN','ID','MY','PH','AU','NZ'], 50),
  ('Other', 'international', ARRAY[]::text[], 60)
on conflict do nothing;

-- Seed default shipping methods for Morocco
insert into shipping_methods (zone_id, name, description, base_rate_minor, per_kg_rate_minor, free_shipping_threshold_minor, estimated_days_min, estimated_days_max, sort_order)
select sz.id, 'Standard Delivery', 'Standard shipping within Morocco', 3000, 500, 50000, 3, 7, 1
from shipping_zones sz where sz.name = 'Morocco — Major Cities' and sz.type = 'domestic'
on conflict do nothing;

insert into shipping_methods (zone_id, name, description, base_rate_minor, per_kg_rate_minor, free_shipping_threshold_minor, estimated_days_min, estimated_days_max, sort_order)
select sz.id, 'Express Delivery', 'Express shipping within Morocco', 6000, 800, null, 1, 3, 2
from shipping_zones sz where sz.name = 'Morocco — Major Cities' and sz.type = 'domestic'
on conflict do nothing;

-- ============================================
-- 22. UPDATED_AT TRIGGERS
-- ============================================

-- Add triggers for all new tables with updated_at
do $$
declare
  t text;
begin
  for t in
    select unnest(array[
      'profiles', 'brands', 'product_variants', 'addresses',
      'carts', 'cart_items', 'customer_orders', 'shipments',
      'payments', 'coupons', 'coupon_usages', 'shipping_zones',
      'shipping_methods'
    ])
  loop
    execute format(
      'create trigger update_%s_updated_at before update on %I for each row execute function update_updated_at_column()',
      t, t
    );
  end loop;
exception
  when duplicate_object then null;
end $$;

-- ============================================
-- 23. ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all new tables
alter table profiles enable row level security;
alter table user_roles enable row level security;
alter table brands enable row level security;
alter table product_options enable row level security;
alter table product_option_values enable row level security;
alter table product_variants enable row level security;
alter table product_images enable row level security;
alter table addresses enable row level security;
alter table carts enable row level security;
alter table cart_items enable row level security;
alter table wishlists enable row level security;
alter table wishlist_items enable row level security;
alter table customer_orders enable row level security;
alter table order_items enable row level security;
alter table inventory_movements enable row level security;
alter table shipping_zones enable row level security;
alter table shipping_methods enable row level security;
alter table shipments enable row level security;
alter table payments enable row level security;
alter table payment_events enable row level security;
alter table coupons enable row level security;
alter table coupon_usages enable row level security;
alter table admin_activity_logs enable row level security;

-- ---- PROFILES ----
drop policy if exists "Customers can read own profile" on profiles;
create policy "Customers can read own profile"
  on profiles for select
  using (auth.uid() = id);

drop policy if exists "Customers can update own profile" on profiles;
create policy "Customers can update own profile"
  on profiles for update
  using (auth.uid() = id);

drop policy if exists "Customers can insert own profile" on profiles;
create policy "Customers can insert own profile"
  on profiles for insert
  with check (auth.uid() = id);

drop policy if exists "Admins can read all profiles" on profiles;
create policy "Admins can read all profiles"
  on profiles for select
  using (
    exists (select 1 from user_roles where user_id = auth.uid() and role = 'admin')
  );

-- ---- USER ROLES ----
drop policy if exists "Users can read own role" on user_roles;
create policy "Users can read own role"
  on user_roles for select
  using (auth.uid() = user_id);

drop policy if exists "Admins can manage roles" on user_roles;
create policy "Admins can manage roles"
  on user_roles for all
  using (
    exists (select 1 from user_roles where user_id = auth.uid() and role = 'admin')
  );

-- ---- BRANDS ----
drop policy if exists "Public can read active brands" on brands;
create policy "Public can read active brands"
  on brands for select
  using (status = 'active');

drop policy if exists "Admins can manage brands" on brands;
create policy "Admins can manage brands"
  on brands for all
  using (
    exists (select 1 from user_roles where user_id = auth.uid() and role = 'admin')
  );

-- ---- PRODUCT OPTIONS ----
drop policy if exists "Public can read product options" on product_options;
create policy "Public can read product options"
  on product_options for select
  using (true);

drop policy if exists "Admins can manage product options" on product_options;
create policy "Admins can manage product options"
  on product_options for all
  using (
    exists (select 1 from user_roles where user_id = auth.uid() and role = 'admin')
  );

-- ---- PRODUCT OPTION VALUES ----
drop policy if exists "Public can read product option values" on product_option_values;
create policy "Public can read product option values"
  on product_option_values for select
  using (true);

drop policy if exists "Admins can manage product option values" on product_option_values;
create policy "Admins can manage product option values"
  on product_option_values for all
  using (
    exists (select 1 from user_roles where user_id = auth.uid() and role = 'admin')
  );

-- ---- PRODUCT VARIANTS ----
drop policy if exists "Public can read active variants" on product_variants;
create policy "Public can read active variants"
  on product_variants for select
  using (
    is_active = true
    and exists (
      select 1 from products
      where products.id = product_variants.product_id
      and products.status = 'published'
      and products.hidden_at is null
      and products.archived_at is null
    )
  );

drop policy if exists "Admins can manage variants" on product_variants;
create policy "Admins can manage variants"
  on product_variants for all
  using (
    exists (select 1 from user_roles where user_id = auth.uid() and role = 'admin')
  );

-- ---- PRODUCT IMAGES ----
drop policy if exists "Public can read product images" on product_images;
create policy "Public can read product images"
  on product_images for select
  using (true);

drop policy if exists "Admins can manage product images" on product_images;
create policy "Admins can manage product images"
  on product_images for all
  using (
    exists (select 1 from user_roles where user_id = auth.uid() and role = 'admin')
  );

-- ---- ADDRESSES ----
drop policy if exists "Customers can read own addresses" on addresses;
create policy "Customers can read own addresses"
  on addresses for select
  using (auth.uid() = user_id);

drop policy if exists "Customers can insert own addresses" on addresses;
create policy "Customers can insert own addresses"
  on addresses for insert
  with check (auth.uid() = user_id);

drop policy if exists "Customers can update own addresses" on addresses;
create policy "Customers can update own addresses"
  on addresses for update
  using (auth.uid() = user_id);

drop policy if exists "Customers can delete own addresses" on addresses;
create policy "Customers can delete own addresses"
  on addresses for delete
  using (auth.uid() = user_id);

-- ---- CARTS ----
drop policy if exists "Users can read own cart" on carts;
create policy "Users can read own cart"
  on carts for select
  using (
    auth.uid() = user_id
    or (user_id is null and session_id is not null)
  );

drop policy if exists "Users can insert own cart" on carts;
create policy "Users can insert own cart"
  on carts for insert
  with check (true);

drop policy if exists "Users can update own cart" on carts;
create policy "Users can update own cart"
  on carts for update
  using (
    auth.uid() = user_id
    or (user_id is null and session_id is not null)
  );

-- ---- CART ITEMS ----
drop policy if exists "Users can read own cart items" on cart_items;
create policy "Users can read own cart items"
  on cart_items for select
  using (
    exists (
      select 1 from carts
      where carts.id = cart_items.cart_id
      and (carts.user_id = auth.uid() or (carts.user_id is null and carts.session_id is not null))
    )
  );

drop policy if exists "Users can manage own cart items" on cart_items;
create policy "Users can manage own cart items"
  on cart_items for all
  using (
    exists (
      select 1 from carts
      where carts.id = cart_items.cart_id
      and (carts.user_id = auth.uid() or (carts.user_id is null and carts.session_id is not null))
    )
  );

-- ---- WISHLISTS ----
drop policy if exists "Customers can read own wishlist" on wishlists;
create policy "Customers can read own wishlist"
  on wishlists for select
  using (auth.uid() = user_id);

drop policy if exists "Customers can manage own wishlist" on wishlists;
create policy "Customers can manage own wishlist"
  on wishlists for all
  using (auth.uid() = user_id);

-- ---- WISHLIST ITEMS ----
drop policy if exists "Customers can read own wishlist items" on wishlist_items;
create policy "Customers can read own wishlist items"
  on wishlist_items for select
  using (
    exists (
      select 1 from wishlists
      where wishlists.id = wishlist_items.wishlist_id
      and wishlists.user_id = auth.uid()
    )
  );

drop policy if exists "Customers can manage own wishlist items" on wishlist_items;
create policy "Customers can manage own wishlist items"
  on wishlist_items for all
  using (
    exists (
      select 1 from wishlists
      where wishlists.id = wishlist_items.wishlist_id
      and wishlists.user_id = auth.uid()
    )
  );

-- ---- CUSTOMER ORDERS ----
drop policy if exists "Customers can read own orders" on customer_orders;
create policy "Customers can read own orders"
  on customer_orders for select
  using (auth.uid() = user_id);

drop policy if exists "Admins can manage orders" on customer_orders;
create policy "Admins can manage orders"
  on customer_orders for all
  using (
    exists (select 1 from user_roles where user_id = auth.uid() and role = 'admin')
  );

-- ---- ORDER ITEMS ----
drop policy if exists "Customers can read own order items" on order_items;
create policy "Customers can read own order items"
  on order_items for select
  using (
    exists (
      select 1 from customer_orders
      where customer_orders.id = order_items.order_id
      and customer_orders.user_id = auth.uid()
    )
  );

drop policy if exists "Admins can manage order items" on order_items;
create policy "Admins can manage order items"
  on order_items for all
  using (
    exists (select 1 from user_roles where user_id = auth.uid() and role = 'admin')
  );

-- ---- INVENTORY MOVEMENTS ----
drop policy if exists "Admins can manage inventory" on inventory_movements;
create policy "Admins can manage inventory"
  on inventory_movements for all
  using (
    exists (select 1 from user_roles where user_id = auth.uid() and role = 'admin')
  );

-- ---- SHIPPING ZONES ----
drop policy if exists "Public can read active shipping zones" on shipping_zones;
create policy "Public can read active shipping zones"
  on shipping_zones for select
  using (is_active = true);

drop policy if exists "Admins can manage shipping zones" on shipping_zones;
create policy "Admins can manage shipping zones"
  on shipping_zones for all
  using (
    exists (select 1 from user_roles where user_id = auth.uid() and role = 'admin')
  );

-- ---- SHIPPING METHODS ----
drop policy if exists "Public can read active shipping methods" on shipping_methods;
create policy "Public can read active shipping methods"
  on shipping_methods for select
  using (is_active = true);

drop policy if exists "Admins can manage shipping methods" on shipping_methods;
create policy "Admins can manage shipping methods"
  on shipping_methods for all
  using (
    exists (select 1 from user_roles where user_id = auth.uid() and role = 'admin')
  );

-- ---- SHIPMENTS ----
drop policy if exists "Customers can read own shipments" on shipments;
create policy "Customers can read own shipments"
  on shipments for select
  using (
    exists (
      select 1 from customer_orders
      where customer_orders.id = shipments.order_id
      and customer_orders.user_id = auth.uid()
    )
  );

drop policy if exists "Admins can manage shipments" on shipments;
create policy "Admins can manage shipments"
  on shipments for all
  using (
    exists (select 1 from user_roles where user_id = auth.uid() and role = 'admin')
  );

-- ---- PAYMENTS ----
drop policy if exists "Customers can read own payment status" on payments;
create policy "Customers can read own payment status"
  on payments for select
  using (
    exists (
      select 1 from customer_orders
      where customer_orders.id = payments.order_id
      and customer_orders.user_id = auth.uid()
    )
  );

drop policy if exists "Admins can manage payments" on payments;
create policy "Admins can manage payments"
  on payments for all
  using (
    exists (select 1 from user_roles where user_id = auth.uid() and role = 'admin')
  );

-- ---- PAYMENT EVENTS ----
drop policy if exists "Admins can read payment events" on payment_events;
create policy "Admins can read payment events"
  on payment_events for select
  using (
    exists (select 1 from user_roles where user_id = auth.uid() and role = 'admin')
  );

-- ---- COUPONS ----
drop policy if exists "Admins can manage coupons" on coupons;
create policy "Admins can manage coupons"
  on coupons for all
  using (
    exists (select 1 from user_roles where user_id = auth.uid() and role = 'admin')
  );

-- ---- COUPON USAGES ----
drop policy if exists "Customers can read own coupon usages" on coupon_usages;
create policy "Customers can read own coupon usages"
  on coupon_usages for select
  using (auth.uid() = user_id);

drop policy if exists "Admins can manage coupon usages" on coupon_usages;
create policy "Admins can manage coupon usages"
  on coupon_usages for all
  using (
    exists (select 1 from user_roles where user_id = auth.uid() and role = 'admin')
  );

-- ---- ADMIN ACTIVITY LOGS ----
drop policy if exists "Admins can read activity logs" on admin_activity_logs;
create policy "Admins can read activity logs"
  on admin_activity_logs for select
  using (
    exists (select 1 from user_roles where user_id = auth.uid() and role = 'admin')
  );

drop policy if exists "Admins can insert activity logs" on admin_activity_logs;
create policy "Admins can insert activity logs"
  on admin_activity_logs for insert
  with check (
    exists (select 1 from user_roles where user_id = auth.uid() and role = 'admin')
  );

-- ============================================
-- 24. DATABASE FUNCTIONS
-- ============================================

-- Stock reservation function (atomic, with row locking)
create or replace function reserve_stock(
  p_variant_id uuid,
  p_quantity integer,
  p_order_id uuid
) returns boolean as $$
declare
  v_available integer;
begin
  -- Lock the variant row
  select (stock_quantity - reserved_quantity) into v_available
  from product_variants
  where id = p_variant_id
  for update;

  if not found then
    return false;
  end if;

  if v_available < p_quantity then
    return false;
  end if;

  -- Reserve stock
  update product_variants
  set reserved_quantity = reserved_quantity + p_quantity
  where id = p_variant_id;

  -- Record movement
  insert into inventory_movements (variant_id, order_id, movement_type, quantity)
  values (p_variant_id, p_order_id, 'reservation', p_quantity);

  return true;
end;
$$ language plpgsql security definer;

-- Release reserved stock (on cancellation or payment failure)
create or replace function release_stock(
  p_variant_id uuid,
  p_quantity integer,
  p_order_id uuid
) returns void as $$
begin
  update product_variants
  set reserved_quantity = greatest(reserved_quantity - p_quantity, 0)
  where id = p_variant_id;

  insert into inventory_movements (variant_id, order_id, movement_type, quantity)
  values (p_variant_id, p_order_id, 'release', p_quantity);
end;
$$ language plpgsql security definer;

-- Commit sale (on order confirmation)
create or replace function commit_sale(
  p_variant_id uuid,
  p_quantity integer,
  p_order_id uuid
) returns void as $$
begin
  update product_variants
  set stock_quantity = stock_quantity - p_quantity,
      reserved_quantity = greatest(reserved_quantity - p_quantity, 0)
  where id = p_variant_id;

  insert into inventory_movements (variant_id, order_id, movement_type, quantity)
  values (p_variant_id, p_order_id, 'sale', p_quantity);
end;
$$ language plpgsql security definer;

-- Generate order number (format: ORD-YYYYMMDD-XXXX)
create or replace function generate_order_number()
returns trigger as $$
declare
  v_date text;
  v_seq integer;
  v_number text;
begin
  v_date := to_char(now(), 'YYYYMMDD');

  select count(*) + 1 into v_seq
  from customer_orders
  where order_number like 'ORD-' || v_date || '-%';

  v_number := 'ORD-' || v_date || '-' || lpad(v_seq::text, 4, '0');
  new.order_number := v_number;
  return new;
end;
$$ language plpgsql security definer;

create trigger trigger_generate_order_number
  before insert on customer_orders
  for each row
  when (new.order_number is null or new.order_number = '')
  execute function generate_order_number();

-- Auto-create profile on user signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''));

  insert into user_roles (user_id, role)
  values (new.id, 'customer');

  insert into wishlists (user_id)
  values (new.id);

  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function handle_new_user();

-- ============================================
-- Done
-- ============================================
