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
