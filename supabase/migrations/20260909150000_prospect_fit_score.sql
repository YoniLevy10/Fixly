-- Fit ranking for Midrag-style recruitment ordering.
-- Safe without UNIQUE constraints.

alter table public.professional_prospects
  add column if not exists fit_score int;

create index if not exists idx_prospects_fit_score
  on public.professional_prospects (fit_score desc nulls last);
