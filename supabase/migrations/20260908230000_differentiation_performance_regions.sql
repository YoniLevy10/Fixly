-- Fixly differentiation: objective performance, density gate, Bamakor escalation
-- See docs/DIFFERENTIATION.md

-- ---------------------------------------------------------------------------
-- Professional objective performance aggregates
-- ---------------------------------------------------------------------------
alter table public.professionals
  add column if not exists jobs_completed int not null default 0,
  add column if not exists jobs_offered int not null default 0,
  add column if not exists jobs_accepted int not null default 0,
  add column if not exists accept_rate numeric(5, 4),
  add column if not exists avg_arrival_minutes numeric(8, 2),
  add column if not exists arrival_sample_count int not null default 0,
  add column if not exists price_accuracy_score numeric(5, 2),
  add column if not exists reopen_rate numeric(5, 4),
  add column if not exists close_quality_score numeric(5, 2),
  add column if not exists performance_score numeric(5, 2) not null default 50;

create index if not exists idx_professionals_performance_score
  on public.professionals (performance_score desc nulls last);

-- Request lifecycle timestamps for arrival / completion metrics
alter table public.requests
  add column if not exists on_the_way_at timestamptz,
  add column if not exists completed_at timestamptz,
  add column if not exists escalation_source text
    check (
      escalation_source is null
      or escalation_source in (
        'internal_maintenance',
        'manager',
        'sla_timeout',
        'other'
      )
    ),
  add column if not exists escalation_reason text,
  add column if not exists escalated_at timestamptz;

create index if not exists idx_requests_city_status_completed
  on public.requests (city, status, completed_at desc);

-- ---------------------------------------------------------------------------
-- Density-gated consumer open (private consumers only; partners always open)
-- ---------------------------------------------------------------------------
create table if not exists public.launch_regions (
  id uuid primary key default gen_random_uuid(),
  city text not null,
  category_id uuid references public.service_categories(id) on delete cascade,
  status text not null default 'waitlist'
    check (status in ('closed', 'waitlist', 'open')),
  min_pros int not null default 20,
  min_completed_jobs_30d int not null default 30,
  notes text,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (city, category_id)
);

-- City-wide rows use NULL category_id — unique index treats nulls as distinct in PG,
-- so enforce one city-wide row via partial unique index.
create unique index if not exists idx_launch_regions_city_wide
  on public.launch_regions (lower(city))
  where category_id is null;

create index if not exists idx_launch_regions_status
  on public.launch_regions (status);

alter table public.launch_regions enable row level security;

drop policy if exists "launch_regions_public_read" on public.launch_regions;
create policy "launch_regions_public_read"
  on public.launch_regions for select using (true);

insert into public.launch_regions (city, category_id, status, notes)
select 'תל אביב', null, 'waitlist', 'Pilot city — open after density thresholds'
where not exists (
  select 1 from public.launch_regions
  where category_id is null and lower(city) = lower('תל אביב')
);

-- ---------------------------------------------------------------------------
-- Rolling response time (existing) stays; performance refresh is app-side
-- ---------------------------------------------------------------------------
