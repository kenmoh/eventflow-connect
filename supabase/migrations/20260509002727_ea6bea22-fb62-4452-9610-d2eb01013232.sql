
create or replace function public.bootstrap_owner()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  owner_role_id uuid;
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;
  if exists (select 1 from public.user_roles where role = 'owner') then
    raise exception 'owner already exists';
  end if;
  insert into public.user_roles (user_id, role) values (uid, 'owner') on conflict do nothing;
  select id into owner_role_id from public.roles where name = 'Owner' limit 1;
  if owner_role_id is not null then
    update public.profiles set role_id = owner_role_id where id = uid;
  end if;
end $$;

revoke execute on function public.bootstrap_owner() from public;
grant execute on function public.bootstrap_owner() to authenticated;

-- Convenience: detect if any owner exists (lets login UI show "create owner" first time)
create or replace function public.owner_exists()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.user_roles where role = 'owner')
$$;

revoke execute on function public.owner_exists() from public;
grant execute on function public.owner_exists() to anon, authenticated;
