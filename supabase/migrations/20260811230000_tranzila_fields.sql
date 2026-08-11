-- Tranzila payment gateway fields
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS tranzila_token TEXT;
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS tranzila_sto_id TEXT;
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS tranzila_subscription_until TIMESTAMPTZ;

-- Add payment_status / amount to requests if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'requests' AND column_name = 'payment_status'
  ) THEN
    ALTER TABLE public.requests ADD COLUMN payment_status TEXT DEFAULT 'pending';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'requests' AND column_name = 'payment_amount_agorot'
  ) THEN
    ALTER TABLE public.requests ADD COLUMN payment_amount_agorot INTEGER DEFAULT 0;
  END IF;
END $$;
