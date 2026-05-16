-- Contacts table for the "Contact Us" form on the FAQs page
create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  subject text not null,
  message text not null,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table contacts enable row level security;

-- Anyone can insert (public form)
create policy "public can insert contacts"
  on contacts for insert
  with check (true);

-- Only authenticated users (owner/admin) can view
create policy "authenticated can view contacts"
  on contacts for select
  using (auth.role() = 'authenticated');

-- Only owner/admin can delete
create policy "owner can delete contacts"
  on contacts for delete
  using (
    exists (
      select 1 from user_roles
      where user_roles.user_id = auth.uid()
      and user_roles.role = 'owner'
    )
  );

-- Index for sorting
create index if not exists idx_contacts_created_at on contacts(created_at desc);
