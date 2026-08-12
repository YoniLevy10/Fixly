-- === MIDRAG INTEGRATION ===

-- Seed additional Bamakor categories (painting / carpentry / moving / tiling)
insert into public.service_categories (name, slug, name_he, sort_order)
select v.name, v.slug, v.name_he, v.sort_order
from (values
  ('Painting', 'painting', 'צבעי', 30),
  ('Carpentry', 'carpentry', 'נגרות', 40),
  ('Moving', 'moving', 'הובלות', 50),
  ('Tiling', 'tiling', 'ריצוף', 60)
) as v(name, slug, name_he, sort_order)
where not exists (
  select 1 from public.service_categories c where c.slug = v.slug
);

-- 1. New columns on professionals
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS midrag_profile_url text;
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS midrag_rating numeric(3, 2);
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS midrag_reviews_count int DEFAULT 0;
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS midrag_last_synced_at timestamptz;
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS midrag_verified boolean DEFAULT false;

-- 2. external_reviews table
CREATE TABLE IF NOT EXISTS public.external_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  source text NOT NULL DEFAULT 'midrag',
  source_url text,
  source_review_id text,
  rating smallint NOT NULL CHECK (rating >= 1 AND rating <= 10),
  review_text text,
  reviewer_name text,
  review_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (professional_id, source, source_review_id)
);

CREATE INDEX IF NOT EXISTS idx_external_reviews_pro
  ON public.external_reviews (professional_id, review_date DESC);

-- 3. RLS
ALTER TABLE public.external_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "external_reviews_public_read" ON public.external_reviews;
CREATE POLICY "external_reviews_public_read"
  ON public.external_reviews FOR SELECT USING (true);

DROP POLICY IF EXISTS "external_reviews_pro_insert" ON public.external_reviews;
CREATE POLICY "external_reviews_pro_insert"
  ON public.external_reviews FOR INSERT TO authenticated
  WITH CHECK (professional_id IN (
    SELECT p.id FROM public.professionals p WHERE p.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "external_reviews_pro_delete" ON public.external_reviews;
CREATE POLICY "external_reviews_pro_delete"
  ON public.external_reviews FOR DELETE TO authenticated
  USING (professional_id IN (
    SELECT p.id FROM public.professionals p WHERE p.user_id = auth.uid()
  ));

-- 4. Realtime publication
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'external_reviews') THEN
    ALTER publication supabase_realtime ADD TABLE public.external_reviews;
  END IF;
END $$;
