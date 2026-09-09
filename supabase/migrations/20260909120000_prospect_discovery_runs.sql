-- Discovery run logs for legal prospect ingestion (Google Places + OSM).
-- Safe to apply after 20260909010000_professional_prospects.sql

create table if not exists public.prospect_discovery_runs (
  id uuid primary key default gen_random_uuid(),
  trigger text not null default 'cron'
    check (trigger in ('cron', 'manual')),
  sources text[] not null default '{}',
  city text not null default 'ירושלים',
  status text not null default 'running'
    check (status in ('running', 'completed', 'failed')),
  found_count int not null default 0,
  created_count int not null default 0,
  skipped_count int not null default 0,
  error_count int not null default 0,
  error_message text,
  details jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  actor_user_id uuid
);

create index if not exists idx_prospect_discovery_runs_started
  on public.prospect_discovery_runs (started_at desc);

alter table public.prospect_discovery_runs enable row level security;

drop policy if exists "discovery_runs_admin_select" on public.prospect_discovery_runs;
create policy "discovery_runs_admin_select"
  on public.prospect_discovery_runs for select
  to authenticated
  using (public.is_fixly_admin());

-- inserts/updates via service-role only (cron / admin API)
