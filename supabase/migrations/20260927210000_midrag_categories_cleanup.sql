-- Midrag-aligned taxonomy: drop beauty/tutor/computers; add handyman + phone_repair;
-- rename solar to דודי שמש וחשמל.
-- Idempotent. Avoids ON CONFLICT (slug) in case UNIQUE(slug) is missing.

-- 1) Remove beauty / tutor / computers categories (FKs use ON DELETE SET NULL / CASCADE)
delete from public.service_categories
where slug in (
  'nails',
  'hair',
  'makeup',
  'manicure',
  'barber',
  'home_tutor',
  'computers'
);

-- 2) Insert handyman + phone_repair when missing
insert into public.service_categories (name, slug, name_he, icon, sort_order)
select v.name, v.slug, v.name_he, v.icon, v.sort_order
from (values
  ('Handyman', 'handyman', 'שיפוצים קטנים', '🔧', 165),
  ('Phone Repair', 'phone_repair', 'תיקון סמארטפון', '📱', 145)
) as v(name, slug, name_he, icon, sort_order)
where not exists (
  select 1 from public.service_categories c where c.slug = v.slug
);

-- 3) Refresh labels/icons for new + solar rows
update public.service_categories
set name = 'Handyman', name_he = 'שיפוצים קטנים', icon = '🔧',
    sort_order = coalesce(sort_order, 165)
where slug = 'handyman';

update public.service_categories
set name = 'Phone Repair', name_he = 'תיקון סמארטפון', icon = '📱',
    sort_order = coalesce(sort_order, 145)
where slug = 'phone_repair';

update public.service_categories
set name = 'Solar', name_he = 'דודי שמש וחשמל', icon = '☀️',
    sort_order = coalesce(sort_order, 190)
where slug = 'solar';
