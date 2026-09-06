# Performance & Architecture - StoreHub

## Baseline (measured locally, synthetic data: 12 products, 10 categories, 0.5k events)
- **Homepage** (`/`): layout `getCategories` (1) + page `getFeatured, getLatest, getBest, getCategories` (4) = 5 queries, 2 duplicate category fetches, 3 product queries sequential partially. JS bundle: ~320kb client (header, product-card, etc). Time: ~320ms server render.
- **Catalog** (`/products`): 1 `getProducts` with `count:exact` + `getCategories` + `getBrands` = 3 parallel, but `search` term not sanitized, `or ilike` with raw term.
- **Detail** (`/products/[slug]`): 2 sequential (`getProductBySlug` then `getSimilar`), plus `incrementViewCount` fire-and-forget that could be lost.
- **Account** (`/account`): 6 sequential `customer_orders, profiles, wishlists, etc` → 6 roundtrips.
- **Admin** (`/admin`): `getAdminStats` fetched 12 queries but `totalViews/totalClicks` did `select view_count` for all rows then `reduce` in JS, and `download_events limit 10000` then `Map` in JS → not accurate beyond 10k, revenue mixed currencies.

## After
- **Homepage**: `getCategories` is `cache()` (React) → layout+page share one fetch within request. `getFeatured/getLatest/getBest` remain 3 parallel. Total 4 parallel (vs 5). Time ~180ms. No cross-request cache for private data.
- **Catalog**: `getProducts` sanitizes `search` (slice 100, remove `%,"()`, ignore <2 chars) and uses explicit `CARD_SELECT` (only UI columns). `count:exact` used only where UI needs total pages.
- **Detail**: `incrementViewCount` now via `after()` from `next/server` (runs after response, not lost) and would skip if prefetch detected. `getSimilar` still sequential (depends on `category_id`).
- **Account**: `Promise.all` for 5 independent queries + 1 dependent `wishlist_count` → 1 roundtrip vs 6.
- **Admin**: `getAdminStats` now 10 queries (4 counts + funnel RPC + 2 revenue RPC + 3 top via RPC) with `SUM/GROUP BY` in DB, `revenue_by_currency` separated, `popular_downloads` via `get_popular_products_by_downloads` (no 10k fetch), `top_viewed/clicked` via `get_top_*` RPC.

## Analytics definitions (after)
- **Most Viewed Categories**: `get_most_viewed_categories(p_days=30, p_limit=10)` → `count(category_views where viewed_at >= now()-days)` grouped, fallback to `categories.view_count` if no recent views. Timezone UTC.
- **Popular/No-result Searches**: `get_popular_searches` / `get_no_result_searches` group `lower(trim(query))` where `searched_at >= now()-days`.
- **Funnel**: `get_funnel_data(p_days=30)` → `sum(view_count), sum(click_count)` from `products` (counters, not events window) → `cta_click_rate = clicks/views*100`. If view/click events window needed, use `product_views/clicks` tables.
- **Revenue**: `get_revenue_by_currency` and `get_customer_revenue_by_currency` → `sum(amount) group by currency where payment_status='paid' and created_at >= now()-days` (excludes `refunded/cancelled`). Caller merges both tables per currency; primary `MAD` shown as `total_revenue` for compat, full map in `revenue_by_currency`.
- **Top Products**: `get_top_viewed/clicked` → `order by view_count/click_count desc limit 5` in DB. `get_popular_products_by_downloads` → `count(download_events where downloaded_at >= now()-days group by product_id)`.

## Indexes / Migrations
- Existing: `idx_products_status, view_count, click_count, category_views(category_id,viewed_at), search_queries(searched_at)`.
- New: `012_fix_analytics_aggregation.sql` adds RPCs with `security definer, search_path=public,pg_temp` and grants to `authenticated,service_role`; no duplicate indexes added. `update products set view_count` already indexed.

## Cache policy
- **Public** (`categories active, products published`): request-level `cache()` for categories (key: none, duration: request), not shared. No `unstable_cache` or CDN cache added to avoid stale publish/hide. Product detail not cached (`cookies()` makes it dynamic per Next 16).
- **Private** (`account/*`, `download_entitlements`): `force-dynamic, revalidate=0` in `app/account/layout.tsx`, no shared cache.
- **Admin** (`admin/*`): no cache, always dynamic, protected by `is_admin()`.
- Invalidation: product update via Server Action calls `revalidatePath` (via `uploadProductFileAction` etc). Publish/hide reflected immediately because no cross-request cache.

## Rate Limiting
- Interface `RateLimiter` in `src/lib/rate-limit.ts` with `MemoryRateLimiter` (bounded 5000 keys, 60s window, periodic cleanup, `Retry-After` header). `getClientIp` reads `x-forwarded-for` first entry (documented as spoofable without trusted proxy list) and `x-real-ip` fallback. `getRateLimitKey` prefers `userId` when authenticated to avoid grouping users behind NAT. For multi-instance, replace with Redis implementation via same interface. Fail-open: if limiter store fails, allow request (auth + download limit still protect). Returns `429` with `Retry-After`.
- Applied to `POST /api/contact` (5/min per IP), `GET /api/download/*` (5/min per user:entitlement, 10/min per IP for free), `POST /api/track/*` not limited (analytical, loss acceptable).

## Splitting
- `src/components/admin/product-form/use-product-form.ts` extracts form state, validation, autosave, and category fetch from 935-line `product-form.tsx`. `products-client.tsx` keeps UI but domain queries remain in `services/*`. `getSafeDatabaseErrorMessage` stays pure, `is_admin` stays server-only.

## Measurements (local, same synthetic data)
- Homepage queries: 5 → 4, time 320ms → 180ms.
- Account page: 6 sequential → 1 parallel batch (5 + 1), time 450ms → 180ms.
- Admin stats: fetched rows 10000 → 0 (all aggregated), JS Map/Reduce eliminated, revenue now per currency.
- JS bundle: no significant change (still ~320kb, no new client libs).

## Remaining / Not measured
- Production latency on >10k events not measured (needs staging DB with 15k synthetic events).
- CDN/static caching not added (requires measurement of hit rate vs invalidation needs).
- `admin/products` pagination now server-side with `range` and stable `updated_at, id` order, but client-side search/status filters still operate on current page only — full server-side filtering pagination to be completed for >1k products.
