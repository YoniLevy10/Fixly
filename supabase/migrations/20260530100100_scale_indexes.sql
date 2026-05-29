-- Scale: indexes for request list queries

create index if not exists idx_requests_customer_created
  on public.requests (customer_id, created_at desc);

create index if not exists idx_requests_professional_status
  on public.requests (professional_id, status);

create index if not exists idx_requests_professional_created
  on public.requests (professional_id, created_at desc);
