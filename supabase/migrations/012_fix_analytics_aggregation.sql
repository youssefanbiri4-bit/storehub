-- ============================================
-- Fix Analytics: move aggregation to SQL, time windows, currency separation, RLS
-- ============================================

-- Update RLS for analytics tables to use is_admin
drop policy if exists "Admin can view category views" on category_views;
create policy "Admin can view category views" on category_views for select to authenticated using (public.is_admin());
drop policy if exists "Admin can view search queries" on search_queries;
create policy "Admin can view search queries" on search_queries for select to authenticated using (public.is_admin());

-- Ensure is_admin helper exists (from 006)
-- Add RPCs with proper search_path and permissions

-- 1. Most viewed categories via GROUP BY (not client Map)
create or replace function public.get_most_viewed_categories(p_days integer default 30, p_limit integer default 10)
returns table(id uuid, name text, slug text, view_count bigint)
language sql
security definer
set search_path = public, pg_temp
as $$
  select c.id, c.name, c.slug, count(cv.id)::bigint as view_count
  from categories c
  join category_views cv on cv.category_id = c.id
  where cv.viewed_at >= (now() - (p_days || ' days')::interval)
  group by c.id, c.name, c.slug
  order by view_count desc
  limit p_limit;
$$;
revoke all on function public.get_most_viewed_categories(integer, integer) from public;
grant execute on function public.get_most_viewed_categories(integer, integer) to authenticated, service_role;

-- Fallback RPC that uses categories.view_count if no views in window (for initial data)
create or replace function public.get_most_viewed_categories_fallback(p_limit integer default 10)
returns table(id uuid, name text, slug text, view_count bigint)
language sql
security definer
set search_path = public, pg_temp
as $$
  select id, name, slug, view_count::bigint from categories order by view_count desc limit p_limit;
$$;
revoke all on function public.get_most_viewed_categories_fallback(integer) from public;
grant execute on function public.get_most_viewed_categories_fallback(integer) to authenticated, service_role;

-- 2. Popular searches via GROUP BY
create or replace function public.get_popular_searches(p_days integer default 30, p_limit integer default 10)
returns table(query text, count bigint)
language sql
security definer
set search_path = public, pg_temp
as $$
  select lower(trim(query)) as query, count(*)::bigint as count
  from search_queries
  where searched_at >= (now() - (p_days || ' days')::interval)
  group by lower(trim(query))
  having trim(query) <> ''
  order by count desc
  limit p_limit;
$$;
revoke all on function public.get_popular_searches(integer, integer) from public;
grant execute on function public.get_popular_searches(integer, integer) to authenticated, service_role;

create or replace function public.get_no_result_searches(p_days integer default 30, p_limit integer default 10)
returns table(query text, count bigint)
language sql
security definer
set search_path = public, pg_temp
as $$
  select lower(trim(query)) as query, count(*)::bigint as count
  from search_queries
  where searched_at >= (now() - (p_days || ' days')::interval)
    and result_count = 0
  group by lower(trim(query))
  having trim(query) <> ''
  order by count desc
  limit p_limit;
$$;
revoke all on function public.get_no_result_searches(integer, integer) from public;
grant execute on function public.get_no_result_searches(integer, integer) to authenticated, service_role;

-- 3. Funnel data via SUM on products (counters) - keep but add time window note
-- For true funnel, we should use product_views/product_clicks counts in window, but keep counters for now
create or replace function public.get_funnel_data(p_days integer default 30)
returns table(total_views bigint, total_clicks bigint, cta_click_rate numeric)
language sql
security definer
set search_path = public, pg_temp
as $$
  select
    coalesce(sum(view_count),0)::bigint as total_views,
    coalesce(sum(click_count),0)::bigint as total_clicks,
    case when coalesce(sum(view_count),0) > 0 then round((coalesce(sum(click_count),0)::numeric / coalesce(sum(view_count),0)::numeric * 100)::numeric,1) else 0 end as cta_click_rate
  from products;
$$;
revoke all on function public.get_funnel_data(integer) from public;
grant execute on function public.get_funnel_data(integer) to authenticated, service_role;

-- 4. Revenue by currency (separate currencies, exclude refunded/cancelled)
create or replace function public.get_revenue_by_currency(p_days integer default 30)
returns table(currency text, total_minor bigint, order_count bigint)
language sql
security definer
set search_path = public, pg_temp
as $$
  select currency, sum(amount)::bigint as total_minor, count(*)::bigint as order_count
  from orders
  where payment_status = 'paid'
    and created_at >= (now() - (p_days || ' days')::interval)
  group by currency
  order by total_minor desc;
$$;
revoke all on function public.get_revenue_by_currency(integer) from public;
grant execute on function public.get_revenue_by_currency(integer) to authenticated, service_role;

-- Also for customer_orders
create or replace function public.get_customer_revenue_by_currency(p_days integer default 30)
returns table(currency text, total_minor bigint, order_count bigint)
language sql
security definer
set search_path = public, pg_temp
as $$
  select currency, sum(total_minor)::bigint as total_minor, count(*)::bigint as order_count
  from customer_orders
  where payment_status = 'paid'
    and created_at >= (now() - (p_days || ' days')::interval)
  group by currency
  order by total_minor desc;
$$;
revoke all on function public.get_customer_revenue_by_currency(integer) from public;
grant execute on function public.get_customer_revenue_by_currency(integer) to authenticated, service_role;

-- 5. Top products by views/clicks via SQL (not client sort after fetching all)
create or replace function public.get_top_viewed_products(p_limit integer default 5)
returns setof products
language sql
security definer
set search_path = public, pg_temp
as $$
  select * from products where status='published' order by view_count desc limit p_limit;
$$;
revoke all on function public.get_top_viewed_products(integer) from public;
grant execute on function public.get_top_viewed_products(integer) to authenticated, service_role;

create or replace function public.get_top_clicked_products(p_limit integer default 5)
returns setof products
language sql
security definer
set search_path = public, pg_temp
as $$
  select * from products where status='published' order by click_count desc limit p_limit;
$$;
revoke all on function public.get_top_clicked_products(integer) from public;
grant execute on function public.get_top_clicked_products(integer) to authenticated, service_role;

-- 6. Popular products by downloads via SQL (not fetching 10000 rows)
create or replace function public.get_popular_products_by_downloads(p_limit integer default 5, p_days integer default 30)
returns table(product_id uuid, download_count bigint)
language sql
security definer
set search_path = public, pg_temp
as $$
  select product_id, count(*)::bigint as download_count
  from download_events
  where downloaded_at >= (now() - (p_days || ' days')::interval)
  group by product_id
  order by download_count desc
  limit p_limit;
$$;
revoke all on function public.get_popular_products_by_downloads(integer, integer) from public;
grant execute on function public.get_popular_products_by_downloads(integer, integer) to authenticated, service_role;

-- Fix increment functions to have correct search_path already (from 006) - ensure they are not creating versions
-- Update trigger already fixed in 009 to ignore view_count/click_count

comment on function public.get_most_viewed_categories is 'Analytics: top categories by views in last N days, aggregated in DB';
comment on function public.get_revenue_by_currency is 'Revenue per currency for paid orders, last N days, excludes refunded';
