-- Admin-managed service intake questions, options, and normalized request-service details
create table if not exists public.service_questions (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services(id) on delete cascade,
  question_text text not null,
  question_type text not null default 'single_choice' check (question_type in ('single_choice', 'multi_choice', 'yes_no', 'short_text', 'number')),
  required boolean not null default false,
  help_text text,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (service_id, question_text)
);

create table if not exists public.service_question_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.service_questions(id) on delete cascade,
  label text not null,
  value text not null,
  price_modifier numeric(10,2) not null default 0,
  duration_modifier_minutes integer not null default 0,
  risk_modifier text not null default 'none' check (risk_modifier in ('none', 'low', 'medium', 'high')),
  requires_parent_approval boolean not null default false,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (question_id, value)
);

create table if not exists public.quote_request_services (
  id uuid primary key default gen_random_uuid(),
  quote_request_id uuid not null references public.quote_requests(id) on delete cascade,
  service_id uuid references public.services(id) on delete set null,
  notes text,
  estimated_duration_minutes integer,
  estimated_price_min numeric(10,2),
  estimated_price_max numeric(10,2),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quote_request_service_answers (
  id uuid primary key default gen_random_uuid(),
  quote_request_service_id uuid not null references public.quote_request_services(id) on delete cascade,
  question_id uuid references public.service_questions(id) on delete set null,
  option_id uuid references public.service_question_options(id) on delete set null,
  answer_text text,
  created_at timestamptz not null default now()
);

create table if not exists public.quote_request_service_photos (
  id uuid primary key default gen_random_uuid(),
  quote_request_service_id uuid not null references public.quote_request_services(id) on delete cascade,
  media_file_id uuid references public.media_files(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.service_questions enable row level security;
alter table public.service_question_options enable row level security;
alter table public.quote_request_services enable row level security;
alter table public.quote_request_service_answers enable row level security;
alter table public.quote_request_service_photos enable row level security;

drop policy if exists "service questions public active read" on public.service_questions;
create policy "service questions public active read" on public.service_questions for select using (active = true or public.is_admin());

drop policy if exists "service questions admin all" on public.service_questions;
create policy "service questions admin all" on public.service_questions for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "service question options public active read" on public.service_question_options;
create policy "service question options public active read" on public.service_question_options for select using (active = true or public.is_admin());

drop policy if exists "service question options admin all" on public.service_question_options;
create policy "service question options admin all" on public.service_question_options for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "quote request services admin all" on public.quote_request_services;
create policy "quote request services admin all" on public.quote_request_services for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "quote request services own read" on public.quote_request_services;
create policy "quote request services own read" on public.quote_request_services for select using (
  exists (select 1 from public.quote_requests qr where qr.id = quote_request_id and public.owns_customer(qr.customer_id))
);

drop policy if exists "quote request service answers admin all" on public.quote_request_service_answers;
create policy "quote request service answers admin all" on public.quote_request_service_answers for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "quote request service answers own read" on public.quote_request_service_answers;
create policy "quote request service answers own read" on public.quote_request_service_answers for select using (
  exists (
    select 1 from public.quote_request_services qrs
    join public.quote_requests qr on qr.id = qrs.quote_request_id
    where qrs.id = quote_request_service_id and public.owns_customer(qr.customer_id)
  )
);

drop policy if exists "quote request service photos admin all" on public.quote_request_service_photos;
create policy "quote request service photos admin all" on public.quote_request_service_photos for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "quote request service photos own read" on public.quote_request_service_photos;
create policy "quote request service photos own read" on public.quote_request_service_photos for select using (
  exists (
    select 1 from public.quote_request_services qrs
    join public.quote_requests qr on qr.id = qrs.quote_request_id
    where qrs.id = quote_request_service_id and public.owns_customer(qr.customer_id)
  )
);

insert into public.service_questions (service_id, question_text, question_type, required, help_text, sort_order)
select s.id, 'How large is the area you need cut?', 'single_choice', true, 'Choose the closest option. Photos help the crew confirm.', 10
from public.services s
where s.name = 'Basic Cut'
on conflict do nothing;

insert into public.service_questions (service_id, question_text, question_type, required, help_text, sort_order)
select s.id, 'How tall is the grass?', 'single_choice', true, 'Tall or wet grass may change the estimate and route timing.', 20
from public.services s
where s.name = 'Basic Cut'
on conflict do nothing;

insert into public.service_question_options (question_id, label, value, duration_modifier_minutes, sort_order)
select q.id, v.label, v.value, v.duration_modifier_minutes, v.sort_order
from public.service_questions q
join public.services s on s.id = q.service_id
join (values
  ('How large is the area you need cut?', 'Less than a quarter acre', 'less_than_quarter_acre', 0, 10),
  ('How large is the area you need cut?', 'A quarter to half acre', 'quarter_to_half_acre', 20, 20),
  ('How large is the area you need cut?', 'More than a half acre', 'more_than_half_acre', 45, 30),
  ('How tall is the grass?', '6 inches or less', 'six_inches_or_less', 0, 10),
  ('How tall is the grass?', 'Over 6 inches', 'over_six_inches', 25, 20)
) as v(question_text, label, value, duration_modifier_minutes, sort_order) on v.question_text = q.question_text
where s.name = 'Basic Cut'
on conflict do nothing;
