-- Production hardening: cancellation reason, admin waitlist access, lead credit reset, review uniqueness

alter table public.requests
  add column if not exists cancellation_reason text;

-- One review per request
create unique index if not exists idx_reviews_request_unique
  on public.reviews (request_id)
  where request_id is not null;

-- Admin read access to waitlist (service role bypasses RLS; this is for authenticated admins)
drop policy if exists "pro_waitlist_select_service" on public.pro_waitlist;
create policy "pro_waitlist_select_service"
  on public.pro_waitlist for select
  using (
    auth.jwt() ->> 'email' = any (
      string_to_array(coalesce(current_setting('app.admin_emails', true), ''), ',')
    )
    or (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- Monthly lead credit reset for free-tier professionals
create or replace function public.reset_monthly_lead_credits()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.professionals
  set lead_credits = 3
  where subscription_tier = 'free'
    and (subscription_until is null or subscription_until < now());
end;
$$;

-- Track last credit reset per pro (optional metadata via billing_events is enough for MVP)
