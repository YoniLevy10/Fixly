-- Add beauty / wellness home-service categories to Fixly marketplace
-- Idempotent: safe to re-run (ON CONFLICT + no slug rewrites)

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

-- Backfill by existing slug only (never rewrite slug)
update public.service_categories
set name_he = 'מניקור וציפורניים', icon = '💅'
where slug in ('nails', 'manicure');

update public.service_categories
set name_he = 'תספורת ועיצוב', icon = '✂️'
where slug in ('hair', 'barber');

update public.service_categories
set name_he = 'איפור', icon = '💄'
where slug = 'makeup';
