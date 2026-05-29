-- 1) Categories Hebrew + slugs on service_categories
alter table public.service_categories
  add column if not exists slug text,
  add column if not exists name_he text;

update public.service_categories set slug = 'electricity', name_he = 'חשמלאי' where name = 'Electrician';
update public.service_categories set slug = 'plumbing', name_he = 'אינסטלטור' where name = 'Plumber';
update public.service_categories set slug = 'ac', name_he = 'מיזוג אוויר' where name = 'Air Conditioning';
update public.service_categories set slug = 'cleaning', name_he = 'ניקיון' where name = 'Cleaning';
update public.service_categories set slug = 'painting', name_he = 'צבעי' where name = 'Painting';

-- 2) Reviews table
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  request_id uuid references public.requests(id) on delete cascade,
  professional_id uuid references public.professionals(id) on delete cascade,
  customer_id uuid references public.users(id) on delete set null,
  rating smallint not null check (rating >= 1 and rating <= 5),
  text text,
  created_at timestamptz default now()
);

alter table public.reviews enable row level security;

-- 3) Link demo pro to auth user_id column usage (nullable already)
alter table public.professionals
  add column if not exists user_id uuid references public.users(id) on delete set null;

-- 4) Storage bucket for request images
insert into storage.buckets (id, name, public)
values ('request-images', 'request-images', true)
on conflict (id) do update set public = true;

-- Drop MVP-open policies
drop policy if exists "Public requests insert" on public.requests;
drop policy if exists "Public requests select" on public.requests;
drop policy if exists "Public requests update" on public.requests;
drop policy if exists "Public request images select" on public.request_images;
drop policy if exists "Public request images insert" on public.request_images;
drop policy if exists "Public categories select" on public.categories;
drop policy if exists "Public categories view" on public.service_categories;
drop policy if exists "Public professionals view" on public.professionals;

-- Public read: browse marketplace
create policy "service_categories_public_read"
  on public.service_categories for select using (true);

create policy "professionals_public_read"
  on public.professionals for select using (true);

create policy "reviews_public_read"
  on public.reviews for select using (true);

-- Requests: participants only (customer or assigned professional owner)
create policy "requests_select_participants"
  on public.requests for select
  using (
    customer_id = auth.uid()
    or professional_id in (
      select p.id from public.professionals p where p.user_id = auth.uid()
    )
  );

create policy "requests_insert_customer"
  on public.requests for insert
  with check (customer_id = auth.uid());

create policy "requests_update_participants"
  on public.requests for update
  using (
    customer_id = auth.uid()
    or professional_id in (
      select p.id from public.professionals p where p.user_id = auth.uid()
    )
  )
  with check (
    customer_id = auth.uid()
    or professional_id in (
      select p.id from public.professionals p where p.user_id = auth.uid()
    )
  );

-- Request images: tied to request participant
create policy "request_images_select_participants"
  on public.request_images for select
  using (
    request_id in (
      select r.id from public.requests r
      where r.customer_id = auth.uid()
         or r.professional_id in (
           select p.id from public.professionals p where p.user_id = auth.uid()
         )
    )
  );

create policy "request_images_insert_customer"
  on public.request_images for insert
  with check (
    request_id in (
      select r.id from public.requests r where r.customer_id = auth.uid()
    )
  );

-- Reviews: read all; insert only customer who completed request
create policy "reviews_insert_customer"
  on public.reviews for insert
  with check (
    customer_id = auth.uid()
    and exists (
      select 1 from public.requests r
      where r.id = request_id
        and r.customer_id = auth.uid()
        and r.status = 'completed'
    )
  );

-- Users: read/update own row
alter table public.users enable row level security;

drop policy if exists "users_select_own" on public.users;
create policy "users_select_own"
  on public.users for select using (id = auth.uid());

drop policy if exists "users_insert_own" on public.users;
create policy "users_insert_own"
  on public.users for insert with check (id = auth.uid());

drop policy if exists "users_update_own" on public.users;
create policy "users_update_own"
  on public.users for update using (id = auth.uid());

-- Storage policies
drop policy if exists "request_images_storage_read" on storage.objects;
create policy "request_images_storage_read"
  on storage.objects for select
  using (bucket_id = 'request-images');

drop policy if exists "request_images_storage_insert" on storage.objects;
create policy "request_images_storage_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'request-images'
    and auth.role() = 'authenticated'
  );

-- Sync auth.users -> public.users
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, full_name, email, user_type, city)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1), 'משתמש'),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'customer'),
    coalesce(new.raw_user_meta_data->>'location', 'תל אביב')
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, public.users.full_name);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- Enable realtime for requests (idempotent)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'requests'
  ) then
    alter publication supabase_realtime add table public.requests;
  end if;
end $$;
