create table users (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text,
  avatar_url text,
  role text not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  icon text,
  description text,
  is_active boolean default true,
  sort_order integer default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table professionals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  category_id uuid references categories(id),
  display_name text not null,
  bio text,
  city text,
  rating_average numeric default 0,
  review_count integer default 0,
  is_verified boolean default false,
  is_active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table requests (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references users(id),
  professional_id uuid references professionals(id),
  category_id uuid references categories(id),
  title text not null,
  description text,
  status text not null default 'pending',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
