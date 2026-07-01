-- Canonical base schema for fresh Supabase projects.
-- Safe to run on existing projects (uses IF NOT EXISTS / ADD COLUMN IF NOT EXISTS).

create extension if not exists "pgcrypto";

create table if not exists public.users (
  id uuid primary key,
  full_name text not null default 'משתמש',
  email text,
  phone text,
  avatar_url text,
  user_type text not null default 'customer',
  city text default 'תל אביב',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.service_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  name_he text,
  icon text,
  sort_order int default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.professionals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  category_id uuid references public.service_categories(id) on delete set null,
  title text not null,
  description text,
  rating numeric(3, 2) default 0,
  reviews_count int default 0,
  hourly_price numeric(10, 2) default 0,
  city text,
  available boolean default true,
  profile_image text,
  subscription_tier text not null default 'free',
  lead_credits int not null default 3,
  subscription_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.requests (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.users(id) on delete set null,
  professional_id uuid references public.professionals(id) on delete set null,
  category_id uuid references public.service_categories(id) on delete set null,
  title text not null,
  description text,
  address text,
  city text,
  status text not null default 'pending',
  quoted_amount numeric(12, 2),
  platform_fee_agorot int default 0,
  paid_at timestamptz,
  destination_lat numeric(10, 7),
  destination_lng numeric(10, 7),
  pro_lat numeric(10, 7),
  pro_lng numeric(10, 7),
  pro_location_updated_at timestamptz,
  live_tracking_active boolean not null default false,
  cancellation_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.request_images (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests(id) on delete cascade,
  image_url text not null,
  created_at timestamptz not null default now()
);

-- Seed default categories when empty
insert into public.service_categories (name, slug, name_he)
select * from (values
  ('Plumber', 'plumbing', 'אינסטלטור'),
  ('Electrician', 'electricity', 'חשמלאי'),
  ('Air Conditioning', 'ac', 'מיזוג אוויר'),
  ('Cleaning', 'cleaning', 'ניקיון'),
  ('Painting', 'painting', 'צבעי'),
  ('Carpentry', 'carpentry', 'נגרות'),
  ('Locksmith', 'locksmith', 'מנעולן'),
  ('Gardening', 'gardening', 'גינון'),
  ('Moving', 'moving', 'הובלות'),
  ('Tiling', 'tiling', 'ריצוף')
) as v(name, slug, name_he)
where not exists (select 1 from public.service_categories limit 1);
