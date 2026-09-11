# Admin Auth - Unified via user_roles

> StoreHub is a physical-products e-commerce platform.

## Source of truth
- **`public.user_roles` is the sole source for admin privileges.**
- `ADMIN_EMAIL` env and `app.admin_email` GUC and `admin@example.com` default are **not** used for authorization.
- `public.is_admin()` is a `SECURITY DEFINER` helper with `search_path=''` that checks `user_roles` with fully-qualified references, avoiding RLS recursion.

## Function
```sql
create or replace function public.is_admin() returns boolean
language sql security definer set search_path=''
as $$
  select exists(
    select 1 from public.user_roles
    where user_roles.user_id = auth.uid()
      and user_roles.role = 'admin'
  )
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated, service_role;
```

## RLS (after migration 013)
- `user_roles`:
  - `Users can read own role` (select, authenticated, `auth.uid()=user_id`)
  - `Admins can read all roles` (select, authenticated, `public.is_admin()`)
  - `Service role can manage user roles` (all, service_role)
- Admin-only tables use `public.is_admin()` for `authenticated`:
  `products, categories, product_images, variants, options, brands, orders, shipping, payments, coupons, contact_messages, storage.objects (buckets: product-images, product-previews, product-files)`, etc.
- Service role has explicit `to service_role` policies for bypass where needed.

## Role Management (after migration 013)

All role mutations are routed through server-side code only:

```typescript
import { assignUserRole, removeUserRole } from "@/lib/actions/roles";

// Assign admin role (enforces: no self-promotion, no last-admin deletion)
await assignUserRole(targetUserId, "admin");

// Remove role
await removeUserRole(targetUserId);
```

### Safety guarantees
- **No self-promotion**: Admin cannot promote themselves to admin.
- **No last-admin deletion**: Cannot remove the last admin role.
- **No client-side role mutations**: RLS denies direct INSERT/UPDATE/DELETE on `user_roles` for authenticated users.
- **Server-side enforcement**: `assignUserRole` and `removeUserRole` call `requireAdmin()` first, then use service-role client to call SECURITY DEFINER functions.

## Proxy
- File: `proxy.ts` at project root (Next.js 16.3 Proxy convention, not `src/middleware.ts`).
- Matcher: `"/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"` -- runs on all non-static to refresh Supabase session and preserve cookies.
- Admin: if `!user` -> `/admin/login`; if `user` but not admin (checked via `user_roles` with service_role fetch) -> `/` (not login, avoids loop, distinguishes unauthenticated vs unauthorized).
- Account/checkout: if `!user` -> `/login?redirect=...`
- All redirects preserve refreshed cookies via `redirectWithCookies`.

## Server actions / Route handlers
- Every write: `await requireAdmin()` (which calls `getCurrentUser` via service_role lookup of `user_roles`), then `createAdminClient` only after auth.
- Client reads (e.g., via `createClient` + RLS) remain but are enforced by `is_admin()` RLS; server actions are preferred for product writes (`src/lib/actions/products.ts`).
- Role mutations: exclusively via `src/lib/actions/roles.ts` (calls `requireAdmin()` + service-role DB functions).

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
- `006_fix_p0_security.sql` -- introduces `is_admin` and fixes orders/entitlements/carts.
- `007_fix_p1_data_and_admin.sql` -- migrates products/categories/etc to `is_admin`.
- `010_unify_admin_to_user_roles.sql` -- removes all remaining `app.admin_email` policies and storage policies.
- `013_harden_user_roles_rls.sql` -- hardens user_roles RLS, adds server-side role management functions.
- Apply in order on isolated DB first, then production. Do not edit already-applied history.

## External config
- `ADMIN_EMAIL` env is no longer used for auth; keep it only for docs/contact if needed. Do not set `app.admin_email` in DB.
- `SUPABASE_SERVICE_ROLE_KEY` must remain secret, never logged, never exposed client-side.

## Testing
- Visitor -> `/admin` -> 302 to `/admin/login`.
- Authenticated non-admin -> `/admin` -> 302 to `/` (not login), API write -> 401/403.
- Non-admin cannot `insert`/`update`/`delete` `user_roles` (RLS denies).
- Admin can perform reads; mutations go through server-side actions only.
- Admin cannot promote themselves (server-side guard).
- Admin cannot remove the last admin (DB function guard).
- Removing admin privilege blocks subsequent admin actions.
- No infinite recursion when querying `user_roles` or joined tables.
