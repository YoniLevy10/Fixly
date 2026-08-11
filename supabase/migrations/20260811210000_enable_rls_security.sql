-- Enable RLS on core tables that had policies but may lack FORCE/enable
alter table public.requests enable row level security;
alter table public.professionals enable row level security;
alter table public.request_images enable row level security;
alter table public.service_categories enable row level security;

-- Claim only unclaimed profiles (cannot overwrite another user's link)
drop policy if exists "professionals_claim_profile" on public.professionals;
create policy "professionals_claim_profile"
  on public.professionals for update
  using (user_id is null)
  with check (user_id = auth.uid());

-- Billing events: pros can read own; inserts via service role only
drop policy if exists "billing_events_pro_insert" on public.billing_events;
drop policy if exists "billing_events_service_insert" on public.billing_events;
create policy "billing_events_service_insert"
  on public.billing_events for insert
  with check (auth.role() = 'service_role');

drop policy if exists "billing_events_pro_read" on public.billing_events;
create policy "billing_events_pro_read"
  on public.billing_events for select
  using (
    professional_id in (
      select p.id from public.professionals p where p.user_id = auth.uid()
    )
  );

-- Referral redemptions: tighten insert; keep own read; allow service update
drop policy if exists "referral_redemptions_insert" on public.referral_redemptions;
drop policy if exists "referral_redemptions_service_insert" on public.referral_redemptions;
create policy "referral_redemptions_service_insert"
  on public.referral_redemptions for insert
  with check (auth.role() = 'service_role');

drop policy if exists "referral_redemptions_own_read" on public.referral_redemptions;
create policy "referral_redemptions_own_read"
  on public.referral_redemptions for select
  using (referrer_user_id = auth.uid() or referred_user_id = auth.uid());

drop policy if exists "referral_redemptions_service_update" on public.referral_redemptions;
create policy "referral_redemptions_service_update"
  on public.referral_redemptions for update
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
