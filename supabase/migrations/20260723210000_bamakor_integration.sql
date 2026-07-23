-- Phase 1: Bamakor integration + marketplace category gaps
-- Maps brief "jobs" → existing public.requests / request_candidates

-- ---------------------------------------------------------------------------
-- Categories: ensure columns exist on older DBs, then seed missing trades
-- ---------------------------------------------------------------------------
alter table public.service_categories
  add column if not exists slug text,
  add column if not exists name_he text,
  add column if not exists sort_order int default 0;

create unique index if not exists service_categories_slug_key
  on public.service_categories (slug)
  where slug is not null;

insert into public.service_categories (name, slug, name_he)
select v.name, v.slug, v.name_he
from (values
  ('Elevators', 'elevators', 'מעליות'),
  ('Pest Control', 'pest_control', 'הדברה'),
  ('General', 'general', 'כללי / אחר')
) as v(name, slug, name_he)
where not exists (
  select 1 from public.service_categories c where c.slug = v.slug
);

update public.service_categories set sort_order = 10 where slug = 'elevators' and (sort_order is null or sort_order = 0);
update public.service_categories set sort_order = 20 where slug = 'pest_control' and (sort_order is null or sort_order = 0);
update public.service_categories set sort_order = 90 where slug = 'general' and (sort_order is null or sort_order = 0);

-- Align Hebrew labels for brief minimum set (idempotent)
update public.service_categories set name_he = 'ניקיון' where slug = 'cleaning';
update public.service_categories set name_he = 'חשמל' where slug = 'electricity';
update public.service_categories set name_he = 'אינסטלציה' where slug = 'plumbing';
update public.service_categories set name_he = 'מיזוג' where slug = 'ac';
update public.service_categories set name_he = 'גינון' where slug = 'gardening';
update public.service_categories set name_he = 'מנעולים' where slug = 'locksmith';

-- ---------------------------------------------------------------------------
-- Requests: external source + callback + assignment mode
-- ---------------------------------------------------------------------------
alter table public.requests
  add column if not exists source text not null default 'fixly'
    check (source in ('fixly', 'bamakor', 'api', 'demo')),
  add column if not exists external_system text,
  add column if not exists external_ticket_id text,
  add column if not exists external_ticket_number int,
  add column if not exists external_client_id text,
  add column if not exists external_client_name text,
  add column if not exists building_name text,
  add column if not exists reporter_phone text,
  add column if not exists manager_phone text,
  add column if not exists manager_notes text,
  add column if not exists callback_url text,
  add column if not exists assignment_mode text not null default 'broadcast_first_accept'
    check (assignment_mode in ('broadcast_first_accept', 'manual_select')),
  add column if not exists priority text not null default 'medium'
    check (priority in ('low', 'medium', 'high', 'urgent')),
  add column if not exists media_urls jsonb not null default '[]'::jsonb,
  add column if not exists matched_providers_count int not null default 0;

create unique index if not exists idx_requests_external_ticket
  on public.requests (external_system, external_ticket_id)
  where external_system is not null and external_ticket_id is not null;

create index if not exists idx_requests_source_status
  on public.requests (source, status, created_at desc);

create index if not exists idx_requests_city_category
  on public.requests (city, category_id)
  where status in ('pending', 'accepted', 'on_the_way', 'in_progress');

-- ---------------------------------------------------------------------------
-- Job / request status events (timeline + webhook audit)
-- ---------------------------------------------------------------------------
create table if not exists public.request_events (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests(id) on delete cascade,
  status text not null,
  event_type text not null default 'status_changed',
  payload_json jsonb not null default '{}'::jsonb,
  webhook_delivered boolean,
  webhook_http_status int,
  webhook_error text,
  created_at timestamptz not null default now()
);

create index if not exists idx_request_events_request_created
  on public.request_events (request_id, created_at);

alter table public.request_events enable row level security;

drop policy if exists "request_events_customer_read" on public.request_events;
create policy "request_events_customer_read"
  on public.request_events for select
  using (
    request_id in (select r.id from public.requests r where r.customer_id = auth.uid())
  );

drop policy if exists "request_events_pro_read" on public.request_events;
create policy "request_events_pro_read"
  on public.request_events for select
  using (
    request_id in (
      select r.id from public.requests r
      where r.professional_id in (
        select p.id from public.professionals p where p.user_id = auth.uid()
      )
    )
  );

-- Service role / admin inserts bypass RLS (API uses service role)
