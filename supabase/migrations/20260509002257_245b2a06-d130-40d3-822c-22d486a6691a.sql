
-- Restrict execute on internal helpers
revoke execute on function public.set_updated_at() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.has_role(uuid, app_role) from public, anon;
revoke execute on function public.is_staff(uuid) from public, anon;

-- Public lookup functions: require a non-empty query, only callable by anon/authenticated explicitly
revoke execute on function public.lookup_bookings(text) from public;
revoke execute on function public.lookup_customer(text) from public;
grant execute on function public.lookup_bookings(text) to anon, authenticated;
grant execute on function public.lookup_customer(text) to anon, authenticated;

create or replace function public.lookup_bookings(_query text)
returns setof public.bookings
language sql stable security definer set search_path = public as $$
  select * from public.bookings
  where length(coalesce(trim(_query), '')) >= 3
    and (reference = upper(trim(_query)) or lower(customer_email) = lower(trim(_query)))
  order by created_at desc
$$;

create or replace function public.lookup_customer(_email text)
returns table (name text, email text, phone text)
language sql stable security definer set search_path = public as $$
  select customer_name, customer_email, customer_phone
  from public.bookings
  where length(coalesce(trim(_email), '')) >= 5
    and lower(customer_email) = lower(trim(_email))
  order by created_at desc
  limit 1
$$;

-- Replace the open booking insert with a sanity-checked version
drop policy if exists "anyone create booking" on public.bookings;
create policy "anyone create booking" on public.bookings
  for insert to anon, authenticated
  with check (
    length(trim(reference)) >= 5
    and length(trim(customer_name)) >= 2
    and customer_email ~* '^.+@.+\..+$'
    and length(trim(customer_phone)) >= 6
    and total >= 0
  );

-- Storage: stop bucket-wide listing. Files remain accessible via direct public URLs.
drop policy if exists "public read media" on storage.objects;
