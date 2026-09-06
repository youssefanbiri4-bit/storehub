-- ============================================
-- Migration 011: Checkout attempts + atomic order+entitlement
-- Ensures idempotency, state transitions, and atomic download consumption
-- ============================================

-- 1. Checkout attempts table for idempotency and linking provider session to internal attempt
create table if not exists checkout_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  provider text not null,
  provider_session_id text,
  amount_minor bigint not null,
  currency text not null,
  status text not null default 'pending' check (status in ('pending','completed','expired','failed','cancelled')),
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 minutes'),
  unique(provider, provider_session_id)
);

create index if not exists idx_checkout_attempts_user_product on checkout_attempts(user_id, product_id);
create index if not exists idx_checkout_attempts_provider_session on checkout_attempts(provider, provider_session_id);
create index if not exists idx_checkout_attempts_status on checkout_attempts(status);

alter table checkout_attempts enable row level security;

drop policy if exists "Users can read own checkout attempts" on checkout_attempts;
create policy "Users can read own checkout attempts" on checkout_attempts for select to authenticated using (auth.uid() = user_id);
drop policy if exists "Users can insert own checkout attempts" on checkout_attempts;
create policy "Users can insert own checkout attempts" on checkout_attempts for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Service role can manage checkout attempts" on checkout_attempts;
create policy "Service role can manage checkout attempts" on checkout_attempts for all to service_role using (true) with check (true);
drop policy if exists "Admins can read checkout attempts" on checkout_attempts;
create policy "Admins can read checkout attempts" on checkout_attempts for select to authenticated using (public.is_admin());

-- 2. Ensure payment_events has unique constraint for idempotency (already has unique(provider, provider_event_id) in 004)
-- Add index for faster lookup
create unique index if not exists idx_payment_events_provider_event_unique on payment_events(provider, provider_event_id);

-- 3. Ensure orders has unique for provider_order_id (already in 003) and add index for checkout linking
-- No change

-- 4. Atomic function for order+entitlement creation (digital)
create or replace function public.create_order_with_entitlement(
  p_provider text,
  p_provider_order_id text,
  p_product_id uuid,
  p_amount_minor integer,
  p_currency text,
  p_customer_email text,
  p_customer_id uuid,
  p_provider_payload jsonb,
  p_max_downloads integer
) returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_order_id uuid;
  v_entitlement_id uuid;
begin
  -- Insert order, fail if duplicate (unique constraint will raise)
  insert into public.orders (provider, provider_order_id, product_id, amount, currency, customer_email, user_id, payment_status, provider_payload, paid_at)
  values (p_provider, p_provider_order_id, p_product_id, p_amount_minor, p_currency, coalesce(p_customer_email, 'unknown'), p_customer_id, 'paid', p_provider_payload, now())
  returning id into v_order_id;

  -- Insert entitlement with unique constraint on order_id? Not unique, but we want one per order
  insert into public.download_entitlements (order_id, product_id, user_id, customer_email, max_downloads, download_count)
  values (v_order_id, p_product_id, p_customer_id, p_customer_email, p_max_downloads, 0)
  returning id into v_entitlement_id;

  return v_order_id;
exception when unique_violation then
  -- Return existing order id for idempotency
  select id into v_order_id from public.orders where provider = p_provider and provider_order_id = p_provider_order_id;
  return v_order_id;
end;
$$;

revoke all on function public.create_order_with_entitlement(text, text, uuid, integer, text, text, uuid, jsonb, integer) from public;
grant execute on function public.create_order_with_entitlement(text, text, uuid, integer, text, text, uuid, jsonb, integer) to service_role;

-- 5. State transition helper for orders (digital)
create or replace function public.is_valid_order_transition(p_current text, p_next text)
returns boolean
language sql
immutable
as $$
  select case
    when p_current = 'pending' and p_next in ('paid','failed','cancelled') then true
    when p_current = 'paid' and p_next in ('refunded','cancelled') then true
    when p_current = p_next then true -- idempotent
    else false
  end;
