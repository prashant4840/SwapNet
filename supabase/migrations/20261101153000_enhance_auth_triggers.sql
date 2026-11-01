-- Migration: 20261101153000_enhance_auth_triggers.sql
-- Description: Improve handle_new_user trigger to extract Google OAuth picture/avatar,
--              handle name/username edge cases, and synchronize profiles.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_username text;
  final_username text;
  avatar_val text;
  display_name text;
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

  while exists (select 1 from public.users where username = final_username and id <> new.id) loop
    final_username := base_username || '-' || counter;
    counter := counter + 1;
  end loop;

  avatar_val := coalesce(
    nullif(trim(new.raw_user_meta_data->>'avatar_url'), ''),
    nullif(trim(new.raw_user_meta_data->>'picture'), ''),
    'https://api.dicebear.com/9.x/shapes/svg?seed=' || new.id
  );

  display_name := coalesce(
    nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
    nullif(trim(new.raw_user_meta_data->>'name'), ''),
    split_part(new.email, '@', 1),
    'Member'
  );

  insert into public.users (id, username, name, email, photo, city, bio, headline)
  values (
    new.id,
    final_username,
    display_name,
    new.email,
    avatar_val,
    coalesce(nullif(trim(new.raw_user_meta_data->>'city'), ''), 'Remote'),
    'Tell the community what you love teaching and what you want to learn next.',
    'New member ready to trade skills'
  )
  on conflict (id) do update set
    photo = case
      when public.users.photo like '%dicebear%' or public.users.photo = ''
        then excluded.photo
      else public.users.photo
    end,
    name = coalesce(nullif(public.users.name, ''), excluded.name);

  return new;
end;
$$;

-- Ensure trigger is active on auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
