-- Platform features: matching, chat, referrals, payments, availability, trust metrics

-- Professionals: trust + response time + contact
alter table public.professionals
  add column if not exists is_verified boolean not null default false,
  add column if not exists verified_at timestamptz,
  add column if not exists phone text,
  add column if not exists whatsapp_number text,
  add column if not exists avg_response_minutes numeric(8, 2),
  add column if not exists response_sample_count int not null default 0,
  add column if not exists referral_code text unique,
  add column if not exists availability_summary text;

-- Requests: matching, scheduling, payments, referrals
alter table public.requests
  alter column professional_id drop not null;

alter table public.requests
  add column if not exists match_mode text not null default 'single'
    check (match_mode in ('single', 'multi')),
  add column if not exists accepted_at timestamptz,
  add column if not exists preferred_date date,
  add column if not exists preferred_time time,
  add column if not exists referral_code text,
  add column if not exists review_prompted_at timestamptz,
  add column if not exists payment_status text default 'none'
    check (payment_status in ('none', 'pending', 'paid', 'failed', 'refunded')),
  add column if not exists stripe_checkout_session_id text,
  add column if not exists stripe_payment_intent_id text;

-- Multi-pro matching candidates
create table if not exists public.request_candidates (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests(id) on delete cascade,
  professional_id uuid not null references public.professionals(id) on delete cascade,
  rank smallint not null default 1,
  status text not null default 'invited'
    check (status in ('invited', 'accepted', 'declined', 'expired')),
  invited_at timestamptz not null default now(),
  responded_at timestamptz,
  unique (request_id, professional_id)
);

create index if not exists idx_request_candidates_pro
  on public.request_candidates (professional_id, status);

-- In-app chat
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests(id) on delete cascade,
  sender_id uuid not null references public.users(id) on delete cascade,
  sender_role text not null check (sender_role in ('customer', 'professional')),
  body text not null check (char_length(body) <= 2000),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_messages_request_created
  on public.messages (request_id, created_at);

-- Pro availability (weekly recurring rules)
create table if not exists public.pro_availability_rules (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.professionals(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  timezone text not null default 'Asia/Jerusalem',
  unique (professional_id, day_of_week, start_time)
);

-- Referral codes
create table if not exists public.referral_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  code text not null unique,
  reward_type text not null default 'credit' check (reward_type in ('credit', 'pro_month')),
  uses_count int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.referral_redemptions (
  id uuid primary key default gen_random_uuid(),
  referral_code text not null,
  referrer_user_id uuid references public.users(id) on delete set null,
  referred_user_id uuid references public.users(id) on delete set null,
  request_id uuid references public.requests(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'rewarded')),
  created_at timestamptz not null default now()
);

-- RLS
alter table public.request_candidates enable row level security;
alter table public.messages enable row level security;
alter table public.pro_availability_rules enable row level security;
alter table public.referral_codes enable row level security;
alter table public.referral_redemptions enable row level security;

-- Candidates: customer sees all for their request; invited pro sees own row
create policy "candidates_customer_read"
  on public.request_candidates for select
  using (
    request_id in (select r.id from public.requests r where r.customer_id = auth.uid())
  );

create policy "candidates_pro_read"
  on public.request_candidates for select
  using (
    professional_id in (select p.id from public.professionals p where p.user_id = auth.uid())
  );

create policy "candidates_pro_update"
  on public.request_candidates for update
  using (
    professional_id in (select p.id from public.professionals p where p.user_id = auth.uid())
  );

-- Messages: request participants
create policy "messages_participants_read"
  on public.messages for select
  using (
    request_id in (
      select r.id from public.requests r
      where r.customer_id = auth.uid()
         or r.professional_id in (select p.id from public.professionals p where p.user_id = auth.uid())
         or r.id in (
           select rc.request_id from public.request_candidates rc
           join public.professionals p on p.id = rc.professional_id
           where p.user_id = auth.uid() and rc.status in ('invited', 'accepted')
         )
    )
  );

create policy "messages_participants_insert"
  on public.messages for insert
  with check (
    sender_id = auth.uid()
    and request_id in (
      select r.id from public.requests r
      where r.customer_id = auth.uid()
         or r.professional_id in (select p.id from public.professionals p where p.user_id = auth.uid())
    )
  );

-- Availability: pro manages own; public read
create policy "availability_public_read"
  on public.pro_availability_rules for select using (true);

create policy "availability_pro_write"
  on public.pro_availability_rules for all
  using (
    professional_id in (select p.id from public.professionals p where p.user_id = auth.uid())
  );

-- Referrals: own code read; insert on redeem
create policy "referral_codes_own_read"
  on public.referral_codes for select using (user_id = auth.uid());

create policy "referral_codes_own_insert"
  on public.referral_codes for insert with check (user_id = auth.uid());

create policy "referral_redemptions_insert"
  on public.referral_redemptions for insert with check (true);

create policy "referral_redemptions_own_read"
  on public.referral_redemptions for select
  using (referrer_user_id = auth.uid() or referred_user_id = auth.uid());

-- Realtime for messages
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end $$;

-- Response time aggregate helper
create or replace function public.update_pro_response_time(p_pro_id uuid, p_minutes numeric)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_count int;
  v_avg numeric;
begin
  select response_sample_count, avg_response_minutes
  into v_count, v_avg
  from professionals where id = p_pro_id for update;

  v_count := coalesce(v_count, 0) + 1;
  v_avg := round(((coalesce(v_avg, 0) * (v_count - 1)) + p_minutes) / v_count, 1);

  update professionals
  set avg_response_minutes = v_avg, response_sample_count = v_count
  where id = p_pro_id;
end;
$$;