$$;

-- 6. Enhanced download increment that also checks owner, payment, file, and limit atomically
-- Replaces previous increment_entitlement_download_count with stricter checks
create or replace function public.consume_download_atomically(
  p_entitlement_id uuid,
  p_file_id uuid,
  p_user_id uuid
) returns table(result text, download_count integer, max_downloads integer)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_ent download_entitlements%rowtype;
  v_product products%rowtype;
  v_file product_files%rowtype;
  v_order orders%rowtype;
  v_new_count integer;
begin
  -- Lock entitlement
  select * into v_ent from public.download_entitlements where id = p_entitlement_id for update;
  if not found then
    return query select 'not_found'::text, 0, 0::integer; return;
  end if;

  -- Check ownership (strict)
  if v_ent.user_id is not null then
    if v_ent.user_id <> p_user_id then
      return query select 'forbidden'::text, v_ent.download_count, v_ent.max_downloads; return;
    end if;
  elsif v_ent.customer_email is not null then
    -- Fallback email check: need to fetch user email
    -- For atomic, we require user_id match; if ent has no user_id, deny (legacy)
    return query select 'forbidden'::text, v_ent.download_count, v_ent.max_downloads; return;
  else
    return query select 'forbidden'::text, v_ent.download_count, v_ent.max_downloads; return;
  end if;

  -- Check revoked/expired
  if v_ent.revoked_at is not null then
    return query select 'revoked'::text, v_ent.download_count, v_ent.max_downloads; return;
  end if;
  if v_ent.expires_at is not null and v_ent.expires_at < now() then
    return query select 'expired'::text, v_ent.download_count, v_ent.max_downloads; return;
  end if;

  -- Check limit
  if v_ent.max_downloads is not null and v_ent.download_count >= v_ent.max_downloads then
    return query select 'limit_exceeded'::text, v_ent.download_count, v_ent.max_downloads; return;
  end if;

  -- Check product
  select * into v_product from public.products where id = v_ent.product_id;
  if not found or v_product.status <> 'published' or v_product.delivery_method <> 'hosted_file' then
    return query select 'product_unavailable'::text, v_ent.download_count, v_ent.max_downloads; return;
  end if;

  -- Check file
  select * into v_file from public.product_files where id = p_file_id and product_id = v_ent.product_id;
  if not found or not v_file.is_active then
    return query select 'file_unavailable'::text, v_ent.download_count, v_ent.max_downloads; return;
  end if;

  -- Check order payment_status
  if v_ent.order_id is not null then
    select * into v_order from public.orders where id = v_ent.order_id;
    if not found or v_order.payment_status <> 'paid' then
      return query select 'payment_pending'::text, v_ent.download_count, v_ent.max_downloads; return;
    end if;
  end if;

  -- Atomically increment with conditional
  update public.download_entitlements
  set download_count = download_count + 1, updated_at = now()
  where id = p_entitlement_id
    and (max_downloads is null or download_count < max_downloads)
  returning download_count, max_downloads into v_new_count, v_ent.max_downloads;

  if not found then
    return query select 'limit_exceeded'::text, v_ent.download_count, v_ent.max_downloads; return;
  end if;

  -- Re-read
  select download_count into v_new_count from public.download_entitlements where id = p_entitlement_id;
  return query select 'ok'::text, v_new_count, v_ent.max_downloads;
end;
$$;

revoke all on function public.consume_download_atomically(uuid, uuid, uuid) from public;
grant execute on function public.consume_download_atomically(uuid, uuid, uuid) to authenticated, service_role;

-- Keep legacy increment for fallback but restrict
revoke all on function public.increment_entitlement_download_count(uuid) from public;
grant execute on function public.increment_entitlement_download_count(uuid) to service_role;

comment on table checkout_attempts is 'Idempotency for Stripe checkout sessions, links provider_session_id to internal user+product';
