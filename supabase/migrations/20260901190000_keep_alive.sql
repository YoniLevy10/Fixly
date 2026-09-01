-- Supabase free-tier keep-alive: zero side effects, invoked daily by Vercel Cron

create or replace function public.keep_alive()
returns integer
language sql
stable
as $$
  select 1;
$$;

revoke all on function public.keep_alive() from public;
grant execute on function public.keep_alive() to service_role;
