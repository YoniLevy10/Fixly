-- Optional campaign attribution for waitlist leads (UTM etc.)
alter table public.pro_waitlist
  add column if not exists attribution jsonb;
