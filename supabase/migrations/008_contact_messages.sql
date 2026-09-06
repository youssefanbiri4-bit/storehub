-- ============================================
-- Migration 008: Contact messages (fix fake success)
-- ============================================

create table if not exists contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text not null,
  message text not null,
  status text not null default 'new' check (status in ('new', 'read', 'archived')),
  created_at timestamptz not null default now()
);

create index if not exists idx_contact_messages_created_at on contact_messages(created_at desc);
create index if not exists idx_contact_messages_status on contact_messages(status);

alter table contact_messages enable row level security;

drop policy if exists "Anyone can submit contact" on contact_messages;
create policy "Anyone can submit contact"
  on contact_messages for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Admins can manage contact messages" on contact_messages;
create policy "Admins can manage contact messages"
  on contact_messages for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Service role can manage contact" on contact_messages;
create policy "Service role can manage contact"
  on contact_messages for all
  to service_role
  using (true)
  with check (true);
