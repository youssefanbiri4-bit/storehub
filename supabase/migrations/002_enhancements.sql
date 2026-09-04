-- ============================================
-- Digital Products Hub - Enhancements Migration
-- ============================================

-- ============================================
-- 1. ALTER products table — add new columns
-- ============================================

alter table products
  add column if not exists preview_type text default 'none'
    check (preview_type in ('none', 'video', 'pdf_sample', 'images')),
  add column if not exists preview_url text,
  add column if not exists preview_file text,
  add column if not exists language text default 'ar',
  add column if not exists supported_devices text default 'all',
  add column if not exists required_software text,
  add column if not exists user_level text default 'beginner'
    check (user_level in ('beginner', 'intermediate', 'advanced', 'all')),
  add column if not exists license_type text default 'personal'
    check (license_type in ('personal', 'commercial', 'enterprise', 'educational')),
  add column if not exists version text,
  add column if not exists sale_start_date timestamptz,
  add column if not exists sale_end_date timestamptz,
  add column if not exists scheduled_publish_at timestamptz,
  add column if not exists hidden_at timestamptz,
  add column if not exists archived_at timestamptz,
  add column if not exists status text default 'published'
    check (status in ('draft', 'review', 'scheduled', 'published', 'hidden', 'archived')),
  add column if not exists og_image text,
  add column if not exists canonical_url text,
  add column if not exists total_revenue numeric(10,2) default 0,
  add column if not exists last_link_check timestamptz,
  add column if not exists link_status text default 'unchecked'
    check (link_status in ('unchecked', 'ok', 'broken', 'redirect', 'timeout')),
  add column if not exists link_response_code integer,
  add column if not exists link_error_message text;

-- ============================================
-- 2. product_versions table
-- ============================================

create table if not exists product_versions (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references products(id) on delete cascade,
  version_number integer not null,
  data jsonb not null,
  changed_by uuid,
  changed_fields text[],
  created_at timestamptz default now()
);

-- ============================================
-- 3. activity_logs table
-- ============================================

create table if not exists activity_logs (
  id uuid primary key default uuid_generate_v4(),
  entity_type text not null,
  entity_id uuid,
  action text not null,
  user_id uuid,
  user_email text,
  old_values jsonb,
  new_values jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz default now()
);

-- ============================================
-- 4. media_library table
-- ============================================

create table if not exists media_library (
  id uuid primary key default uuid_generate_v4(),
  file_name text not null,
  file_url text not null,
  file_type text not null,
  file_size integer,
  alt_text text,
  width integer,
  height integer,
  product_ids uuid[] default '{}',
  created_at timestamptz default now()
);

-- ============================================
-- 5. campaigns table
-- ============================================

create table if not exists campaigns (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  product_id uuid references products(id) on delete cascade,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  start_date timestamptz,
  end_date timestamptz,
  is_active boolean default true,
  click_count integer default 0,
  view_count integer default 0,
  created_at timestamptz default now()
);

-- ============================================
-- 6. admin_notifications table
-- ============================================

create table if not exists admin_notifications (
  id uuid primary key default uuid_generate_v4(),
  type text not null,
  title text not null,
  message text,
  entity_type text,
  entity_id uuid,
  is_read boolean default false,
  link text,
  created_at timestamptz default now()
);

-- ============================================
-- 7. product_faqs table
-- ============================================

create table if not exists product_faqs (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references products(id) on delete cascade,
  question text not null,
  answer text not null,
  sort_order integer default 0,
  created_at timestamptz default now()
);

-- ============================================
-- 8. product_complements table
-- ============================================

create table if not exists product_complements (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references products(id) on delete cascade,
  complement_id uuid not null references products(id) on delete cascade,
  sort_order integer default 0
);

-- ============================================
-- 9. Indexes
-- ============================================

-- products — new columns
create index if not exists idx_products_status on products(status);
create index if not exists idx_products_preview_type on products(preview_type);
create index if not exists idx_products_language on products(language);
create index if not exists idx_products_user_level on products(user_level);
create index if not exists idx_products_license_type on products(license_type);
create index if not exists idx_products_sale_dates on products(sale_start_date, sale_end_date);
create index if not exists idx_products_scheduled_publish on products(scheduled_publish_at) where scheduled_publish_at is not null;
create index if not exists idx_products_hidden_at on products(hidden_at) where hidden_at is not null;
create index if not exists idx_products_archived_at on products(archived_at) where archived_at is not null;
create index if not exists idx_products_link_status on products(link_status);

-- product_versions
create index if not exists idx_product_versions_product_id on product_versions(product_id);
create index if not exists idx_product_versions_created_at on product_versions(created_at desc);
create unique index if not exists idx_product_versions_unique on product_versions(product_id, version_number);

-- activity_logs
create index if not exists idx_activity_logs_entity on activity_logs(entity_type, entity_id);
create index if not exists idx_activity_logs_user_id on activity_logs(user_id);
create index if not exists idx_activity_logs_action on activity_logs(action);
create index if not exists idx_activity_logs_created_at on activity_logs(created_at desc);

-- media_library
create index if not exists idx_media_library_file_type on media_library(file_type);
create index if not exists idx_media_library_created_at on media_library(created_at desc);
create index if not exists idx_media_library_product_ids on media_library using gin(product_ids);

