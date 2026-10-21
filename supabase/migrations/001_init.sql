-- Fitrack initial schema
-- Every table is scoped to auth.users via user_id with RLS: a user can only read/write their own rows.

create type public.ippt_award as enum ('gold', 'silver', 'incentive', 'pass', 'fail');
create type public.ippt_target as enum ('pass', 'incentive', 'silver', 'gold');

-- IPPT attempts ---------------------------------------------------------------
create table public.ippt_attempts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  date        date not null default current_date,
  age_group   smallint not null check (age_group between 1 and 14),
  pushups     smallint not null check (pushups >= 0),
  situps      smallint not null check (situps >= 0),
  run_seconds integer  not null check (run_seconds > 0),
  pu_pts      smallint not null check (pu_pts between 0 and 25),
  su_pts      smallint not null check (su_pts between 0 and 25),
  run_pts     smallint not null check (run_pts between 0 and 50),
  total       smallint not null check (total between 0 and 100),
  award       public.ippt_award not null,
  created_at  timestamptz not null default now()
);
create index ippt_attempts_user_date_idx on public.ippt_attempts (user_id, date desc);

-- Weights ---------------------------------------------------------------------
create table public.weights (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  date       date not null default current_date,
  kg         numeric(5, 2) not null check (kg > 0 and kg < 400),
  waist_cm   numeric(5, 1) check (waist_cm is null or (waist_cm > 0 and waist_cm < 300)),
  note       text,
  created_at timestamptz not null default now()
);
create index weights_user_date_idx on public.weights (user_id, date desc);

-- Daily logs (one row per user per day) ---------------------------------------
create table public.daily_logs (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users (id) on delete cascade,
  date            date not null default current_date,
  steps           integer not null default 0 check (steps >= 0),
  kcal_burned     integer not null default 0 check (kcal_burned >= 0),
  pt_sessions     smallint not null default 0 check (pt_sessions >= 0),
  water_l         numeric(4, 2) not null default 0 check (water_l >= 0),
  sleep_h         numeric(4, 2) not null default 0 check (sleep_h >= 0 and sleep_h <= 24),
  half_rice       boolean not null default false,
  no_sweet_drinks boolean not null default false,
  night_snack     text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint daily_logs_user_date_key unique (user_id, date)
);

-- Stash items (food bought per booking) ---------------------------------------
create table public.stash_items (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  booking_start date not null default current_date,
  name          text not null check (length(trim(name)) > 0),
  qty_bought    integer not null check (qty_bought > 0),
  qty_left      integer not null check (qty_left >= 0),
  kcal_per_unit integer not null default 0 check (kcal_per_unit >= 0),
  created_at    timestamptz not null default now(),
  constraint stash_items_qty_left_le_bought check (qty_left <= qty_bought)
);
create index stash_items_user_booking_idx on public.stash_items (user_id, booking_start desc);

-- Goals (one row per user) ----------------------------------------------------
create table public.goals (
  user_id     uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  target_kg   numeric(5, 2) check (target_kg is null or (target_kg > 0 and target_kg < 400)),
  ippt_target public.ippt_target not null default 'pass',
  age_group   smallint check (age_group is null or age_group between 1 and 14),
  updated_at  timestamptz not null default now()
);

-- updated_at triggers ---------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger daily_logs_set_updated_at
  before update on public.daily_logs
  for each row execute function public.set_updated_at();

create trigger goals_set_updated_at
  before update on public.goals
  for each row execute function public.set_updated_at();

-- Row Level Security ----------------------------------------------------------
alter table public.ippt_attempts enable row level security;
alter table public.weights       enable row level security;
alter table public.daily_logs    enable row level security;
alter table public.stash_items   enable row level security;
alter table public.goals         enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array['ippt_attempts', 'weights', 'daily_logs', 'stash_items', 'goals'] loop
    execute format(
      'create policy "%1$s_select_own" on public.%1$I for select to authenticated using ((select auth.uid()) = user_id)', t);
    execute format(
      'create policy "%1$s_insert_own" on public.%1$I for insert to authenticated with check ((select auth.uid()) = user_id)', t);
    execute format(
      'create policy "%1$s_update_own" on public.%1$I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', t);
    execute format(
      'create policy "%1$s_delete_own" on public.%1$I for delete to authenticated using ((select auth.uid()) = user_id)', t);
  end loop;
end;
$$;
