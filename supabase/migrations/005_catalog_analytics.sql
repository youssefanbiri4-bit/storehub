-- ============================================
-- Catalog Analytics & Search Intelligence
-- ============================================

-- 1. Add view_count to categories
alter table categories
  add column if not exists view_count integer not null default 0;

-- 2. Category views tracking
create table if not exists category_views (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references categories(id) on delete cascade,
  viewed_at timestamptz not null default now()
);

create index if not exists idx_category_views_category_id on category_views(category_id);
create index if not exists idx_category_views_viewed_at on category_views(viewed_at desc);

-- 3. Search queries tracking (privacy-safe: no user data stored)
create table if not exists search_queries (
  id uuid primary key default gen_random_uuid(),
  query text not null,
  result_count integer not null default 0,
  searched_at timestamptz not null default now()
);

create index if not exists idx_search_queries_query on search_queries(query);
create index if not exists idx_search_queries_searched_at on search_queries(searched_at desc);

-- 4. RLS Policies
alter table category_views enable row level security;
alter table search_queries enable row level security;

-- Anyone can insert (tracking)
create policy "Anyone can track category views"
  on category_views for insert
  with check (true);

-- Admin can read
create policy "Admin can view category views"
  on category_views for select
  using (auth.email() = coalesce(current_setting('app.admin_email', true), 'admin@example.com'));

-- Anyone can insert (tracking)
create policy "Anyone can track search queries"
  on search_queries for insert
  with check (true);

-- Admin can read
create policy "Admin can view search queries"
  on search_queries for select
  using (auth.email() = coalesce(current_setting('app.admin_email', true), 'admin@example.com'));

-- 5. RPC for incrementing category view count
create or replace function increment_category_view_count(cid uuid)
returns void as $$
begin
  update categories set view_count = view_count + 1 where id = cid;
end;
$$ language plpgsql;

-- ============================================
-- Done
-- ============================================
