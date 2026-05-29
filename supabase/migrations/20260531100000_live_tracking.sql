-- Live tracking (Wolt-style): pro GPS while en route

alter table public.requests
  add column if not exists destination_lat numeric(10, 7),
  add column if not exists destination_lng numeric(10, 7),
  add column if not exists pro_lat numeric(10, 7),
  add column if not exists pro_lng numeric(10, 7),
  add column if not exists pro_location_updated_at timestamptz,
  add column if not exists live_tracking_active boolean not null default false;

create index if not exists idx_requests_live_tracking
  on public.requests (id)
  where live_tracking_active = true;
