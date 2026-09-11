-- Migration 013: Harden user_roles RLS and add server-side role management
-- 
-- Problem: Current RLS allows any admin to INSERT/UPDATE/DELETE on user_roles,
-- which means any admin can self-promote, promote others, or delete roles
-- including their own only-admin role.
--
-- Solution:
-- 1. Replace the broad "Admins can manage roles" (ALL) policy with granular
--    read-only access for admins + service_role-only mutations.
-- 2. Add SECURITY DEFINER functions for role mutations that enforce safety:
--    - No self-promotion
--    - No removing the last admin
--    - No removing your own only-admin role
-- 3. Route all role mutations through server-side code only.

-- A. Drop the existing overly broad policies
drop policy if exists "Admins can manage roles" on public.user_roles;
drop policy if exists "Service role can manage user roles" on public.user_roles;
drop policy if exists "Users can read own role" on public.user_roles;

-- B. New restrictive policies

-- Customers can read their own role (needed for profile/account pages)
create policy "Users can read own role" on public.user_roles
  for select to authenticated
  using (auth.uid() = user_id);

-- Admins can read all roles (needed for admin user management UI)
create policy "Admins can read all roles" on public.user_roles
  for select to authenticated
  using (public.is_admin());

-- Service role can manage roles (for server-side functions only)
create policy "Service role can manage user roles" on public.user_roles
  for all to service_role
  using (true)
  with check (true);

-- C. SECURITY DEFINER function to assign a role (server-side only)
-- Enforces: no self-promotion, no last-admin deletion protection
create or replace function public.admin_assign_role(
  target_user_id uuid,
  target_role text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  caller_is_admin boolean;
  current_admin_count bigint;
  target_current_role text;
begin
  -- Validate input
  if target_role not in ('customer', 'admin') then
    raise exception 'Invalid role: %', target_role;
  end if;

  -- Verify caller is admin (via SECURITY DEFINER bypassing RLS)
  select exists(
    select 1 from public.user_roles
    where user_id = caller_id and role = 'admin'
  ) into caller_is_admin;

  if not caller_is_admin then
    raise exception 'Only admins can assign roles';
  end if;

  -- Prevent self-promotion
  if target_user_id = caller_id and target_role = 'admin' then
    raise exception 'Cannot promote yourself to admin';
  end if;

  -- If demoting an admin, check they are not the last admin
  if target_role = 'admin' then
    -- Count current admins (including target if they are already admin)
    select count(*) into current_admin_count
    from public.user_roles
    where role = 'admin';

    -- Get target's current role
    select role into target_current_role
    from public.user_roles
    where user_id = target_user_id;

    -- If target is not currently admin and we would be adding a new admin, that's fine
    -- If target IS currently admin and we're re-assigning admin, no change in count
    -- The last-admin check only applies when REMOVING admin role
    null; -- no-op, promotion is always safe
  end if;

  if target_role = 'customer' then
    -- Check if this would remove the last admin
    select count(*) into current_admin_count
    from public.user_roles
    where role = 'admin';

    -- Get target's current role
    select role into target_current_role
    from public.user_roles
    where user_id = target_user_id;

    if target_current_role = 'admin' and current_admin_count <= 1 then
      raise exception 'Cannot remove the last admin role';
    end if;
  end if;

  -- Perform the upsert
  insert into public.user_roles (user_id, role)
  values (target_user_id, target_role)
  on conflict (user_id) do update set role = target_role;
end;
$$;

revoke all on function public.admin_assign_role(uuid, text) from public;
grant execute on function public.admin_assign_role(uuid, text) to service_role;

-- D. SECURITY DEFINER function to remove a role (server-side only)
create or replace function public.admin_remove_role(
  target_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  caller_is_admin boolean;
  current_admin_count bigint;
  target_current_role text;
begin
  -- Verify caller is admin
  select exists(
    select 1 from public.user_roles
    where user_id = caller_id and role = 'admin'
  ) into caller_is_admin;

  if not caller_is_admin then
    raise exception 'Only admins can remove roles';
  end if;

  -- Get target's current role
  select role into target_current_role
  from public.user_roles
  where user_id = target_user_id;

  -- Prevent removing the last admin
  if target_current_role = 'admin' then
    select count(*) into current_admin_count
    from public.user_roles
    where role = 'admin';

    if current_admin_count <= 1 then
      raise exception 'Cannot remove the last admin role';
    end if;
  end if;

  -- Delete the role
  delete from public.user_roles where user_id = target_user_id;
end;
$$;

revoke all on function public.admin_remove_role(uuid) from public;
grant execute on function public.admin_remove_role(uuid) to service_role;

-- E. Harden is_admin() with fully-qualified references and explicit search_path
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = ''
as $$
  select exists(
    select 1 from public.user_roles
    where user_roles.user_id = auth.uid()
      and user_roles.role = 'admin'
  )
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated, service_role;
