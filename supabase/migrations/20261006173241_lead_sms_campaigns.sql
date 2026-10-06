create table public.prospect_sms_campaigns (
  id uuid primary key,
  created_at timestamptz not null default now(),
  created_by text not null,
  message text not null check (length(message) between 1 and 1005),
  recipient_snapshot text not null,
  recipient_count integer not null check (recipient_count > 0),
  status text not null default 'submitting'
    check (status in ('submitting', 'accepted', 'rejected', 'unknown')),
  shipment_id text,
  completed_at timestamptz
);
alter table public.prospect_sms_campaigns enable row level security;
revoke all on public.prospect_sms_campaigns from anon, authenticated;
grant select, insert, update on public.prospect_sms_campaigns to service_role;
create index prospect_sms_campaigns_created_idx
  on public.prospect_sms_campaigns (created_at desc);
comment on table public.prospect_sms_campaigns is
  'Admin-only recruitment SMS submission ledger. Ambiguous submissions are never retried automatically.';
