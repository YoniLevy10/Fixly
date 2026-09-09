-- Prospect discovery quality upgrade: fit classification, contactability,
-- multi-category, cumulative discovery history, query yield stats.
-- Apply on Fixly Supabase before relying on new Superadmin fields.
-- See docs/PRO_OUTREACH.md

-- ---------------------------------------------------------------------------
-- professional_prospects: fit + contactability + geo + enrichment
-- ---------------------------------------------------------------------------
alter table public.professional_prospects
  add column if not exists fit_class text
    check (fit_class is null or fit_class in (
      'suitable',
      'needs_review',
      'unsuitable',
      'unknown'
    )),
  add column if not exists fit_confidence integer
    check (fit_confidence is null or (fit_confidence >= 0 and fit_confidence <= 100)),
  add column if not exists fit_reasons jsonb not null default '[]'::jsonb,
  add column if not exists contactability text
    check (contactability is null or contactability in (
      'mobile',
      'landline',
      'unknown',
      'none'
    )),
  add column if not exists business_address text,
  add column if not exists search_city text,
  add column if not exists service_areas text[] not null default '{}',
  add column if not exists services text[] not null default '{}',
  add column if not exists enrichment jsonb,
  add column if not exists last_seen_at timestamptz;

create index if not exists idx_prospects_fit_class
  on public.professional_prospects (fit_class);

create index if not exists idx_prospects_contactability
  on public.professional_prospects (contactability);

create index if not exists idx_prospects_last_seen_at
  on public.professional_prospects (last_seen_at desc nulls last);

-- ---------------------------------------------------------------------------
-- Multi-category junction
-- ---------------------------------------------------------------------------
create table if not exists public.professional_prospect_categories (
  prospect_id uuid not null references public.professional_prospects(id) on delete cascade,
  category_id uuid not null references public.service_categories(id) on delete cascade,
  source text not null default 'discovery',
  created_at timestamptz not null default now(),
  primary key (prospect_id, category_id)
);

create index if not exists idx_prospect_categories_category
  on public.professional_prospect_categories (category_id);

alter table public.professional_prospect_categories enable row level security;

drop policy if exists prospect_categories_admin_all
  on public.professional_prospect_categories;
create policy prospect_categories_admin_all
  on public.professional_prospect_categories
  for all
  using (public.is_fixly_admin())
  with check (public.is_fixly_admin());

-- ---------------------------------------------------------------------------
-- Per-run sightings (kept / rejected with reason)
-- ---------------------------------------------------------------------------
create table if not exists public.prospect_discovery_sightings (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references public.prospect_discovery_runs(id) on delete set null,
  prospect_id uuid references public.professional_prospects(id) on delete set null,
  source_name text not null,
  external_id text,
  query_key text,
  outcome text not null
    check (outcome in ('kept', 'rejected', 'updated', 'duplicate')),
  reason text,
  fit_class text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_prospect_sightings_run
  on public.prospect_discovery_sightings (run_id, created_at desc);

create index if not exists idx_prospect_sightings_external
  on public.prospect_discovery_sightings (source_name, external_id);

alter table public.prospect_discovery_sightings enable row level security;

drop policy if exists prospect_sightings_admin_all
  on public.prospect_discovery_sightings;
create policy prospect_sightings_admin_all
  on public.prospect_discovery_sightings
  for all
  using (public.is_fixly_admin())
  with check (public.is_fixly_admin());

-- ---------------------------------------------------------------------------
-- Query yield stats for rotation across runs
-- ---------------------------------------------------------------------------
create table if not exists public.prospect_query_stats (
  query_key text not null,
  city text not null default 'ירושלים',
  source_name text not null default 'google_places',
  raw_count integer not null default 0,
  unique_new_count integer not null default 0,
  suitable_count integer not null default 0,
  needs_review_count integer not null default 0,
  unsuitable_count integer not null default 0,
  api_calls integer not null default 0,
  yield_score numeric not null default 0,
  last_run_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (query_key, city, source_name)
);

alter table public.prospect_query_stats enable row level security;

drop policy if exists prospect_query_stats_admin_all
  on public.prospect_query_stats;
create policy prospect_query_stats_admin_all
  on public.prospect_query_stats
  for all
  using (public.is_fixly_admin())
  with check (public.is_fixly_admin());
