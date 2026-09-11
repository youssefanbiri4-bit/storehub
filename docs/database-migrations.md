# Database Migration Inventory — StoreHub

> StoreHub is a physical-products e-commerce platform. This document inventories every migration in `supabase/migrations/` in order of application.

## Migration List

| # | Migration | Purpose | Depends On | RLS | Admin Auth | Analytics | Destructive | Rollback | Notes |
|---|-----------|---------|------------|-----|------------|-----------|-------------|----------|-------|
| 001 | `001_initial_schema.sql` | Foundation: product catalog, categories, click/view tracking | None | Yes | No (email-based) | Yes | No | Easy | Uses `auth.email()` for admin. Creates `products`, `categories`, `product_clicks`, `product_views`. |
| 002 | `002_enhancements.sql` | Rich metadata, versioning, admin tools, campaigns, FAQs | 001 | Yes | No (email-based) | No | No | Easy | Creates `product_versions`, `activity_logs`, `media_library`, `campaigns`, `admin_notifications`, `product_faqs`, `product_complements`. |
| 003 | `003_hybrid_delivery.sql` | Hosted file delivery, orders, entitlements, storage buckets | 001 | Yes | No (email-based) | No | No | Easy | Creates `product_files`, `download_events`, `orders`, `download_entitlements`. Creates storage buckets `product-images`, `product-previews`, `product-files`. |
| 004 | `004_physical_products.sql` | Full physical e-commerce: auth, roles, variants, carts, shipping, payments | 001 | Yes | No (email-based) | No | No | Easy | Creates 20+ tables: `profiles`, `user_roles`, `brands`, `product_variants`, `carts`, `wishlists`, `customer_orders`, `shipments`, `payments`, `coupons`, etc. |
| 005 | `005_catalog_analytics.sql` | Category view tracking, search query analytics | 001 | Yes | No (email-based) | Yes | No | Easy | Creates `category_views`, `search_queries`. Adds `view_count` to `categories`. |
| 006 | `006_fix_p0_security.sql` | Critical security: `is_admin()`, hardened functions, RLS fixes | 004 | Yes | **Yes** | No | No | Moderate | Introduces `is_admin()` SECURITY DEFINER. Fixes RLS recursion on `user_roles`. Hardens `reserve_stock`, `release_stock`, `commit_sale`, `handle_new_user`. |
| 007 | `007_fix_p1_data_and_admin.sql` | Admin policy unification to `is_admin()`, data backfill | 006 | Yes | **Yes** | No | No | Moderate | Replaces email-based admin policies with `is_admin()` on products, categories, images, variants, etc. |
| 008 | `008_contact_messages.sql` | Contact form backend | 006 | Yes | **Yes** | No | No | Easy | Creates `contact_messages` with `is_admin()` policy. |
| 009 | `009_fix_product_version_trigger_and_pricing.sql` | Version trigger optimization, pricing docs | 006 | No | No | No | No | Easy | Fixes `create_product_version_on_update()` to ignore counter updates. |
| 010 | `010_unify_admin_to_user_roles.sql` | Final RLS unification: all tables use `is_admin()` | 006 | Yes | **Yes** | No | No | Moderate | Drops/recreates 40+ policies across all tables and storage buckets. |
| 011 | `011_checkout_and_atomic_entitlement.sql` | Checkout idempotency, atomic order+entitlement | 003, 006 | Yes | **Yes** | No | No | Moderate | Creates `checkout_attempts`, `create_order_with_entitlement()`, `consume_download_atomically()`. |
| 012 | `012_fix_analytics_aggregation.sql` | Server-side analytics aggregation RPCs | 001-005, 006 | Yes | **Yes** | Yes | No | Easy | Creates 10 RPC functions: `get_most_viewed_categories`, `get_popular_searches`, `get_funnel_data`, `get_revenue_by_currency`, etc. |
| 013 | `013_harden_user_roles_rls.sql` | Harden user_roles: granular RLS, server-side role management | 006 | Yes | **Yes** | No | Moderate | Moderate | Drops broad admin policy. Adds `admin_assign_role()` and `admin_remove_role()` SECURITY DEFINER functions. Hardens `is_admin()`. |

## Summary

| Metric | Count |
|--------|-------|
| Total migrations | 13 |
| Tables created | ~38 |
| Functions created/rewritten | ~27 |
| RLS policies modified | Yes (12 of 13 migrations) |
| Storage buckets | 3 (`product-images`, `product-previews`, `product-files`) |
| Destructive (DROP TABLE/COLUMN) | None — only `DROP POLICY IF EXISTS` |

## Gap Analysis

No migration numbers are missing. The sequence 001–013 is continuous.

## Applied Environments

| Migration | Local | Staging | Production |
|-----------|-------|---------|------------|
| 001–012 | Applied | Unknown — verify manually | Unknown — verify manually |
| 013 | **New — not yet applied** | Not applied | Not applied |

## Deployment Notes

- Migrations 001–012 are already applied. Do NOT edit their content.
- Migration 013 is new and must be applied to staging/production.
- Migration 013 drops the broad "Admins can manage roles" policy and replaces it with read-only access for admins + service_role-only mutations. After applying, any client-side code that directly INSERT/UPDATE/DELETE on `user_roles` will be denied by RLS.
- All role mutations must go through the server-side actions in `src/lib/actions/roles.ts`.
