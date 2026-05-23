-- JJL Lawn Services initial schema
create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique not null references auth.users(id) on delete cascade,
  name text,
  email text,
  phone text,
  role text not null default 'customer' check (role in ('customer', 'crew', 'admin')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  name text not null,
  email text,
  phone text,
  notes text,
  status text not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.properties (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  address_line_1 text not null,
  address_line_2 text,
  city text not null,
  state text not null,
  zip text not null,
  latitude numeric(10,7),
  longitude numeric(10,7),
  gate_notes text,
  pet_notes text,
  hazard_notes text,
  yard_size text,
  access_notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.service_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.service_categories(id) on delete set null,
  name text not null unique,
  public_description text,
  internal_description text,
  service_type text not null default 'core' check (service_type in ('core', 'add_on', 'excluded', 'case_by_case')),
  pricing_type text not null default 'custom_estimate' check (pricing_type in ('flat', 'range', 'per_crew_hour', 'per_unit', 'per_cubic_yard', 'custom_estimate')),
  base_price numeric(10,2),
  min_price numeric(10,2),
  max_price numeric(10,2),
  unit_label text,
  default_quantity numeric(10,2) default 1,
  customer_visible_range text,
  visible_to_customer boolean not null default true,
  requires_parent_approval boolean not null default false,
  requires_photos boolean not null default false,
  requires_site_review boolean not null default false,
  recurring_capable boolean not null default false,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.quote_requests (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  requested_service_id uuid references public.services(id) on delete set null,
  status text not null default 'new' check (status in ('new', 'needs_review', 'needs_more_info', 'site_review_needed', 'estimate_drafted', 'estimate_sent', 'converted_to_job', 'declined', 'archived')),
  yard_size text,
  grass_height text,
  debris_present boolean not null default false,
  dog_waste_present boolean not null default false,
  pets_present boolean not null default false,
  gate_access text,
  preferred_dates text,
  customer_notes text,
  internal_notes text,
  risk_level text not null default 'low' check (risk_level in ('low', 'medium', 'high', 'decline')),
  parent_approval_required boolean not null default false,
  parent_approved_at timestamptz,
  parent_approved_by uuid references public.profiles(id),
  terms_accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  document_type text not null check (document_type in ('estimate', 'invoice')),
  document_number text,
  customer_id uuid not null references public.customers(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  quote_request_id uuid references public.quote_requests(id) on delete set null,
  job_id uuid,
  status text not null default 'draft',
  issue_date date default current_date,
  expiration_date date,
  due_date date,
  subtotal numeric(10,2) not null default 0,
  discount_total numeric(10,2) not null default 0,
  tax_total numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0,
  amount_paid numeric(10,2) not null default 0,
  balance_due numeric(10,2) not null default 0,
  scope_included text,
  scope_excluded text,
  customer_notes text,
  internal_notes text,
  payment_instructions text,
  terms_version_id uuid,
  snapshot_json jsonb not null default '{}'::jsonb,
  accepted_at timestamptz,
  declined_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.document_items (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  service_id uuid references public.services(id) on delete set null,
  item_type text not null default 'custom' check (item_type in ('service', 'add_on', 'material', 'discount', 'tax', 'custom')),
  description text not null,
  quantity numeric(10,2) not null default 1,
  unit_label text,
  unit_price numeric(10,2) not null default 0,
  line_total numeric(10,2) not null default 0,
  taxable boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  estimate_id uuid references public.documents(id) on delete set null,
  invoice_id uuid references public.documents(id) on delete set null,
  status text not null default 'accepted' check (status in ('accepted', 'scheduled', 'on_hold', 'on_the_way', 'in_progress', 'completed', 'completed_unpaid', 'paid', 'cancelled', 'declined')),
  scheduled_date date,
  scheduled_start_time time,
  scheduled_end_time time,
  assigned_crew_ids uuid[] not null default '{}'::uuid[],
  checklist_snapshot jsonb not null default '[]'::jsonb,
  tool_notes text,
  safety_notes text,
  internal_notes text,
  customer_visible_notes text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.documents add constraint documents_job_id_fkey foreign key (job_id) references public.jobs(id) on delete set null;

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references public.documents(id) on delete cascade,
  job_id uuid references public.jobs(id) on delete set null,
  amount numeric(10,2) not null,
  method text not null check (method in ('cash', 'venmo', 'other')),
  status text not null default 'unpaid' check (status in ('unpaid', 'cash_pending', 'venmo_pending', 'partially_paid', 'paid', 'problem', 'refunded')),
  confirmed_by uuid references public.profiles(id),
  received_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references public.jobs(id) on delete set null,
  category text not null,
  amount numeric(10,2) not null,
  paid_by uuid references public.profiles(id),
  expense_date date not null default current_date,
  reimbursed boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.media_files (
  id uuid primary key default gen_random_uuid(),
  related_type text not null check (related_type in ('quote_request', 'job', 'payment', 'expense', 'property')),
  related_id uuid not null,
  file_url text not null,
  file_type text,
  label text not null default 'photo' check (label in ('before', 'after', 'receipt', 'payment', 'photo', 'other')),
  uploaded_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.terms_versions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  version text not null,
  unique (title, version),
  body text not null,
  effective_date date not null default current_date,
  active boolean not null default false,
  required_for_quote_request boolean not null default true,
  required_for_estimate_acceptance boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.terms_acceptances (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  property_id uuid references public.properties(id) on delete set null,
  quote_request_id uuid references public.quote_requests(id) on delete set null,
  document_id uuid references public.documents(id) on delete set null,
  terms_version_id uuid not null references public.terms_versions(id),
  accepted_name text not null,
  accepted_at timestamptz not null default now(),
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

create table public.checklist_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  service_id uuid references public.services(id) on delete set null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.checklist_items (
  id uuid primary key default gen_random_uuid(),
  checklist_template_id uuid not null references public.checklist_templates(id) on delete cascade,
  label text not null,
  required boolean not null default true,
  sort_order integer not null default 0,
  active boolean not null default true,
  unique (checklist_template_id, label)
);

create table public.settings (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  value_json jsonb not null default '{}'::jsonb,
  updated_by uuid references public.profiles(id),
  updated_at timestamptz not null default now()
);

create table public.activity_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id),
  action text not null,
  related_type text,
  related_id uuid,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index customers_profile_id_idx on public.customers(profile_id);
create index properties_customer_id_idx on public.properties(customer_id);
create index quote_requests_customer_id_idx on public.quote_requests(customer_id);
create index quote_requests_status_idx on public.quote_requests(status);
create index documents_customer_id_idx on public.documents(customer_id);
create index documents_type_status_idx on public.documents(document_type, status);
create index jobs_customer_id_idx on public.jobs(customer_id);
create index jobs_status_idx on public.jobs(status);
create index jobs_assigned_crew_ids_idx on public.jobs using gin(assigned_crew_ids);
create index payments_document_id_idx on public.payments(document_id);
create index expenses_job_id_idx on public.expenses(job_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger set_customers_updated_at before update on public.customers for each row execute function public.set_updated_at();
create trigger set_properties_updated_at before update on public.properties for each row execute function public.set_updated_at();
create trigger set_service_categories_updated_at before update on public.service_categories for each row execute function public.set_updated_at();
create trigger set_services_updated_at before update on public.services for each row execute function public.set_updated_at();
create trigger set_quote_requests_updated_at before update on public.quote_requests for each row execute function public.set_updated_at();
create trigger set_documents_updated_at before update on public.documents for each row execute function public.set_updated_at();
create trigger set_document_items_updated_at before update on public.document_items for each row execute function public.set_updated_at();
create trigger set_jobs_updated_at before update on public.jobs for each row execute function public.set_updated_at();
create trigger set_payments_updated_at before update on public.payments for each row execute function public.set_updated_at();
create trigger set_expenses_updated_at before update on public.expenses for each row execute function public.set_updated_at();
create trigger set_terms_versions_updated_at before update on public.terms_versions for each row execute function public.set_updated_at();
create trigger set_checklist_templates_updated_at before update on public.checklist_templates for each row execute function public.set_updated_at();


-- Auth helpers and RLS policies
create or replace function public.current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.profiles where auth_user_id = auth.uid() and active = true limit 1;
$$;

create or replace function public.current_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where auth_user_id = auth.uid() and active = true limit 1;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$ select coalesce(public.current_role() = 'admin', false); $$;

create or replace function public.is_crew()
returns boolean
language sql
stable
security definer
set search_path = public
as $$ select coalesce(public.current_role() in ('crew', 'admin'), false); $$;

create or replace function public.owns_customer(customer_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.customers c
    where c.id = customer_uuid and c.profile_id = public.current_profile_id()
  );
$$;

create or replace function public.can_access_job(job_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.jobs j
    where j.id = job_uuid
      and (
        public.is_admin()
        or public.current_profile_id() = any(j.assigned_crew_ids)
        or public.owns_customer(j.customer_id)
      )
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (auth_user_id, name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.email,
    'customer'
  )
  on conflict (auth_user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.customers enable row level security;
alter table public.properties enable row level security;
alter table public.service_categories enable row level security;
alter table public.services enable row level security;
alter table public.quote_requests enable row level security;
alter table public.documents enable row level security;
alter table public.document_items enable row level security;
alter table public.jobs enable row level security;
alter table public.payments enable row level security;
alter table public.expenses enable row level security;
alter table public.media_files enable row level security;
alter table public.terms_versions enable row level security;
alter table public.terms_acceptances enable row level security;
alter table public.checklist_templates enable row level security;
alter table public.checklist_items enable row level security;
alter table public.settings enable row level security;
alter table public.activity_log enable row level security;

create policy "profiles self or admin read" on public.profiles for select using (public.is_admin() or auth_user_id = auth.uid());
create policy "profiles self update" on public.profiles for update using (auth_user_id = auth.uid() or public.is_admin()) with check (auth_user_id = auth.uid() or public.is_admin());
create policy "profiles admin insert" on public.profiles for insert with check (public.is_admin());
create policy "profiles admin delete" on public.profiles for delete using (public.is_admin());

create policy "customers admin all" on public.customers for all using (public.is_admin()) with check (public.is_admin());
create policy "customers own read" on public.customers for select using (public.owns_customer(id));
create policy "customers own update" on public.customers for update using (public.owns_customer(id)) with check (public.owns_customer(id));

create policy "properties admin all" on public.properties for all using (public.is_admin()) with check (public.is_admin());
create policy "properties own read" on public.properties for select using (public.owns_customer(customer_id));
create policy "properties own update" on public.properties for update using (public.owns_customer(customer_id)) with check (public.owns_customer(customer_id));

create policy "service categories public active read" on public.service_categories for select using (active = true or public.is_crew());
create policy "service categories admin all" on public.service_categories for all using (public.is_admin()) with check (public.is_admin());

create policy "services public visible read" on public.services for select using ((active = true and visible_to_customer = true) or public.is_crew());
create policy "services admin all" on public.services for all using (public.is_admin()) with check (public.is_admin());

create policy "quote requests admin all" on public.quote_requests for all using (public.is_admin()) with check (public.is_admin());
create policy "quote requests own read" on public.quote_requests for select using (public.owns_customer(customer_id));
create policy "quote requests own insert" on public.quote_requests for insert with check (public.owns_customer(customer_id));

create policy "documents admin all" on public.documents for all using (public.is_admin()) with check (public.is_admin());
create policy "documents own read" on public.documents for select using (public.owns_customer(customer_id));
create policy "documents crew assigned read" on public.documents for select using (job_id is not null and public.can_access_job(job_id));

create policy "document items admin all" on public.document_items for all using (public.is_admin()) with check (public.is_admin());
create policy "document items related read" on public.document_items for select using (
  exists (select 1 from public.documents d where d.id = document_id and (public.is_admin() or public.owns_customer(d.customer_id) or (d.job_id is not null and public.can_access_job(d.job_id))))
);

create policy "jobs admin all" on public.jobs for all using (public.is_admin()) with check (public.is_admin());
create policy "jobs customer read" on public.jobs for select using (public.owns_customer(customer_id));
create policy "jobs crew assigned read" on public.jobs for select using (public.current_profile_id() = any(assigned_crew_ids));
create policy "jobs crew assigned update" on public.jobs for update using (public.current_profile_id() = any(assigned_crew_ids)) with check (public.current_profile_id() = any(assigned_crew_ids));

create policy "payments admin all" on public.payments for all using (public.is_admin()) with check (public.is_admin());
create policy "payments customer read" on public.payments for select using (
  exists (select 1 from public.documents d where d.id = document_id and public.owns_customer(d.customer_id))
);
create policy "payments crew assigned read" on public.payments for select using (job_id is not null and public.can_access_job(job_id));

create policy "expenses admin all" on public.expenses for all using (public.is_admin()) with check (public.is_admin());
create policy "expenses crew own insert" on public.expenses for insert with check (paid_by = public.current_profile_id());
create policy "expenses crew own read" on public.expenses for select using (paid_by = public.current_profile_id() or (job_id is not null and public.can_access_job(job_id)));

create policy "media admin all" on public.media_files for all using (public.is_admin()) with check (public.is_admin());
create policy "media related read" on public.media_files for select using (
  public.is_admin()
  or (related_type = 'job' and public.can_access_job(related_id))
  or (related_type = 'quote_request' and exists (select 1 from public.quote_requests qr where qr.id = related_id and public.owns_customer(qr.customer_id)))
  or (related_type = 'property' and exists (select 1 from public.properties p where p.id = related_id and public.owns_customer(p.customer_id)))
);
create policy "media crew insert" on public.media_files for insert with check (uploaded_by = public.current_profile_id());

create policy "terms public active read" on public.terms_versions for select using (active = true or public.is_admin());
create policy "terms admin all" on public.terms_versions for all using (public.is_admin()) with check (public.is_admin());

create policy "acceptances admin all" on public.terms_acceptances for all using (public.is_admin()) with check (public.is_admin());
create policy "acceptances own read" on public.terms_acceptances for select using (public.owns_customer(customer_id));
create policy "acceptances own insert" on public.terms_acceptances for insert with check (public.owns_customer(customer_id));

create policy "checklist templates crew read" on public.checklist_templates for select using (active = true or public.is_admin());
create policy "checklist templates admin all" on public.checklist_templates for all using (public.is_admin()) with check (public.is_admin());
create policy "checklist items crew read" on public.checklist_items for select using (active = true or public.is_admin());
create policy "checklist items admin all" on public.checklist_items for all using (public.is_admin()) with check (public.is_admin());

create policy "settings admin all" on public.settings for all using (public.is_admin()) with check (public.is_admin());
create policy "settings public selected read" on public.settings for select using (key in ('business', 'payment_public', 'public_site'));

create policy "activity admin read" on public.activity_log for select using (public.is_admin());
create policy "activity admin insert" on public.activity_log for insert with check (public.is_admin() or actor_id = public.current_profile_id() or actor_id is null);


-- Link existing customer records to a newly-created customer profile by matching email.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_profile_id uuid;
begin
  insert into public.profiles (auth_user_id, name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.email,
    'customer'
  )
  on conflict (auth_user_id) do update set email = excluded.email
  returning id into new_profile_id;

  update public.customers
  set profile_id = new_profile_id
  where profile_id is null
    and lower(email) = lower(new.email);

  return new;
end;
$$;


-- Private storage buckets and access policies for MVP uploads.
-- Public quote intake uses the service role from server actions; authenticated reads are still RLS-scoped here.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('quote-photos', 'quote-photos', false, 8388608, array['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('job-photos', 'job-photos', false, 8388608, array['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('receipts', 'receipts', false, 8388608, array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']),
  ('payment-proofs', 'payment-proofs', false, 8388608, array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']),
  ('settings-assets', 'settings-assets', false, 8388608, array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Quote photos live under: {quote_request_id}/{file}
drop policy if exists "quote photos scoped read" on storage.objects;
create policy "quote photos scoped read"
on storage.objects for select
to authenticated
using (
  bucket_id = 'quote-photos'
  and exists (
    select 1 from public.quote_requests qr
    where qr.id::text = (storage.foldername(name))[1]
      and (public.is_admin() or public.owns_customer(qr.customer_id))
  )
);

drop policy if exists "quote photos admin write" on storage.objects;
create policy "quote photos admin write"
on storage.objects for all
to authenticated
using (bucket_id = 'quote-photos' and public.is_admin())
with check (bucket_id = 'quote-photos' and public.is_admin());

-- Job photos live under: {job_id}/{label}/{file}
drop policy if exists "job photos scoped read" on storage.objects;
create policy "job photos scoped read"
on storage.objects for select
to authenticated
using (
  bucket_id = 'job-photos'
  and exists (
    select 1 from public.jobs j
    where j.id::text = (storage.foldername(name))[1]
      and public.can_access_job(j.id)
  )
);

drop policy if exists "job photos crew or admin insert" on storage.objects;
create policy "job photos crew or admin insert"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'job-photos'
  and exists (
    select 1 from public.jobs j
    where j.id::text = (storage.foldername(name))[1]
      and (public.is_admin() or public.current_profile_id() = any(j.assigned_crew_ids))
  )
);

drop policy if exists "job photos admin update delete" on storage.objects;
create policy "job photos admin update delete"
on storage.objects for update
to authenticated
using (bucket_id = 'job-photos' and public.is_admin())
with check (bucket_id = 'job-photos' and public.is_admin());

drop policy if exists "job photos admin delete" on storage.objects;
create policy "job photos admin delete"
on storage.objects for delete
to authenticated
using (bucket_id = 'job-photos' and public.is_admin());

-- Receipts live under: {expense_id}/{file}
drop policy if exists "receipts scoped read" on storage.objects;
create policy "receipts scoped read"
on storage.objects for select
to authenticated
using (
  bucket_id = 'receipts'
  and exists (
    select 1 from public.expenses e
    where e.id::text = (storage.foldername(name))[1]
      and (public.is_admin() or e.paid_by = public.current_profile_id() or (e.job_id is not null and public.can_access_job(e.job_id)))
  )
);

drop policy if exists "receipts owner insert" on storage.objects;
create policy "receipts owner insert"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'receipts'
  and exists (
    select 1 from public.expenses e
    where e.id::text = (storage.foldername(name))[1]
      and (public.is_admin() or e.paid_by = public.current_profile_id())
  )
);

-- Payment proofs live under: {payment_id}/{file}
drop policy if exists "payment proofs scoped read" on storage.objects;
create policy "payment proofs scoped read"
on storage.objects for select
to authenticated
using (
  bucket_id = 'payment-proofs'
  and exists (
    select 1 from public.payments p
    left join public.documents d on d.id = p.document_id
    where p.id::text = (storage.foldername(name))[1]
      and (public.is_admin() or (d.id is not null and public.owns_customer(d.customer_id)) or (p.job_id is not null and public.can_access_job(p.job_id)))
  )
);

drop policy if exists "payment proofs admin insert" on storage.objects;
create policy "payment proofs admin insert"
on storage.objects for insert
to authenticated
with check (bucket_id = 'payment-proofs' and public.is_admin());

-- Settings assets are admin managed for MVP.
drop policy if exists "settings assets admin all" on storage.objects;
create policy "settings assets admin all"
on storage.objects for all
to authenticated
using (bucket_id = 'settings-assets' and public.is_admin())
with check (bucket_id = 'settings-assets' and public.is_admin());


-- Starter data for JJL Lawn Services
insert into public.service_categories (name, description, sort_order) values
  ('Lawn mowing', 'Mowing, trimming, edging, and blowing clippings.', 10),
  ('Yard cleanup', 'Light cleanup, debris collection, and bagging.', 20),
  ('Bed cleanup', 'Flower bed cleanup and weed pulling.', 30),
  ('Mulch', 'Mulch spreading and refresh services.', 40),
  ('Seasonal cleanup', 'Leaves, sticks, and seasonal reset work.', 50),
  ('Case-by-case', 'Services that require parent/admin approval.', 60)
on conflict do nothing;

insert into public.services (category_id, name, service_type, pricing_type, min_price, max_price, base_price, unit_label, visible_to_customer, requires_parent_approval, requires_photos, requires_site_review, recurring_capable, sort_order, public_description)
select c.id, v.name, v.service_type, v.pricing_type, v.min_price, v.max_price, v.base_price, v.unit_label, v.visible_to_customer, v.requires_parent_approval, v.requires_photos, v.requires_site_review, v.recurring_capable, v.sort_order, v.public_description
from (values
  ('Lawn mowing', 'Basic Cut', 'core', 'range', 35::numeric, 110::numeric, null::numeric, null::text, true, false, true, false, true, 10, 'Mow, basic trim, and blow clippings.'),
  ('Lawn mowing', 'Clean Cut', 'core', 'range', 50::numeric, 140::numeric, null::numeric, null::text, true, false, true, false, true, 20, 'Mow, trim, edge if included, and blow clippings.'),
  ('Yard cleanup', 'Yard Reset', 'core', 'custom_estimate', 75::numeric, null::numeric, null::numeric, null::text, true, true, true, true, false, 30, 'Light yard cleanup priced by scope.'),
  ('Mulch', 'Mulch Refresh', 'core', 'per_cubic_yard', 75::numeric, 125::numeric, null::numeric, 'cubic yard', true, false, true, true, false, 40, 'Spread customer-approved mulch.'),
  ('Case-by-case', 'Flat Concrete Pressure Washing', 'case_by_case', 'custom_estimate', 75::numeric, null::numeric, null::numeric, null::text, false, true, true, true, false, 50, 'Limited flat-surface concrete pressure washing only.'),
  ('Lawn mowing', 'Edging', 'add_on', 'flat', null::numeric, null::numeric, 15::numeric, null::text, true, false, false, false, true, 100, 'Add edging where safe and accessible.'),
  ('Lawn mowing', 'Overgrown Grass Surcharge', 'add_on', 'custom_estimate', 20::numeric, null::numeric, null::numeric, null::text, true, true, true, false, false, 110, 'Added charge for unusually tall grass.'),
  ('Yard cleanup', 'Stick Pickup', 'add_on', 'custom_estimate', 15::numeric, null::numeric, null::numeric, null::text, true, false, true, false, false, 120, 'Ground-level stick and small branch pickup.'),
  ('Bed cleanup', 'Extra Weed Pulling', 'add_on', 'custom_estimate', 20::numeric, null::numeric, null::numeric, null::text, true, false, true, false, false, 130, 'Extra hand weeding by scope.'),
  ('Yard cleanup', 'Debris Bagging', 'add_on', 'per_unit', null::numeric, null::numeric, 5::numeric, 'bag', true, false, true, false, false, 140, 'Bagging light yard debris.'),
  ('Yard cleanup', 'Dog Waste Cleanup', 'add_on', 'custom_estimate', 25::numeric, null::numeric, null::numeric, null::text, true, true, true, true, false, 150, 'Separate service only; requires approval.'),
  ('Case-by-case', 'Tree trimming', 'excluded', 'custom_estimate', null::numeric, null::numeric, null::numeric, null::text, true, false, false, false, false, 200, 'Not offered.'),
  ('Case-by-case', 'Chainsaw work', 'excluded', 'custom_estimate', null::numeric, null::numeric, null::numeric, null::text, true, false, false, false, false, 210, 'Not offered.'),
  ('Case-by-case', 'Roof/gutter work', 'excluded', 'custom_estimate', null::numeric, null::numeric, null::numeric, null::text, true, false, false, false, false, 220, 'Not offered.'),
  ('Case-by-case', 'Chemical weed killer', 'excluded', 'custom_estimate', null::numeric, null::numeric, null::numeric, null::text, true, false, false, false, false, 230, 'Not offered.')
) as v(category_name, name, service_type, pricing_type, min_price, max_price, base_price, unit_label, visible_to_customer, requires_parent_approval, requires_photos, requires_site_review, recurring_capable, sort_order, public_description)
join public.service_categories c on c.name = v.category_name
on conflict do nothing;

insert into public.terms_versions (title, version, body, effective_date, active, required_for_quote_request, required_for_estimate_acceptance) values
('Default Customer Terms', '1.0', 'Payment is due upon completion. Customer must clear yard before service. Pets must be secured. Hidden objects are customer responsibility. Weather may delay service. Unsafe jobs may be declined. No chemical application, ladder, roof, tree, or chainsaw work. Before/after photos may be used for private job documentation. Customer information will not be publicly shared.', current_date, true, true, true)
on conflict do nothing;

insert into public.checklist_templates (name, active) values
  ('Default mowing checklist', true),
  ('Default cleanup checklist', true)
on conflict do nothing;

insert into public.checklist_items (checklist_template_id, label, required, sort_order)
select t.id, v.label, true, v.sort_order
from public.checklist_templates t
join (values
  ('Default mowing checklist', 'Yard checked for objects', 10),
  ('Default mowing checklist', 'Pets secured', 20),
  ('Default mowing checklist', 'Before photos taken', 30),
  ('Default mowing checklist', 'Mowed', 40),
  ('Default mowing checklist', 'Trimmed', 50),
  ('Default mowing checklist', 'Clippings blown', 60),
  ('Default mowing checklist', 'After photos taken', 70),
  ('Default cleanup checklist', 'Scope reviewed', 10),
  ('Default cleanup checklist', 'PPE used', 20),
  ('Default cleanup checklist', 'Unsafe items checked', 30),
  ('Default cleanup checklist', 'Before photos taken', 40),
  ('Default cleanup checklist', 'Debris collected', 50),
  ('Default cleanup checklist', 'Area swept', 60),
  ('Default cleanup checklist', 'After photos taken', 70)
) as v(template_name, label, sort_order) on t.name = v.template_name
on conflict do nothing;

insert into public.settings (key, value_json) values
  ('business', '{"businessName":"JJL Lawn Services","serviceAreaDescription":"Nearby neighborhoods only","businessStatus":"active"}'::jsonb),
  ('payment_public', '{"acceptCash":true,"acceptVenmo":true,"venmoHandle":"","cashInstructions":"Cash due upon completion."}'::jsonb),
  ('document', '{"estimatePrefix":"EST-","invoicePrefix":"JLC-","startingNumber":1,"defaultEstimateExpirationDays":14,"defaultInvoiceDueDays":0}'::jsonb),
  ('tax_reserve', '{"salesTaxEnabled":false,"salesTaxRate":0,"salesTaxLabel":"Sales tax","equipmentReservePercent":10,"taxSavingsReservePercent":15,"defaultSplitMethod":"equal"}'::jsonb),
  ('parent_approval', '{"jobDollarThreshold":225,"requireHighRiskApproval":true}'::jsonb),
  ('public_site', '{"headline":"Simple lawn mowing and light yard cleanup from a local student crew."}'::jsonb)
on conflict (key) do update set value_json = excluded.value_json;
