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
