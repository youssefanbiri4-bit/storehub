-- ============================================
-- Digital Products Hub - Database Schema
-- ============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Categories table
create table if not exists categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text unique not null,
  description text,
  icon text,
  image text,
  sort_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Products table
create table if not exists products (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text unique not null,
  short_description text,
  description text,
  cover_image text,
  gallery_images text[] default '{}',
  price numeric(10,2) default 0,
  old_price numeric(10,2),
  currency text default 'USD',
  is_free boolean default false,
  product_type text not null default 'other',
  file_format text,
  file_size text,
  external_url text not null,
  category_id uuid references categories(id) on delete set null,
  tags text[] default '{}',
  badge text,
  requirements text,
  included_items text[] default '{}',
  is_featured boolean default false,
  is_published boolean default false,
  view_count integer default 0,
  click_count integer default 0,
  seo_title text,
  seo_description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Product clicks tracking
create table if not exists product_clicks (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid references products(id) on delete cascade not null,
  clicked_at timestamptz default now()
);

-- Product views tracking
create table if not exists product_views (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid references products(id) on delete cascade not null,
  viewed_at timestamptz default now()
);

-- Indexes
create index if not exists idx_products_slug on products(slug);
create index if not exists idx_products_category_id on products(category_id);
create index if not exists idx_products_is_published on products(is_published);
create index if not exists idx_products_is_featured on products(is_featured);
create index if not exists idx_products_product_type on products(product_type);
create index if not exists idx_products_created_at on products(created_at desc);
create index if not exists idx_categories_slug on categories(slug);
create index if not exists idx_categories_sort_order on categories(sort_order);
create index if not exists idx_product_clicks_product_id on product_clicks(product_id);
create index if not exists idx_product_views_product_id on product_views(product_id);

-- ============================================
-- Row Level Security Policies
-- ============================================

-- Enable RLS
alter table products enable row level security;
alter table categories enable row level security;
alter table product_clicks enable row level security;
alter table product_views enable row level security;

-- Products: Public can read published products
create policy "Public can view published products"
  on products for select
  using (is_published = true);

-- Products: Admin can do everything
create policy "Admin can manage products"
  on products for all
  using (auth.email() = coalesce(current_setting('app.admin_email', true), 'admin@example.com'));

-- Categories: Public can read
create policy "Public can view categories"
  on categories for select
  using (true);

-- Categories: Admin can manage
create policy "Admin can manage categories"
  on categories for all
  using (auth.email() = coalesce(current_setting('app.admin_email', true), 'admin@example.com'));

-- Product clicks: Anyone can insert (tracking)
create policy "Anyone can track clicks"
  on product_clicks for insert
  with check (true);

-- Product clicks: Admin can read
create policy "Admin can view clicks"
  on product_clicks for select
  using (auth.email() = coalesce(current_setting('app.admin_email', true), 'admin@example.com'));

-- Product views: Anyone can insert (tracking)
create policy "Anyone can track views"
  on product_views for insert
  with check (true);

-- Product views: Admin can read
create policy "Admin can view views"
  on product_views for select
  using (auth.email() = coalesce(current_setting('app.admin_email', true), 'admin@example.com'));

-- ============================================
-- Functions
-- ============================================

-- Auto-update updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_products_updated_at
  before update on products
  for each row execute function update_updated_at_column();

create trigger update_categories_updated_at
  before update on categories
  for each row execute function update_updated_at_column();