-- campaigns
create index if not exists idx_campaigns_product_id on campaigns(product_id);
create index if not exists idx_campaigns_is_active on campaigns(is_active);
create index if not exists idx_campaigns_dates on campaigns(start_date, end_date);

-- admin_notifications
create index if not exists idx_admin_notifications_is_read on admin_notifications(is_read);
create index if not exists idx_admin_notifications_type on admin_notifications(type);
create index if not exists idx_admin_notifications_created_at on admin_notifications(created_at desc);

-- product_faqs
create index if not exists idx_product_faqs_product_id on product_faqs(product_id);
create index if not exists idx_product_faqs_sort_order on product_faqs(product_id, sort_order);

-- product_complements
create index if not exists idx_product_complements_product_id on product_complements(product_id);
create index if not exists idx_product_complements_complement_id on product_complements(complement_id);
create unique index if not exists idx_product_complements_unique on product_complements(product_id, complement_id);

-- ============================================
-- 10. Row Level Security Policies
-- ============================================

-- Enable RLS on all new tables
alter table product_versions enable row level security;
alter table activity_logs enable row level security;
alter table media_library enable row level security;
alter table campaigns enable row level security;
alter table admin_notifications enable row level security;
alter table product_faqs enable row level security;
alter table product_complements enable row level security;

-- ---- Products: update existing policies for status-based visibility ----

-- Drop old published-only policy
drop policy if exists "Public can view published products" on products;

-- Public can read products that are published and not hidden/archived
create policy "Public can view published products"
  on products for select
  using (
    status = 'published'
    and hidden_at is null
    and archived_at is null
  );

-- ---- product_versions: admin only ----
create policy "Admin can manage product versions"
  on product_versions for all
  using (auth.email() = coalesce(current_setting('app.admin_email', true), 'admin@example.com'));

-- ---- activity_logs: admin read only ----
create policy "Admin can view activity logs"
  on activity_logs for select
  using (auth.email() = coalesce(current_setting('app.admin_email', true), 'admin@example.com'));

create policy "Admin can insert activity logs"
  on activity_logs for insert
  with check (auth.email() = coalesce(current_setting('app.admin_email', true), 'admin@example.com'));

-- ---- media_library: admin only ----
create policy "Admin can manage media library"
  on media_library for all
  using (auth.email() = coalesce(current_setting('app.admin_email', true), 'admin@example.com'));

-- ---- campaigns: admin only ----
create policy "Admin can manage campaigns"
  on campaigns for all
  using (auth.email() = coalesce(current_setting('app.admin_email', true), 'admin@example.com'));

-- ---- admin_notifications: admin only ----
create policy "Admin can manage notifications"
  on admin_notifications for all
  using (auth.email() = coalesce(current_setting('app.admin_email', true), 'admin@example.com'));

-- ---- product_faqs: public can read, admin can manage ----
create policy "Public can view product FAQs"
  on product_faqs for select
  using (true);

create policy "Admin can manage product FAQs"
  on product_faqs for all
  using (auth.email() = coalesce(current_setting('app.admin_email', true), 'admin@example.com'));

-- ---- product_complements: public can read, admin can manage ----
create policy "Public can view product complements"
  on product_complements for select
  using (true);

create policy "Admin can manage product complements"
  on product_complements for all
  using (auth.email() = coalesce(current_setting('app.admin_email', true), 'admin@example.com'));

-- ============================================
-- 11. Trigger: auto-create product_versions on update
-- ============================================

create or replace function create_product_version_on_update()
returns trigger as $$
declare
  latest_version integer;
  changed_cols text[] := '{}';
  col_name text;
  old_data jsonb;
  new_data jsonb;
begin
  -- Get the latest version number for this product
  select coalesce(max(version_number), 0) into latest_version
  from product_versions
  where product_id = NEW.id;

  -- Build changed_fields array by comparing each column
  for col_name in
    select column_name from information_schema.columns
    where table_name = 'products' and table_schema = 'public'
    order by ordinal_position
  loop
    -- Skip updated_at and columns that haven't changed
    if col_name = 'updated_at' then
      continue;
    end if;

    execute format('select to_jsonb($1.%I)', col_name) into old_data using OLD;
    execute format('select to_jsonb($1.%I)', col_name) into new_data using NEW;

    if old_data is distinct from new_data then
      changed_cols := array_append(changed_cols, col_name);
    end if;
  end loop;

  -- Only create a version if something actually changed
  if array_length(changed_cols, 1) > 0 then
    insert into product_versions (product_id, version_number, data, changed_fields)
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

create trigger trigger_create_product_version
  after update on products
  for each row
  execute function create_product_version_on_update();

-- ============================================
-- 12. Trigger: updated_at on new tables
-- ============================================

-- media_library doesn't have updated_at — no trigger needed there.
-- All other new tables also don't have updated_at; they are append-only
-- (versions, logs, notifications, FAQs, complements, campaigns).
-- If updated_at is added later, attach the existing trigger:
--
--   create trigger update_<table>_updated_at
--     before update on <table>
--     for each row execute function update_updated_at_column();

-- ============================================
-- Done
-- ============================================
