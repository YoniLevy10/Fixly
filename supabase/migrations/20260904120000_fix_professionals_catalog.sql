-- Fix empty professionals list in production:
-- 1) Ensure Midrag columns exist (select used to fail hard without them)
-- 2) Ensure beauty categories exist (UI filters already show them)
-- 3) Seed curated beauty + ensure legacy pilot pros remain visible

-- Midrag columns (idempotent; same as 20260812000000 but safe if that migration lagged)
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS midrag_profile_url text;
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS midrag_rating numeric(3, 2);
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS midrag_reviews_count int DEFAULT 0;
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS midrag_last_synced_at timestamptz;
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS midrag_verified boolean DEFAULT false;

-- Beauty categories
insert into public.service_categories (name, slug, name_he, icon, sort_order)
select v.name, v.slug, v.name_he, v.icon, v.sort_order
from (values
  ('Nails', 'nails', 'מניקור וציפורניים', '💅', 5),
  ('Hair', 'hair', 'תספורת ועיצוב', '✂️', 6),
  ('Makeup', 'makeup', 'איפור', '💄', 7)
) as v(name, slug, name_he, icon, sort_order)
on conflict (slug) do update
set
  name_he = excluded.name_he,
  icon = excluded.icon,
  sort_order = coalesce(public.service_categories.sort_order, excluded.sort_order);

-- Curated beauty professionals for marketplace demo / soft launch
-- Fixed UUIDs so re-runs stay idempotent
insert into public.professionals (
  id, title, description, city, available, category_id, phone,
  rating, reviews_count, hourly_price, is_verified, profile_image, availability_summary
)
select
  v.id::uuid,
  v.title,
  v.description,
  v.city,
  v.available,
  c.id,
  v.phone,
  v.rating,
  v.reviews_count,
  v.hourly_price,
  true,
  v.profile_image,
  v.availability_summary
from (values
  (
    '20000000-0000-4000-8000-000000000001',
    'נועה אזולאי',
    'טכנאית ציפורניים מוסמכת — ג׳ל ופדיקור ספא עד הבית או המשרד',
    'תל אביב',
    true,
    'nails',
    '0524112288',
    4.9::numeric,
    214,
    120::numeric,
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face',
    'א׳–ה׳ 09:00–21:00'
  ),
  (
    '20000000-0000-4000-8000-000000000002',
    'מאיה שחר',
    'מניקוריסטית · ג׳ל ארט — עיצובים מותאמים ושירות מהיר',
    'הרצליה',
    true,
    'nails',
    '0547789012',
    4.8::numeric,
    167,
    140::numeric,
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face',
    'א׳–ו׳ 10:00–20:00'
  ),
  (
    '20000000-0000-4000-8000-000000000003',
    'דנה ביטון',
    'מניקור · פדיקור ספא עד הבית',
    'רמת גן',
    true,
    'nails',
    '0503344556',
    4.7::numeric,
    98,
    130::numeric,
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face',
    'א׳–ה׳ 08:30–19:30'
  ),
  (
    '20000000-0000-4000-8000-000000000007',
    'אורי לוי',
    'ספר נייד · תספורות גברים וזקן עד הבית או המשרד',
    'תל אביב',
    true,
    'hair',
    '0541122334',
    4.8::numeric,
    193,
    100::numeric,
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&crop=face',
    'א׳–ה׳ 08:00–20:00'
  ),
  (
    '20000000-0000-4000-8000-000000000008',
    'לינוי רוזן',
    'מעצבת שיער ניידת — תספורות, פן ועיצוב לאירועים',
    'הרצליה',
    true,
    'hair',
    '0505566778',
    4.9::numeric,
    121,
    140::numeric,
    'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=200&h=200&fit=crop&crop=face',
    'א׳–ו׳ 09:00–19:00'
  ),
  (
    '20000000-0000-4000-8000-00000000000b',
    'תמר אדרי',
    'מאפרת מקצועית — איפור יום, ערב ואירועים עד הבית או המלון',
    'תל אביב',
    true,
    'makeup',
    '0543344556',
    4.9::numeric,
    156,
    250::numeric,
    'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=200&h=200&fit=crop&crop=face',
    'א׳–ו׳ 08:00–21:00'
  ),
  (
    '20000000-0000-4000-8000-00000000000c',
    'נועה פלד',
    'מאפרת · אירועים וכלות',
    'הרצליה',
    true,
    'makeup',
    '0527788990',
    4.8::numeric,
    91,
    280::numeric,
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face',
    'לפי תיאום'
  )
) as v(
  id, title, description, city, available, category_slug, phone,
  rating, reviews_count, hourly_price, profile_image, availability_summary
)
join public.service_categories c on c.slug = v.category_slug
on conflict (id) do update
set
  title = excluded.title,
  description = excluded.description,
  city = excluded.city,
  available = excluded.available,
  category_id = excluded.category_id,
  phone = excluded.phone,
  rating = excluded.rating,
  reviews_count = excluded.reviews_count,
  hourly_price = excluded.hourly_price,
  profile_image = excluded.profile_image,
  availability_summary = excluded.availability_summary;
