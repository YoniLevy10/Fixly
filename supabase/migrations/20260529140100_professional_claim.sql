create policy "professionals_claim_profile"
  on public.professionals for update
  using (user_id is null or user_id = auth.uid())
  with check (user_id = auth.uid());
