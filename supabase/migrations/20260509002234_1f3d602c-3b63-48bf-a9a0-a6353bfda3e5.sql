
-- =========================================================
-- ENUMS
-- =========================================================
create type public.app_role as enum ('owner', 'admin', 'staff');
create type public.package_kind as enum ('coffee', 'food');
create type public.rental_ownership as enum ('internal', 'vendor');
create type public.booking_type as enum ('reservation', 'rental');
create type public.booking_status as enum ('pending', 'confirmed', 'processing', 'completed', 'cancelled');
create type public.payment_status as enum ('unpaid', 'deposit', 'paid', 'refunded');
create type public.movement_type as enum ('out', 'in', 'damaged', 'restock');

-- =========================================================
-- TIMESTAMP TRIGGER
-- =========================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql
set search_path = public as $$
begin new.updated_at = now(); return new; end $$;

-- =========================================================
-- PROFILES + ROLES (auth)
-- =========================================================
create table public.roles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  tabs text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  role_id uuid references public.roles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_role not null,
  unique(user_id, role)
);

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.is_staff(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id)
$$;

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)), new.email)
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =========================================================
-- BRANDING + SITE CONTENT (single row)
-- =========================================================
create table public.branding (
  id uuid primary key default gen_random_uuid(),
  brand_name text not null,
  tagline text not null,
  primary_accent text not null,
  updated_at timestamptz not null default now()
);

create table public.site_content (
  id uuid primary key default gen_random_uuid(),
  data jsonb not null,
  updated_at timestamptz not null default now()
);

