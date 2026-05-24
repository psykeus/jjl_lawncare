-- Admin-managed service areas for public request validation and map planning
create table if not exists public.service_areas (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  area_type text not null default 'bounds' check (area_type in ('zip', 'city', 'radius', 'bounds', 'polygon')),
  zip_codes text[] not null default '{}'::text[],
  cities text[] not null default '{}'::text[],
  center_lat numeric(10,7),
  center_lng numeric(10,7),
  radius_miles numeric(8,2),
  boundary_geojson jsonb not null default '{}'::jsonb,
  outside_area_message text,
  accepts_requests boolean not null default true,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.service_areas enable row level security;

drop policy if exists "service areas public active read" on public.service_areas;
create policy "service areas public active read" on public.service_areas for select using (active = true or public.is_admin());

drop policy if exists "service areas admin all" on public.service_areas;
create policy "service areas admin all" on public.service_areas for all using (public.is_admin()) with check (public.is_admin());

insert into public.service_areas (
  name,
  area_type,
  cities,
  boundary_geojson,
  outside_area_message,
  accepts_requests,
  active,
  sort_order
) values (
  'Greater Cincinnati Planning Area',
  'bounds',
  array['Cincinnati','Norwood','Blue Ash','Mason','Loveland','Milford','Madeira','Indian Hill','Mariemont','Anderson','West Chester','Fairfield','Covington','Newport'],
  '{"north":39.55,"south":38.75,"east":-83.75,"west":-85.05}'::jsonb,
  'This address appears to be outside the current Greater Cincinnati service area. You can still contact JJL Lawn Services, but the crew may not be able to accept the job.',
  true,
  true,
  10
)
on conflict (name) do update set
  area_type = excluded.area_type,
  cities = excluded.cities,
  boundary_geojson = excluded.boundary_geojson,
  outside_area_message = excluded.outside_area_message,
  accepts_requests = excluded.accepts_requests,
  active = excluded.active,
  sort_order = excluded.sort_order,
  updated_at = now();
