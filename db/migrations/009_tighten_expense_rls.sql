-- Expenses are internal/admin/crew records and should not be readable by customers.
drop policy if exists "expenses crew own read" on public.expenses;

create policy "expenses crew own read" on public.expenses for select using (
  paid_by = public.current_profile_id()
  or (
    job_id is not null
    and exists (
      select 1 from public.jobs j
      where j.id = job_id
        and public.current_profile_id() = any(j.assigned_crew_ids)
    )
  )
);
