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
