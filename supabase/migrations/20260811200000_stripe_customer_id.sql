-- Stripe customer id for Customer Portal / billing management
alter table public.professionals
  add column if not exists stripe_customer_id text;
