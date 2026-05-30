create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── Tables ────────────────────────────────────────────────────

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  name text not null,
  email text not null unique,
  photo text not null default '',
  city text not null default '',
  bio text not null default '',
  headline text not null default '',
  age integer,
  availability text[] not null default '{}',
  mode text not null default 'Online' check (mode in ('Online', 'In-person', 'Both')),
  swap_score integer not null default 0 check (swap_score between 0 and 100),
  rating numeric(2, 1) not null default 0 check (rating between 0 and 5),
  review_count integer not null default 0 check (review_count >= 0),
  completed_swaps integer not null default 0 check (completed_swaps >= 0),
  taught_count integer not null default 0 check (taught_count >= 0),
  learned_count integer not null default 0 check (learned_count >= 0),
  reports integer not null default 0 check (reports >= 0),
  created_at timestamptz not null default now(),
  last_active_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.skills_offered (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  skill_name text not null,
  category text not null check (
    category in ('Music','Tech','Creative','Wellness','Lifestyle','Academic','Business','Languages')
  ),
  level text check (level in ('Beginner', 'Intermediate', 'Advanced')),
  created_at timestamptz not null default now()
);

create unique index if not exists skills_offered_user_name_idx
  on public.skills_offered (user_id, lower(skill_name));

create table if not exists public.skills_wanted (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  skill_name text not null,
  category text not null check (
    category in ('Music','Tech','Creative','Wellness','Lifestyle','Academic','Business','Languages')
  ),
  created_at timestamptz not null default now()
);

create unique index if not exists skills_wanted_user_name_idx
  on public.skills_wanted (user_id, lower(skill_name));

