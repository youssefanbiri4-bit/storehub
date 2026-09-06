# Admin Auth - Unified via user_roles

## Source of truth
- **`public.user_roles` is the sole source for admin privileges.**
- `ADMIN_EMAIL` env and `app.admin_email` GUC and `admin@example.com` default are **not** used for authorization.
- `public.is_admin()` is a `SECURITY DEFINER` helper with `search_path=public,pg_temp` that checks `user_roles` without RLS recursion.

## Function
```sql
create or replace function public.is_admin() returns boolean
language sql security definer set search_path=public,pg_temp
as $$ select exists(select 1 from public.user_roles where user_id=auth.uid() and role='admin') $$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated, service_role;
```

## RLS
- `user_roles`:
  - `Users can read own role` (select, `auth.uid()=user_id`)
  - `Admins can manage roles` (all, `public.is_admin()`)
  - `Service role can manage user roles` (all, `to service_role`)
- All admin-only tables use `public.is_admin()` for `authenticated`:
  `products, categories, product_files, product_images, variants, options, brands, orders (digital), shipping, payments, coupons, contact_messages, storage.objects (buckets: product-images, product-previews, product-files)`, etc.
- Service role has explicit `to service_role` policies for bypass where needed.

## Proxy
- File: `proxy.ts` at project root (Next.js 16.3 Proxy convention, not `src/middleware.ts`).
- Matcher: `"/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"` – runs on all non-static to refresh Supabase session and preserve cookies.
- Admin: if `!user` → `/admin/login`; if `user` but not admin (checked via `user_roles` with service_role fetch) → `/` (not login, avoids loop, distinguishes unauthenticated vs unauthorized).
- Account/checkout: if `!user` → `/login?redirect=...`
- All redirects preserve refreshed cookies via `redirectWithCookies`.

## Server actions / Route handlers
- Every write: `await requireAdmin()` (which calls `getCurrentUser` via service_role lookup of `user_roles`), then `createAdminClient` only after auth.
- Client writes (e.g., `src/app/admin/products/page.tsx` via `createClient` + RLS) remain but are now enforced by `is_admin()` RLS; server actions are preferred for product writes (`src/lib/actions/products.ts`).

## First admin setup (no auto-promotion)
No user is promoted via `user_metadata` or email. To create first admin:

1. Create user via normal sign-up or `supabase auth admin create user`.
2. With `SUPABASE_SERVICE_ROLE_KEY`, run:
```sql
insert into public.user_roles (user_id, role) values ('<USER_UUID>', 'admin')
on conflict (user_id) do update set role='admin';
```
Or via Supabase SQL editor as `service_role`.

3. Verify: `select * from public.user_roles where user_id='<uuid>';`

Existing admin that relied on `ADMIN_EMAIL` must be migrated with above insert **before** deploying code that removes the fallback, otherwise they will lose access.

## Migration order
- `006_fix_p0_security.sql` – introduces `is_admin` and fixes orders/entitlements/carts.
- `007_fix_p1_data_and_admin.sql` – migrates products/categories/etc to `is_admin`.
- `010_unify_admin_to_user_roles.sql` – removes all remaining `app.admin_email` policies and storage policies.
- Apply in order on isolated DB first, then production. Do not edit already-applied history.

## External config
- `ADMIN_EMAIL` env is no longer used for auth; keep it only for docs/contact if needed. Do not set `app.admin_email` in DB.
- `SUPABASE_SERVICE_ROLE_KEY` must remain secret, never logged.

## Testing
- Visitor → `/admin` → 302 to `/admin/login`.
- Authenticated non-admin → `/admin` → 302 to `/` (not login), API write → 401/403.
- Non-admin cannot `insert`/`update`/`delete` `user_roles` (RLS denies).
- Admin can perform writes, removal of admin role blocks subsequent writes.
- No infinite recursion when querying `user_roles` or joined tables.
