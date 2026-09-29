-- Production lead-capture columns for real signups (audience / source / UTM).
-- Idempotent: safe if older waitlist_audience / waitlist_attribution migrations already ran.

alter table public.pro_waitlist
  add column if not exists audience text not null default 'customer';

alter table public.pro_waitlist
  add column if not exists source text;

alter table public.pro_waitlist
  add column if not exists attribution jsonb;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'pro_waitlist_audience_check'
  ) then
    alter table public.pro_waitlist
      add constraint pro_waitlist_audience_check
      check (audience in ('customer', 'professional'));
  end if;
end $$;

create index if not exists pro_waitlist_audience_created_idx
  on public.pro_waitlist (audience, created_at desc);

create index if not exists pro_waitlist_source_created_idx
  on public.pro_waitlist (source, created_at desc)
  where source is not null;

comment on column public.pro_waitlist.audience is
  'Real signup audience: customer | professional. Not discovery prospects.';
comment on column public.pro_waitlist.source is
  'Registration surface, e.g. waitlist_landing_v5, waitlist_audience_professional.';
comment on column public.pro_waitlist.attribution is
  'UTM JSON: utm_source, utm_medium, utm_campaign, utm_content, utm_term.';
