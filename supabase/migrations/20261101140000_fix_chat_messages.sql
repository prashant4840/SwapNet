-- Migration: 20261101140000_fix_chat_messages.sql
-- Description: Fix chat database mismatch, ensure receiver_id is populated and indexed,
--              set replica identity for realtime, and configure secure participant RLS policies.

-- 1. Ensure receiver_id column exists
alter table public.messages 
  add column if not exists receiver_id uuid references public.users(id) on delete cascade;

-- 2. Create indexes on receiver_id
create index if not exists messages_receiver_id_idx on public.messages (receiver_id);
create index if not exists messages_sender_receiver_idx on public.messages (sender_id, receiver_id);

-- 3. Backfill receiver_id for existing messages from swap_requests and connection_requests
update public.messages m
set receiver_id = case
  when m.sender_id = s.sender_id then s.receiver_id
  else s.sender_id
end
from public.swap_requests s
where m.swap_id = s.id
  and m.receiver_id is null;

update public.messages m
set receiver_id = case
  when m.sender_id = c.sender_id then c.receiver_id
  else c.sender_id
end
from public.connection_requests c
where m.connection_request_id = c.id
  and m.receiver_id is null;

-- 4. Enable full replica identity for realtime synchronization
alter table public.messages replica identity full;

-- 5. Drop outdated policies
drop policy if exists "Chat participants can read messages" on public.messages;
drop policy if exists "Chat participants can send messages" on public.messages;

-- 6. Create secure RLS policies ensuring both conversation participants can read & send
create policy "Chat participants can read messages"
on public.messages for select to authenticated
using (
  auth.uid() = sender_id
  or auth.uid() = receiver_id
  or (
    swap_id is not null and exists (
      select 1 from public.swap_requests
      where id = messages.swap_id
        and auth.uid() in (sender_id, receiver_id)
    )
  )
  or (
    connection_request_id is not null and exists (
      select 1 from public.connection_requests
      where id = messages.connection_request_id
        and auth.uid() in (sender_id, receiver_id)
    )
  )
);

create policy "Chat participants can send messages"
on public.messages for insert to authenticated
with check (
  auth.uid() = sender_id
  and (
    (
      swap_id is not null and exists (
        select 1 from public.swap_requests
        where id = messages.swap_id
          and auth.uid() in (sender_id, receiver_id)
          and (
            messages.receiver_id is null
            or messages.receiver_id in (swap_requests.sender_id, swap_requests.receiver_id)
          )
      )
    )
    or (
      connection_request_id is not null and exists (
        select 1 from public.connection_requests
        where id = messages.connection_request_id
          and status = 'Accepted'
          and auth.uid() in (sender_id, receiver_id)
          and (
            messages.receiver_id is null
            or messages.receiver_id in (connection_requests.sender_id, connection_requests.receiver_id)
          )
      )
    )
  )
);
