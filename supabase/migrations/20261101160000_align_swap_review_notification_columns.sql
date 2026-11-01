-- Migration: 20261101160000_align_swap_review_notification_columns.sql
-- Description: Align swap_requests, reviews, and notifications tables with schema.sql and application requirements

-- 1. swap_requests columns
alter table public.swap_requests
  add column if not exists offered_skill_id uuid references public.skills_offered(id) on delete set null,
  add column if not exists wanted_skill_id uuid references public.skills_wanted(id) on delete set null,
  add column if not exists completed_by uuid[] not null default '{}';

create index if not exists swap_requests_offered_skill_idx on public.swap_requests (offered_skill_id);
create index if not exists swap_requests_wanted_skill_idx on public.swap_requests (wanted_skill_id);

-- 2. reviews columns
alter table public.reviews
  add column if not exists swap_id uuid references public.swap_requests(id) on delete cascade;

create index if not exists reviews_swap_idx on public.reviews (swap_id);

-- 3. notifications columns
alter table public.notifications
  add column if not exists type text not null default 'system',
  add column if not exists link text;

-- Add check constraint for notification type if not exists
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'notifications_type_check'
  ) then
    alter table public.notifications
      add constraint notifications_type_check
      check (type in ('match', 'request', 'connection', 'chat', 'review', 'system', 'post'));
  end if;
end;
$$;
