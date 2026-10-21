-- Fitrack is a single-user app: one account, password sign-in only.
-- Before running, replace YOUR_EMAIL and YOUR_PASSWORD below (keep the quotes).

-- 1. Set (or reset) your password and mark the email confirmed.
update auth.users
set encrypted_password = extensions.crypt('YOUR_PASSWORD', extensions.gen_salt('bf')),
    email_confirmed_at = coalesce(email_confirmed_at, now())
where email = 'YOUR_EMAIL';

-- 2. Block any further accounts from being created.
create or replace function public.only_one_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (select 1 from auth.users) then
    raise exception 'Fitrack is single-user: sign-ups are closed';
  end if;
  return new;
end;
$$;

drop trigger if exists only_one_user on auth.users;
create trigger only_one_user
  before insert on auth.users
  for each row execute function public.only_one_user();
