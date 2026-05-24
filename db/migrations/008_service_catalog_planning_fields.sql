-- Public catalog display, workload defaults, and targeted service upsells
alter table public.services add column if not exists featured_on_homepage boolean not null default false;
alter table public.services add column if not exists homepage_title text;
alter table public.services add column if not exists homepage_summary text;
alter table public.services add column if not exists homepage_sort_order integer not null default 0;
alter table public.services add column if not exists estimated_duration_minutes integer not null default 60;
alter table public.services add column if not exists default_crew_size integer not null default 1;

create table if not exists public.service_upsells (
  id uuid primary key default gen_random_uuid(),
  core_service_id uuid not null references public.services(id) on delete cascade,
  upsell_service_id uuid not null references public.services(id) on delete cascade,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (core_service_id, upsell_service_id)
);

alter table public.service_upsells enable row level security;

drop policy if exists "service upsells public active read" on public.service_upsells;
create policy "service upsells public active read" on public.service_upsells for select using (
  active = true or public.is_admin()
);

drop policy if exists "service upsells admin all" on public.service_upsells;
create policy "service upsells admin all" on public.service_upsells for all using (public.is_admin()) with check (public.is_admin());

update public.services set
  featured_on_homepage = true,
  homepage_title = coalesce(homepage_title, name),
  homepage_summary = coalesce(homepage_summary, public_description),
  homepage_sort_order = sort_order,
  estimated_duration_minutes = case name
    when 'Basic Cut' then 60
    when 'Clean Cut' then 80
    when 'Yard Reset' then 120
    when 'Mulch Refresh' then 150
    else estimated_duration_minutes
  end,
  default_crew_size = case name
    when 'Yard Reset' then 2
    when 'Mulch Refresh' then 2
    else default_crew_size
  end
where service_type = 'core';

update public.services set estimated_duration_minutes = case name
  when 'Edging' then 15
  when 'Overgrown Grass Surcharge' then 30
  when 'Stick Pickup' then 20
  when 'Extra Weed Pulling' then 30
  when 'Debris Bagging' then 15
  when 'Dog Waste Cleanup' then 20
  else estimated_duration_minutes
end
where service_type = 'add_on';

insert into public.service_upsells (core_service_id, upsell_service_id, sort_order)
select core.id, add_on.id, v.sort_order
from (values
  ('Basic Cut', 'Edging', 10),
  ('Basic Cut', 'Stick Pickup', 20),
  ('Basic Cut', 'Overgrown Grass Surcharge', 30),
  ('Clean Cut', 'Stick Pickup', 10),
  ('Clean Cut', 'Debris Bagging', 20),
  ('Yard Reset', 'Extra Weed Pulling', 10),
  ('Yard Reset', 'Debris Bagging', 20),
  ('Yard Reset', 'Dog Waste Cleanup', 30),
  ('Mulch Refresh', 'Extra Weed Pulling', 10),
  ('Mulch Refresh', 'Debris Bagging', 20)
) as v(core_name, upsell_name, sort_order)
join public.services core on core.name = v.core_name
join public.services add_on on add_on.name = v.upsell_name
on conflict (core_service_id, upsell_service_id) do update set sort_order = excluded.sort_order, active = true, updated_at = now();
