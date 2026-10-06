create table public.signup_sms_notifications (
  waitlist_id uuid primary key references public.pro_waitlist(id) on delete cascade,
  created_at timestamptz not null default now(),
  status text not null default 'pending'
    check (status in ('pending', 'submitting', 'accepted', 'rejected', 'unknown')),
  shipment_id text,
  completed_at timestamptz
);
alter table public.signup_sms_notifications enable row level security;
revoke all on public.signup_sms_notifications from anon, authenticated;
grant select, insert, update on public.signup_sms_notifications to service_role;
create index signup_sms_notifications_pending_idx
  on public.signup_sms_notifications (created_at) where status = 'pending';

-- Public registrations are written by the server's service-role client.
-- Queue atomically with the registration, without elevating the trigger's role.
create function public.queue_signup_sms_notification()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if current_user in ('service_role', 'postgres', 'supabase_admin') then
    insert into public.signup_sms_notifications (waitlist_id) values (new.id)
      on conflict do nothing;
  end if;
  return new;
end;
$$;
revoke all on function public.queue_signup_sms_notification() from public, anon, authenticated;
grant execute on function public.queue_signup_sms_notification() to service_role;
create trigger queue_signup_sms_notification
  after insert on public.pro_waitlist
  for each row execute function public.queue_signup_sms_notification();
