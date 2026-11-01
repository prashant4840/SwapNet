-- Migration: 20261101150000_secure_admin_authorization.sql
-- Description: Replace insecure email-pattern admin checks with explicit role-based
--              authorization (app_metadata role and admin_users table) and database-level RLS.

-- 1. Create admin_users table for explicit authorized administrator IDs
create table if not exists public.admin_users (
  user_id uuid primary key references public.users(id) on delete cascade,
  role text not null default 'admin' check (role = 'admin'),
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

-- 2. Create helper function for role-based admin check
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    or exists (
      select 1 from public.admin_users where user_id = auth.uid()
    ),
    false
  );
$$;

-- 3. Policy on admin_users table (admins can read admin roster, self can verify status)
drop policy if exists admin_users_read on public.admin_users;
create policy admin_users_read on public.admin_users
  for select to authenticated
  using (public.is_admin() or auth.uid() = user_id);

-- 4. Replace insecure email-pattern policies on email_queue
drop policy if exists admin_all_queue on public.email_queue;
create policy admin_all_queue on public.email_queue
  for all to authenticated
  using (public.is_admin());

-- 5. Replace insecure email-pattern policies on error_logs
drop policy if exists admin_all_logs on public.error_logs;
create policy admin_all_logs on public.error_logs
  for all to authenticated
  using (public.is_admin());

-- 6. Add secure admin management policy for abuse_reports
drop policy if exists admin_manage_abuse_reports on public.abuse_reports;
create policy admin_manage_abuse_reports on public.abuse_reports
  for all to authenticated
  using (public.is_admin());
