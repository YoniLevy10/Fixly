-- Multi-source identity + website + license for Brave/registry discovery.
-- Apply on Fixly Supabase before relying on new Superadmin/source fields.
-- See docs/PRO_OUTREACH.md

alter table public.professional_prospects
  add column if not exists website_url text,
  add column if not exists source_refs jsonb not null default '[]'::jsonb,
  add column if not exists license jsonb;

comment on column public.professional_prospects.website_url is
  'Business website URL (not Google Maps URI)';
comment on column public.professional_prospects.source_refs is
  'Array of { source, externalId?, url?, seenAt } from discovery adapters';
comment on column public.professional_prospects.license is
  'Optional license evidence { kind, number, authority, validUntil, status, raw? }';
