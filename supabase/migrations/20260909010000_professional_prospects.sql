-- Professional recruitment prospects (leads) — separate from professionals.
-- Do NOT apply to Production without explicit approval.
-- See docs/PRO_OUTREACH.md

-- ---------------------------------------------------------------------------
-- professional_prospects
-- ---------------------------------------------------------------------------
create table if not exists public.professional_prospects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  business_name text,
  phone text,
  whatsapp_phone text,
  phone_normalized text,
  city text not null default 'ירושלים',
  category_id uuid references public.service_categories(id) on delete set null,
  source_name text not null default 'manual',
  source_url text,
  external_id text,
  status text not null default 'discovered'
    check (status in (
      'discovered',
      'verified',
      'approved',
      'contacted',
      'interested',
      'joined',
      'active',
      'rejected',
      'do_not_contact'
    )),
  verification_status text not null default 'unverified'
    check (verification_status in (
      'unverified',
      'pending',
      'verified',
      'failed'
    )),
  last_verified_at timestamptz,
  contacted_at timestamptz,
  consent_at timestamptz,
  notes text,
  waitlist_id uuid references public.pro_waitlist(id) on delete set null,
  professional_id uuid references public.professionals(id) on delete set null,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_prospects_phone_normalized_unique
  on public.professional_prospects (phone_normalized)
  where phone_normalized is not null;

create unique index if not exists idx_prospects_source_external_unique
  on public.professional_prospects (source_name, external_id)
  where external_id is not null;

create index if not exists idx_prospects_city_category_business
  on public.professional_prospects (city, category_id, business_name);

create index if not exists idx_prospects_status
  on public.professional_prospects (status);

create index if not exists idx_prospects_source_name
  on public.professional_prospects (source_name);

create index if not exists idx_prospects_created_at
  on public.professional_prospects (created_at desc);

-- ---------------------------------------------------------------------------
-- professional_prospect_events (audit)
-- ---------------------------------------------------------------------------
create table if not exists public.professional_prospect_events (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null references public.professional_prospects(id) on delete cascade,
  actor_user_id uuid,
  action text not null,
  from_status text,
  to_status text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_prospect_events_prospect_created
  on public.professional_prospect_events (prospect_id, created_at desc);

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------
create or replace function public.set_professional_prospects_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_professional_prospects_updated_at
  on public.professional_prospects;
create trigger trg_professional_prospects_updated_at
  before update on public.professional_prospects
  for each row
  execute function public.set_professional_prospects_updated_at();

-- ---------------------------------------------------------------------------
-- RLS — no public access; admins via app_metadata; API uses service-role
-- ---------------------------------------------------------------------------
alter table public.professional_prospects enable row level security;
alter table public.professional_prospect_events enable row level security;

create or replace function public.is_fixly_admin()
returns boolean
language sql
stable
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
    false
  )
  or (
    auth.jwt() ->> 'email' is not null
    and lower(auth.jwt() ->> 'email') = any (
      select trim(both from lower(unnest(
        string_to_array(coalesce(current_setting('app.admin_emails', true), ''), ',')
      )))
    )
  );
$$;

drop policy if exists "prospects_admin_select" on public.professional_prospects;
create policy "prospects_admin_select"
  on public.professional_prospects for select
  to authenticated
  using (public.is_fixly_admin());

drop policy if exists "prospects_admin_insert" on public.professional_prospects;
create policy "prospects_admin_insert"
  on public.professional_prospects for insert
  to authenticated
  with check (public.is_fixly_admin());

drop policy if exists "prospects_admin_update" on public.professional_prospects;
create policy "prospects_admin_update"
  on public.professional_prospects for update
  to authenticated
  using (public.is_fixly_admin())
  with check (public.is_fixly_admin());

drop policy if exists "prospects_admin_delete" on public.professional_prospects;
create policy "prospects_admin_delete"
  on public.professional_prospects for delete
  to authenticated
  using (public.is_fixly_admin());

drop policy if exists "prospect_events_admin_select" on public.professional_prospect_events;
create policy "prospect_events_admin_select"
  on public.professional_prospect_events for select
  to authenticated
  using (public.is_fixly_admin());

drop policy if exists "prospect_events_admin_insert" on public.professional_prospect_events;
create policy "prospect_events_admin_insert"
  on public.professional_prospect_events for insert
  to authenticated
  with check (public.is_fixly_admin());
