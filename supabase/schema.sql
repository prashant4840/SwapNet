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

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,
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
  updated_at timestamptz not null default now()
);

create table if not exists public.skills_offered (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  skill_name text not null,
  category text not null check (
    category in (
      'Music',
      'Tech',
      'Creative',
      'Wellness',
      'Lifestyle',
      'Academic',
      'Business',
      'Languages'
    )
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
    category in (
      'Music',
      'Tech',
      'Creative',
      'Wellness',
      'Lifestyle',
      'Academic',
      'Business',
      'Languages'
    )
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

create table if not exists public.chats (
  id uuid primary key default gen_random_uuid(),
  swap_id uuid not null references public.swap_requests(id) on delete cascade,
  sender_id uuid not null references public.users(id) on delete cascade,
  message text not null,
  message_type text not null default 'text' check (
    message_type in ('text', 'template', 'system')
  ),
  created_at timestamptz not null default now()
);

create index if not exists chats_swap_id_idx on public.chats (swap_id, created_at);

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
    type in ('match', 'request', 'chat', 'review', 'system', 'post')
  ),
  title text not null,
  description text not null,
  link text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_idx on public.notifications (user_id, created_at desc);

create table if not exists public.looking_for_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  skill_name text not null,
  category text not null check (
    category in (
      'Music',
      'Tech',
      'Creative',
      'Wellness',
      'Lifestyle',
      'Academic',
      'Business',
      'Languages'
    )
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

create trigger set_users_updated_at
before update on public.users
for each row
execute function public.set_updated_at();

create trigger set_swap_requests_updated_at
before update on public.swap_requests
for each row
execute function public.set_updated_at();

create trigger set_looking_for_posts_updated_at
before update on public.looking_for_posts
for each row
execute function public.set_updated_at();

alter table public.users enable row level security;
alter table public.skills_offered enable row level security;
alter table public.skills_wanted enable row level security;
alter table public.swap_requests enable row level security;
alter table public.chats enable row level security;
alter table public.reviews enable row level security;
alter table public.notifications enable row level security;
alter table public.looking_for_posts enable row level security;
alter table public.abuse_reports enable row level security;

create policy "Public profiles are readable"
on public.users
for select
using (true);

create policy "Users can create their own profile"
on public.users
for insert
to authenticated
with check (auth.uid() = auth_user_id);

create policy "Users can update their own profile"
on public.users
for update
to authenticated
using (auth.uid() = auth_user_id)
with check (auth.uid() = auth_user_id);

create policy "Skills offered are publicly readable"
on public.skills_offered
for select
using (true);

create policy "Owners manage their offered skills"
on public.skills_offered
for all
to authenticated
using (
  exists (
    select 1
    from public.users
    where public.users.id = skills_offered.user_id
      and public.users.auth_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.users
    where public.users.id = skills_offered.user_id
      and public.users.auth_user_id = auth.uid()
  )
);

create policy "Skills wanted are publicly readable"
on public.skills_wanted
for select
using (true);

create policy "Owners manage their wanted skills"
on public.skills_wanted
for all
to authenticated
using (
  exists (
    select 1
    from public.users
    where public.users.id = skills_wanted.user_id
      and public.users.auth_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.users
    where public.users.id = skills_wanted.user_id
      and public.users.auth_user_id = auth.uid()
  )
);

create policy "Swap participants can read their requests"
on public.swap_requests
for select
to authenticated
using (
  exists (
    select 1
    from public.users
    where public.users.id in (swap_requests.sender_id, swap_requests.receiver_id)
      and public.users.auth_user_id = auth.uid()
  )
);

create policy "Senders can create swap requests"
on public.swap_requests
for insert
to authenticated
with check (
  exists (
    select 1
    from public.users
    where public.users.id = swap_requests.sender_id
      and public.users.auth_user_id = auth.uid()
  )
);

create policy "Participants can update swap requests"
on public.swap_requests
for update
to authenticated
using (
  exists (
    select 1
    from public.users
    where public.users.id in (swap_requests.sender_id, swap_requests.receiver_id)
      and public.users.auth_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.users
    where public.users.id in (swap_requests.sender_id, swap_requests.receiver_id)
      and public.users.auth_user_id = auth.uid()
  )
);

create policy "Chat participants can read messages"
on public.chats
for select
to authenticated
using (
  exists (
    select 1
    from public.swap_requests
    join public.users
      on public.users.id in (public.swap_requests.sender_id, public.swap_requests.receiver_id)
    where public.swap_requests.id = chats.swap_id
      and public.users.auth_user_id = auth.uid()
  )
);

create policy "Chat participants can send messages"
on public.chats
for insert
to authenticated
with check (
  exists (
    select 1
    from public.users
    where public.users.id = chats.sender_id
      and public.users.auth_user_id = auth.uid()
  )
  and exists (
    select 1
    from public.swap_requests
    where public.swap_requests.id = chats.swap_id
      and chats.sender_id in (public.swap_requests.sender_id, public.swap_requests.receiver_id)
  )
);

create policy "Reviews are publicly readable"
on public.reviews
for select
using (true);

create policy "Participants can write one review per swap"
on public.reviews
for insert
to authenticated
with check (
  exists (
    select 1
    from public.users
    where public.users.id = reviews.reviewer_id
      and public.users.auth_user_id = auth.uid()
  )
  and exists (
    select 1
    from public.swap_requests
    where public.swap_requests.id = reviews.swap_id
      and public.swap_requests.status = 'Completed'
      and reviews.reviewer_id in (public.swap_requests.sender_id, public.swap_requests.receiver_id)
      and reviews.reviewee_id in (public.swap_requests.sender_id, public.swap_requests.receiver_id)
  )
);

create policy "Users can read their own notifications"
on public.notifications
for select
to authenticated
using (
  exists (
    select 1
    from public.users
    where public.users.id = notifications.user_id
      and public.users.auth_user_id = auth.uid()
  )
);

create policy "Users can update their own notifications"
on public.notifications
for update
to authenticated
using (
  exists (
    select 1
    from public.users
    where public.users.id = notifications.user_id
      and public.users.auth_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.users
    where public.users.id = notifications.user_id
      and public.users.auth_user_id = auth.uid()
  )
);

create policy "Looking-for posts are publicly readable"
on public.looking_for_posts
for select
using (true);

create policy "Owners manage their looking-for posts"
on public.looking_for_posts
for all
to authenticated
using (
  exists (
    select 1
    from public.users
    where public.users.id = looking_for_posts.user_id
      and public.users.auth_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.users
    where public.users.id = looking_for_posts.user_id
      and public.users.auth_user_id = auth.uid()
  )
);

create policy "Authenticated users can report abuse"
on public.abuse_reports
for insert
to authenticated
with check (
  exists (
    select 1
    from public.users
    where public.users.id = abuse_reports.reporter_id
      and public.users.auth_user_id = auth.uid()
  )
);

insert into storage.buckets (id, name, public)
values ('profile-photos', 'profile-photos', true)
on conflict (id) do nothing;

create policy "Profile photos are publicly readable"
on storage.objects
for select
using (bucket_id = 'profile-photos');

create policy "Authenticated users can upload profile photos"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'profile-photos');

create policy "Authenticated users can update profile photos"
on storage.objects
for update
to authenticated
using (bucket_id = 'profile-photos')
with check (bucket_id = 'profile-photos');

alter publication supabase_realtime add table public.chats;