create table if not exists public.swap_requests (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.users(id) on delete cascade,
  receiver_id uuid not null references public.users(id) on delete cascade,
  message text not null,
  offered_skill_id uuid references public.skills_offered(id) on delete set null,
  wanted_skill_id uuid references public.skills_wanted(id) on delete set null,
  status text not null default 'Pending' check (
    status in ('Pending', 'Accepted', 'Declined', 'Completed')
  ),
  completed_by uuid[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint no_self_swap check (sender_id <> receiver_id)
);

create index if not exists swap_requests_sender_idx on public.swap_requests (sender_id);
create index if not exists swap_requests_receiver_idx on public.swap_requests (receiver_id);
create index if not exists swap_requests_status_idx on public.swap_requests (status);

create table if not exists public.connection_requests (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.users(id) on delete cascade,
  receiver_id uuid not null references public.users(id) on delete cascade,
  message text not null,
  status text not null default 'Pending' check (
    status in ('Pending', 'Accepted', 'Declined')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint no_self_connection check (sender_id <> receiver_id)
);

create index if not exists connection_requests_sender_idx on public.connection_requests (sender_id);
create index if not exists connection_requests_receiver_idx on public.connection_requests (receiver_id);
create index if not exists connection_requests_status_idx on public.connection_requests (status);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  thread_key text not null,
  swap_id uuid references public.swap_requests(id) on delete cascade,
  connection_request_id uuid references public.connection_requests(id) on delete cascade,
  sender_id uuid not null references public.users(id) on delete cascade,
  receiver_id uuid references public.users(id) on delete cascade,
  message text not null,
  message_type text not null default 'text' check (
    message_type in ('text', 'template', 'system')
  ),
  created_at timestamptz not null default now(),
  constraint messages_thread_source check (
    (swap_id is not null and connection_request_id is null)
    or (swap_id is null and connection_request_id is not null)
  )
);

create index if not exists messages_thread_key_idx on public.messages (thread_key, created_at);
create index if not exists messages_swap_id_idx on public.messages (swap_id, created_at);
create index if not exists messages_connection_request_id_idx
  on public.messages (connection_request_id, created_at);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  reviewer_id uuid not null references public.users(id) on delete cascade,
  reviewee_id uuid not null references public.users(id) on delete cascade,
  swap_id uuid not null references public.swap_requests(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text not null,
  created_at timestamptz not null default now(),
  unique (reviewer_id, swap_id)
);

create index if not exists reviews_reviewee_idx on public.reviews (reviewee_id, created_at desc);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null check (
    type in ('match', 'request', 'connection', 'chat', 'review', 'system', 'post')
  ),
  title text not null,
  description text not null,
  link text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_idx on public.notifications (user_id, created_at desc);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  skill_name text not null,
  category text not null check (
    category in ('Music','Tech','Creative','Wellness','Lifestyle','Academic','Business','Languages')
  ),
  note text not null,
  city text not null,
  mode text not null check (mode in ('Online', 'In-person', 'Both')),
  responses integer not null default 0 check (responses >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.abuse_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.users(id) on delete cascade,
  reported_user_id uuid not null references public.users(id) on delete cascade,
  reason text not null default '',
  created_at timestamptz not null default now(),
  constraint no_self_report check (reporter_id <> reported_user_id)
);

-- ── Triggers ──────────────────────────────────────────────────

create trigger set_users_updated_at
before update on public.users
for each row execute function public.set_updated_at();

create trigger set_swap_requests_updated_at
before update on public.swap_requests
for each row execute function public.set_updated_at();

create trigger set_connection_requests_updated_at
before update on public.connection_requests
for each row execute function public.set_updated_at();

create trigger set_posts_updated_at
before update on public.posts
for each row execute function public.set_updated_at();

-- ── Auto-create profile on signup ────────────────────────────
-- When a user signs up via Supabase Auth, this trigger
-- automatically creates their public.users profile row.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_username text;
  final_username text;
  counter int := 1;
begin
  base_username := coalesce(
    nullif(trim(new.raw_user_meta_data->>'user_name'), ''),
    nullif(trim(new.raw_user_meta_data->>'preferred_username'), ''),
    nullif(split_part(new.email, '@', 1), ''),
    'member'
  );
  base_username := lower(regexp_replace(base_username, '[^a-zA-Z0-9]', '-', 'g'));
  base_username := regexp_replace(base_username, '-+', '-', 'g');
  base_username := trim(both '-' from base_username);
  base_username := coalesce(nullif(base_username, ''), 'member');
  final_username := base_username;

  while exists (select 1 from public.users where username = final_username) loop
    final_username := base_username || '-' || counter;
    counter := counter + 1;
  end loop;

  insert into public.users (id, username, name, email, photo, city, bio, headline)
  values (
    new.id,
    final_username,
    coalesce(
      nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
      nullif(trim(new.raw_user_meta_data->>'name'), ''),
      split_part(new.email, '@', 1)
    ),
    new.email,
    coalesce(
      nullif(trim(new.raw_user_meta_data->>'avatar_url'), ''),
      'https://api.dicebear.com/9.x/shapes/svg?seed=' || new.id
    ),
    coalesce(nullif(trim(new.raw_user_meta_data->>'city'), ''), 'Remote'),
    'Tell the community what you love teaching and what you want to learn next.',
    'New member ready to trade skills'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── Row Level Security ────────────────────────────────────────

alter table public.users enable row level security;
alter table public.skills_offered enable row level security;
alter table public.skills_wanted enable row level security;
alter table public.swap_requests enable row level security;
alter table public.connection_requests enable row level security;
alter table public.messages enable row level security;
alter table public.reviews enable row level security;
alter table public.notifications enable row level security;
alter table public.posts enable row level security;
alter table public.abuse_reports enable row level security;

-- users
create policy "Public profiles are readable"
on public.users for select using (true);

create policy "Users can insert their own profile"
on public.users for insert to authenticated
with check (auth.uid() = id);

create policy "Users can update their own profile"
on public.users for update to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- skills_offered
create policy "Skills offered are publicly readable"
on public.skills_offered for select using (true);

create policy "Owners manage their offered skills"
on public.skills_offered for all to authenticated
using (exists (select 1 from public.users where id = skills_offered.user_id and id = auth.uid()))
with check (exists (select 1 from public.users where id = skills_offered.user_id and id = auth.uid()));

-- skills_wanted
create policy "Skills wanted are publicly readable"
on public.skills_wanted for select using (true);

create policy "Owners manage their wanted skills"
on public.skills_wanted for all to authenticated
using (exists (select 1 from public.users where id = skills_wanted.user_id and id = auth.uid()))
with check (exists (select 1 from public.users where id = skills_wanted.user_id and id = auth.uid()));

-- swap_requests
create policy "Swap participants can read their requests"
on public.swap_requests for select to authenticated
using (auth.uid() in (sender_id, receiver_id));

create policy "Senders can create swap requests"
on public.swap_requests for insert to authenticated
with check (auth.uid() = sender_id);

create policy "Participants can update swap requests"
on public.swap_requests for update to authenticated
using (auth.uid() in (sender_id, receiver_id))
with check (auth.uid() in (sender_id, receiver_id));

-- connection_requests
create policy "Connection participants can read requests"
on public.connection_requests for select to authenticated
using (auth.uid() in (sender_id, receiver_id));

create policy "Senders can create connection requests"
on public.connection_requests for insert to authenticated
with check (auth.uid() = sender_id);

create policy "Participants can update connection requests"
on public.connection_requests for update to authenticated
using (auth.uid() in (sender_id, receiver_id))
with check (auth.uid() in (sender_id, receiver_id));

-- messages
create policy "Chat participants can read messages"
on public.messages for select to authenticated
using (auth.uid() in (sender_id, receiver_id));

create policy "Chat participants can send messages"
on public.messages for insert to authenticated
with check (
  auth.uid() = sender_id
  and (
    exists (
      select 1 from public.swap_requests
      where id = messages.swap_id
        and auth.uid() in (sender_id, receiver_id)
    )
    or exists (
      select 1 from public.connection_requests
      where id = messages.connection_request_id
        and status = 'Accepted'
        and auth.uid() in (sender_id, receiver_id)
    )
  )
);

-- reviews
create policy "Reviews are publicly readable"
on public.reviews for select using (true);

create policy "Participants can write one review per swap"
on public.reviews for insert to authenticated
with check (
  auth.uid() = reviewer_id
  and exists (
    select 1 from public.swap_requests
    where id = reviews.swap_id
      and status = 'Completed'
      and auth.uid() in (sender_id, receiver_id)
  )
);

-- notifications
create policy "Users can read their own notifications"
on public.notifications for select to authenticated
using (auth.uid() = user_id);

create policy "Users can update their own notifications"
on public.notifications for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Authenticated users can insert notifications"
on public.notifications for insert to authenticated
with check (true);

-- posts
create policy "Looking-for posts are publicly readable"
on public.posts for select using (true);

create policy "Authenticated users can create posts"
on public.posts for insert to authenticated
with check (auth.uid() = user_id);

create policy "Owners can manage their posts"
on public.posts for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- abuse_reports
create policy "Authenticated users can report abuse"
on public.abuse_reports for insert to authenticated
with check (auth.uid() = reporter_id);

-- ── Storage ───────────────────────────────────────────────────

insert into storage.buckets (id, name, public)
values ('profile-photos', 'profile-photos', true)
on conflict (id) do nothing;

create policy "Profile photos are publicly readable"
on storage.objects for select
using (bucket_id = 'profile-photos');

create policy "Authenticated users can upload profile photos"
on storage.objects for insert to authenticated
with check (bucket_id = 'profile-photos');

create policy "Authenticated users can update profile photos"
on storage.objects for update to authenticated
using (bucket_id = 'profile-photos')
with check (bucket_id = 'profile-photos');

-- ── Realtime ──────────────────────────────────────────────────

alter publication supabase_realtime add table public.connection_requests;
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.swap_requests;
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.posts;

-- Lock down internal trigger functions from public access
revoke execute on function public.handle_new_user() from anon;
revoke execute on function public.handle_new_user() from authenticated;
alter function public.set_updated_at() set search_path = public;

-- Storage policies (users can only access their own folder)
drop policy if exists "Authenticated users can upload profile photos" on storage.objects;
drop policy if exists "Authenticated users can update profile photos" on storage.objects;

create policy "Authenticated users can upload profile photos"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'profile-photos'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Authenticated users can update profile photos"
on storage.objects for update to authenticated
using (
  bucket_id = 'profile-photos'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Authenticated users can delete their own photos"
on storage.objects for delete to authenticated
using (
  bucket_id = 'profile-photos'
  and auth.uid()::text = (storage.foldername(name))[1]
);

alter table public.abuse_reports 
add column if not exists status text not null default 'pending'
check (status in ('pending', 'dismissed', 'banned'));

-- ── Rate Limiting Triggers ───────────────────────────────────

create or replace function public.enforce_rate_limits()
returns trigger
language plpgsql
security definer
as $$
declare
  recent_count integer;
begin
  -- Bypass checking if not from a postgrest authenticated transaction
  if auth.uid() is null then
    return new;
  end if;

  if tg_table_name = 'posts' then
    select count(*) into recent_count from public.posts
    where user_id = auth.uid() and created_at > now() - interval '30 seconds';
    if recent_count > 0 then
      raise exception 'Rate limit exceeded. Please wait 30 seconds between posts.';
    end if;
  elsif tg_table_name = 'swap_requests' then
    select count(*) into recent_count from public.swap_requests
    where sender_id = auth.uid() and created_at > now() - interval '10 seconds';
    if recent_count > 0 then
      raise exception 'Rate limit exceeded. Please wait 10 seconds between swap requests.';
    end if;
  elsif tg_table_name = 'connection_requests' then
    select count(*) into recent_count from public.connection_requests
    where sender_id = auth.uid() and created_at > now() - interval '10 seconds';
    if recent_count > 0 then
      raise exception 'Rate limit exceeded. Please wait 10 seconds between connection requests.';
    end if;
  elsif tg_table_name = 'reviews' then
    select count(*) into recent_count from public.reviews
    where reviewer_id = auth.uid() and created_at > now() - interval '10 seconds';
    if recent_count > 0 then
      raise exception 'Rate limit exceeded. Please wait 10 seconds between writing reviews.';
    end if;
  elsif tg_table_name = 'messages' then
    select count(*) into recent_count from public.messages
    where sender_id = auth.uid() and created_at > now() - interval '5 seconds';
    if recent_count >= 3 then
      raise exception 'Rate limit exceeded. Max 3 messages per 5 seconds.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists check_posts_rate_limit on public.posts;
create trigger check_posts_rate_limit
before insert on public.posts
for each row execute function public.enforce_rate_limits();

drop trigger if exists check_swap_requests_rate_limit on public.swap_requests;
create trigger check_swap_requests_rate_limit
before insert on public.swap_requests
for each row execute function public.enforce_rate_limits();

drop trigger if exists check_connection_requests_rate_limit on public.connection_requests;
create trigger check_connection_requests_rate_limit
before insert on public.connection_requests
for each row execute function public.enforce_rate_limits();

drop trigger if exists check_reviews_rate_limit on public.reviews;
create trigger check_reviews_rate_limit
before insert on public.reviews
for each row execute function public.enforce_rate_limits();

drop trigger if exists check_messages_rate_limit on public.messages;
create trigger check_messages_rate_limit
before insert on public.messages
for each row execute function public.enforce_rate_limits();

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