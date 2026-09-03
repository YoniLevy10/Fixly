-- Extend waitlist for pre-launch signups (customers + professionals)
alter table public.pro_waitlist
  add column if not exists audience text not null default 'professional';

alter table public.pro_waitlist
  add column if not exists source text;

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
