-- Monetization: billing events + pro billing fields + request fee fields

alter table public.professionals
  add column if not exists subscription_tier text not null default 'free'
    check (subscription_tier in ('free', 'pro', 'pro_plus')),
  add column if not exists lead_credits int not null default 3,
  add column if not exists subscription_until timestamptz;

alter table public.requests
  add column if not exists quoted_amount numeric(12, 2),
  add column if not exists platform_fee_agorot int default 0,
  add column if not exists paid_at timestamptz;

create table if not exists public.billing_events (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.professionals(id) on delete cascade,
  request_id uuid references public.requests(id) on delete set null,
  event_type text not null,
  amount_agorot int not null default 0,
  currency text not null default 'ils',
  metadata jsonb default '{}',
  created_at timestamptz not null default now()
);

create index if not exists idx_billing_events_professional
  on public.billing_events (professional_id, created_at desc);

alter table public.billing_events enable row level security;

create policy "billing_events_pro_read"
  on public.billing_events for select
  using (
    professional_id in (
      select p.id from public.professionals p where p.user_id = auth.uid()
    )
  );

create policy "billing_events_pro_insert"
  on public.billing_events for insert
  with check (
    professional_id in (
      select p.id from public.professionals p where p.user_id = auth.uid()
    )
  );
