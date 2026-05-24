-- Scheduling capacity, workload, and route-planning support
alter table public.jobs add column if not exists estimated_duration_minutes integer not null default 60;
alter table public.jobs add column if not exists required_crew_size integer not null default 1;
alter table public.jobs add column if not exists earliest_start_time time;
alter table public.jobs add column if not exists latest_end_time time;
alter table public.jobs add column if not exists route_priority integer not null default 0;

create table if not exists public.crew_availability (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  available_date date not null,
  start_time time not null,
  end_time time not null,
  max_hours numeric(5,2),
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id, available_date, start_time, end_time)
);

alter table public.crew_availability enable row level security;

drop policy if exists "crew availability admin all" on public.crew_availability;
create policy "crew availability admin all" on public.crew_availability for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "crew availability own read" on public.crew_availability;
create policy "crew availability own read" on public.crew_availability for select using (profile_id = public.current_profile_id() or public.is_admin());
