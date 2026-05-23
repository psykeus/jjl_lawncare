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
