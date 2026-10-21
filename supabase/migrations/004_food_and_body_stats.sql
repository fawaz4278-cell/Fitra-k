-- Calorie deficit: body stats for resting burn, and a log of food eaten.

alter table public.goals
  add column height_cm  numeric(5, 1) check (height_cm is null or (height_cm > 100 and height_cm < 250)),
  add column birth_year smallint      check (birth_year is null or (birth_year > 1940 and birth_year < 2020));

create table public.food_logs (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  date          date not null default current_date,
  name          text not null check (length(trim(name)) > 0),
  kcal          integer not null check (kcal >= 0 and kcal < 10000),
  -- Set when the food came off the stash, so un-eating an item can remove it again.
  stash_item_id uuid references public.stash_items (id) on delete set null,
  created_at    timestamptz not null default now()
);
create index food_logs_user_date_idx on public.food_logs (user_id, date desc);

alter table public.food_logs enable row level security;

create policy "food_logs_select_own" on public.food_logs for select to authenticated using ((select auth.uid()) = user_id);
create policy "food_logs_insert_own" on public.food_logs for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "food_logs_update_own" on public.food_logs for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "food_logs_delete_own" on public.food_logs for delete to authenticated using ((select auth.uid()) = user_id);