-- =========================================================
-- CATALOG
-- =========================================================
create table public.hotels (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location text not null,
  tagline text not null default '',
  image text not null default '',
  rating numeric(2,1) not null default 5.0,
  amenities text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references public.hotels(id) on delete cascade,
  type text not null,
  description text not null default '',
  price numeric not null default 0,
  capacity int not null default 1,
  image text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.halls (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references public.hotels(id) on delete cascade,
  name text not null,
  capacity int not null default 1,
  price_per_hour numeric not null default 0,
  image text not null default '',
  amenities text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.packages (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references public.hotels(id) on delete cascade,
  kind package_kind not null default 'coffee',
  name text not null,
  description text not null default '',
  items text[] not null default '{}',
  price_per_person numeric not null default 0,
  time_slots jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.seat_arrangements (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  image text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.rentals (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  price_per_day numeric not null default 0,
  ownership rental_ownership not null default 'internal',
  deposit_pct int not null default 100,
  image text not null default '',
  description text not null default '',
  available boolean not null default true,
  stock_total int not null default 0,
  stock_available int not null default 0,
  location text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.rentals(id) on delete cascade,
  type movement_type not null,
  qty int not null,
  note text not null default '',
  reference text,
  location text,
  handled_by text,
  at timestamptz not null default now()
);

create table public.faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  "order" int not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================================================
-- BOOKINGS
-- =========================================================
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  type booking_type not null,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  lines jsonb not null default '[]'::jsonb,
  details jsonb not null default '{}'::jsonb,
  total numeric not null default 0,
  amount_paid numeric not null default 0,
  balance_due numeric not null default 0,
  payment_status payment_status not null default 'unpaid',
  fulfillment booking_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index bookings_email_idx on public.bookings (lower(customer_email));
create index bookings_reference_idx on public.bookings (reference);

-- Public lookup function (no-login tracking)
create or replace function public.lookup_bookings(_query text)
returns setof public.bookings
language sql stable security definer set search_path = public as $$
  select * from public.bookings
  where reference = upper(trim(_query))
     or lower(customer_email) = lower(trim(_query))
  order by created_at desc
$$;

-- Customer autofill (returns latest customer details for an email)
create or replace function public.lookup_customer(_email text)
returns table (name text, email text, phone text)
language sql stable security definer set search_path = public as $$
  select customer_name, customer_email, customer_phone
  from public.bookings
  where lower(customer_email) = lower(trim(_email))
  order by created_at desc
  limit 1
$$;

-- =========================================================
-- updated_at triggers
-- =========================================================
do $$ declare t text;
begin
  for t in select unnest(array[
    'profiles','roles','branding','hotels','rooms','halls','packages',
    'seat_arrangements','rentals','faqs','bookings'
  ]) loop
    execute format('create trigger %I_updated before update on public.%I for each row execute function public.set_updated_at()', t||'_updated', t);
  end loop;
end $$;

-- =========================================================
-- RLS
-- =========================================================
alter table public.roles enable row level security;
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.branding enable row level security;
alter table public.site_content enable row level security;
alter table public.hotels enable row level security;
alter table public.rooms enable row level security;
alter table public.halls enable row level security;
alter table public.packages enable row level security;
alter table public.seat_arrangements enable row level security;
alter table public.rentals enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.faqs enable row level security;
alter table public.bookings enable row level security;

-- Public read for catalog tables
create policy "public read branding" on public.branding for select using (true);
create policy "public read site_content" on public.site_content for select using (true);
create policy "public read hotels" on public.hotels for select using (true);
create policy "public read rooms" on public.rooms for select using (true);
create policy "public read halls" on public.halls for select using (true);
create policy "public read packages" on public.packages for select using (true);
create policy "public read arrangements" on public.seat_arrangements for select using (true);
create policy "public read rentals" on public.rentals for select using (true);
create policy "public read faqs" on public.faqs for select using (true);

-- Staff (any signed-in admin) writes
create policy "staff write branding" on public.branding for all to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
create policy "staff write site_content" on public.site_content for all to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
create policy "staff write hotels" on public.hotels for all to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
create policy "staff write rooms" on public.rooms for all to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
create policy "staff write halls" on public.halls for all to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
create policy "staff write packages" on public.packages for all to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
create policy "staff write arrangements" on public.seat_arrangements for all to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
create policy "staff write rentals" on public.rentals for all to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
create policy "staff write faqs" on public.faqs for all to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

-- Inventory: staff only
create policy "staff read inventory" on public.inventory_movements for select to authenticated using (public.is_staff(auth.uid()));
create policy "staff write inventory" on public.inventory_movements for all to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

-- Bookings: anyone may insert (no-login checkout); only staff can list/update
create policy "anyone create booking" on public.bookings for insert to anon, authenticated with check (true);
create policy "staff read bookings" on public.bookings for select to authenticated using (public.is_staff(auth.uid()));
create policy "staff update bookings" on public.bookings for update to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
create policy "staff delete bookings" on public.bookings for delete to authenticated using (public.is_staff(auth.uid()));

-- Roles & profiles
create policy "staff read roles" on public.roles for select to authenticated using (public.is_staff(auth.uid()));
create policy "staff write roles" on public.roles for all to authenticated using (public.has_role(auth.uid(), 'owner') or public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'owner') or public.has_role(auth.uid(), 'admin'));

create policy "staff read profiles" on public.profiles for select to authenticated using (public.is_staff(auth.uid()) or auth.uid() = id);
create policy "self update profile" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create policy "admin write profiles" on public.profiles for all to authenticated using (public.has_role(auth.uid(), 'owner') or public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'owner') or public.has_role(auth.uid(), 'admin'));

create policy "staff read user_roles" on public.user_roles for select to authenticated using (public.is_staff(auth.uid()) or user_id = auth.uid());
create policy "admin write user_roles" on public.user_roles for all to authenticated using (public.has_role(auth.uid(), 'owner') or public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'owner') or public.has_role(auth.uid(), 'admin'));

-- =========================================================
-- STORAGE: public media bucket
-- =========================================================
insert into storage.buckets (id, name, public) values ('media', 'media', true)
on conflict (id) do nothing;

create policy "public read media" on storage.objects for select using (bucket_id = 'media');
create policy "staff upload media" on storage.objects for insert to authenticated with check (bucket_id = 'media' and public.is_staff(auth.uid()));
create policy "staff update media" on storage.objects for update to authenticated using (bucket_id = 'media' and public.is_staff(auth.uid()));
create policy "staff delete media" on storage.objects for delete to authenticated using (bucket_id = 'media' and public.is_staff(auth.uid()));
