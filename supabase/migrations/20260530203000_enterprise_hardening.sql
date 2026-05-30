-- ── Database Audit & Index Optimizations ───────────────────

create index if not exists posts_created_at_idx on public.posts (created_at desc);
create index if not exists posts_user_id_idx on public.posts (user_id);
create index if not exists notifications_user_unread_idx on public.notifications (user_id, read) where read = false;
create index if not exists users_city_mode_idx on public.users (city, mode);
create index if not exists skills_offered_category_idx on public.skills_offered (category);
create index if not exists skills_wanted_category_idx on public.skills_wanted (category);
create index if not exists reviews_reviewer_idx on public.reviews (reviewer_id);
create index if not exists abuse_reports_reported_user_idx on public.abuse_reports (reported_user_id);

-- ── Email Queue Table ──────────────────────────────────────

create table if not exists public.email_queue (
  id uuid primary key default gen_random_uuid(),
  to_email text not null,
  to_name text not null,
  type text not null,
  payload jsonb not null,
  status text not null default 'pending' check (status in ('pending', 'sent', 'retrying', 'failed')),
  retry_count integer not null default 0 check (retry_count >= 0),
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  scheduled_at timestamptz not null default now()
);

alter table public.email_queue enable row level security;

create policy insert_own_queue on public.email_queue
  for insert to authenticated with check (true);

create policy admin_all_queue on public.email_queue
  for all to authenticated
  using (auth.jwt() ->> 'email' like '%@admin%');

-- ── Error Logs Table ───────────────────────────────────────

create table if not exists public.error_logs (
  id uuid primary key default gen_random_uuid(),
  message text not null,
  stack text,
  context jsonb not null default '{}'::jsonb,
  user_id uuid references public.users(id) on delete set null,
  severity text not null default 'error' check (severity in ('info', 'warning', 'error', 'critical')),
  created_at timestamptz not null default now()
);

alter table public.error_logs enable row level security;

create policy insert_logs on public.error_logs
  for insert with check (true);

create policy admin_all_logs on public.error_logs
  for all to authenticated
  using (auth.jwt() ->> 'email' like '%@admin%');

-- ── Trigger set_updated_at for email_queue ─────────────────

create trigger set_email_queue_updated_at
before update on public.email_queue
for each row execute function public.set_updated_at();
