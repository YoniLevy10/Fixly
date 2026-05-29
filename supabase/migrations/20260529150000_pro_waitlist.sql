create table if not exists public.pro_waitlist (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null,
  email text,
  category text,
  city text,
  referral_code text,
  created_at timestamptz not null default now()
);

alter table public.pro_waitlist enable row level security;

create policy "pro_waitlist_insert_public"
  on public.pro_waitlist for insert
  with check (true);

create policy "pro_waitlist_select_service"
  on public.pro_waitlist for select
  using (false);
