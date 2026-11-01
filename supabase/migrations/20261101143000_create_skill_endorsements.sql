-- Migration: 20261101143000_create_skill_endorsements.sql
-- Description: Implement skill endorsements table, foreign keys, unique constraints,
--              self-endorsement prevention, indexes, and secure Row Level Security policies.

create table if not exists public.skill_endorsements (
  id uuid primary key default gen_random_uuid(),
  endorser_id uuid not null references public.users(id) on delete cascade,
  endorsed_user_id uuid not null references public.users(id) on delete cascade,
  swap_request_id uuid references public.swap_requests(id) on delete set null,
  skill_name text not null,
  created_at timestamptz not null default now(),
  constraint no_self_endorsement check (endorser_id <> endorsed_user_id),
  unique (endorser_id, endorsed_user_id, skill_name)
);

-- Optimize queries by endorsed user, endorser, and swap request
create index if not exists idx_skill_endorsements_endorsed_user 
  on public.skill_endorsements (endorsed_user_id);
create index if not exists idx_skill_endorsements_endorser 
  on public.skill_endorsements (endorser_id);
create index if not exists idx_skill_endorsements_swap 
  on public.skill_endorsements (swap_request_id);

-- Enable Row Level Security
alter table public.skill_endorsements enable row level security;

-- Policies:
-- 1. Read access: Endorsements are visible for community profile verification
create policy "Skill endorsements are publicly readable"
  on public.skill_endorsements for select
  using (true);

-- 2. Insert access: Users can only endorse other users and cannot self-endorse
create policy "Users can endorse peer skills"
  on public.skill_endorsements for insert to authenticated
  with check (
    auth.uid() = endorser_id
    and auth.uid() <> endorsed_user_id
  );

-- 3. Update access: Endorsers can update their own endorsements
create policy "Endorsers can update their own endorsements"
  on public.skill_endorsements for update to authenticated
  using (auth.uid() = endorser_id)
  with check (
    auth.uid() = endorser_id
    and auth.uid() <> endorsed_user_id
  );

-- 4. Delete access: Endorsers can revoke their own endorsements
create policy "Endorsers can delete their own endorsements"
  on public.skill_endorsements for delete to authenticated
  using (auth.uid() = endorser_id);

-- Realtime replication support
alter table public.skill_endorsements replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' 
      and schemaname = 'public' 
      and tablename = 'skill_endorsements'
  ) then
    alter publication supabase_realtime add table public.skill_endorsements;
  end if;
end $$;
