-- Marketing-ready RLS: multi-match invites + parent request visibility for invited pros.
-- Candidate inserts go through service-role (admin client) — no public INSERT policy.

-- Invited / accepted candidates can read the parent request (pro dashboard invites)
drop policy if exists "requests_select_participants" on public.requests;
create policy "requests_select_participants"
  on public.requests for select
  using (
    customer_id = auth.uid()
    or professional_id in (
      select p.id from public.professionals p where p.user_id = auth.uid()
    )
    or id in (
      select rc.request_id
      from public.request_candidates rc
      join public.professionals p on p.id = rc.professional_id
      where p.user_id = auth.uid()
        and rc.status in ('invited', 'accepted')
    )
  );

-- Allow invited pros to update request_images tied to invite (read already covers participants via requests)
-- Ensure candidates_pro_read still works; no insert policy for anon — service role only.

comment on table public.request_candidates is
  'Matching invites. Inserts via service_role only (Fixly server). Pros update own row; customer/pro read own rows.';
