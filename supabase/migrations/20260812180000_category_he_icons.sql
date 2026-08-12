-- Normalize category Hebrew labels + emoji icons for IL market
-- Idempotent: safe to re-run (no duplicate slug conflicts)

-- 1) Upsert known categories by slug
insert into public.service_categories (name, slug, name_he, icon, sort_order)
select v.name, v.slug, v.name_he, v.icon, v.sort_order
from (values
  ('Plumbing', 'plumbing', 'אינסטלציה', '🚿', 10),
  ('Electrician', 'electricity', 'חשמל', '⚡', 20),
  ('Air Conditioning', 'ac', 'מיזוג אוויר', '❄️', 30),
  ('Cleaning', 'cleaning', 'ניקיון', '✨', 40),
  ('Painting', 'painting', 'צביעה', '🎨', 50),
  ('Carpentry', 'carpentry', 'נגרות', '🪚', 60),
  ('Moving', 'moving', 'הובלות', '🚚', 70),
  ('Gardening', 'gardening', 'גינון', '🌿', 80),
  ('Locksmith', 'locksmith', 'מנעולן', '🔐', 90),
  ('Tiling', 'tiling', 'ריצוף', '🧱', 100),
  ('Elevators', 'elevators', 'מעליות', '🛗', 110),
  ('Pest Control', 'pest_control', 'הדברה', '🐛', 120),
  ('Furniture', 'furniture', 'ריהוט', '🛋️', 130),
  ('Appliance Repair', 'appliance_repair', 'תיקון מכשירים', '🔌', 140),
  ('Computers', 'computers', 'מחשבים', '💻', 150),
  ('Glazing', 'glazing', 'זגגות', '🪟', 160),
  ('Renovations', 'renovations', 'שיפוצים', '🏗️', 170),
  ('General', 'general', 'כללי / אחר', '🧰', 200)
) as v(name, slug, name_he, icon, sort_order)
on conflict (slug) do update
set
  name_he = excluded.name_he,
  icon = excluded.icon,
  sort_order = coalesce(public.service_categories.sort_order, excluded.sort_order);

-- 2) Backfill Hebrew + icons for existing rows by slug only (never rewrite slug here)
update public.service_categories set name_he = 'אינסטלציה', icon = '🚿' where slug = 'plumbing';
update public.service_categories set name_he = 'חשמל', icon = '⚡' where slug = 'electricity';
update public.service_categories set name_he = 'מיזוג אוויר', icon = '❄️' where slug in ('ac', 'hvac');
update public.service_categories set name_he = 'ניקיון', icon = '✨' where slug = 'cleaning';
update public.service_categories set name_he = 'צביעה', icon = '🎨' where slug = 'painting';
update public.service_categories set name_he = 'נגרות', icon = '🪚' where slug = 'carpentry';
update public.service_categories set name_he = 'הובלות', icon = '🚚' where slug = 'moving';
update public.service_categories set name_he = 'גינון', icon = '🌿' where slug = 'gardening';
update public.service_categories set name_he = 'מנעולן', icon = '🔐' where slug = 'locksmith';
update public.service_categories set name_he = 'ריצוף', icon = '🧱' where slug = 'tiling';
update public.service_categories set name_he = 'מעליות', icon = '🛗' where slug = 'elevators';
update public.service_categories set name_he = 'הדברה', icon = '🐛' where slug = 'pest_control';
update public.service_categories set name_he = 'ריהוט', icon = '🛋️' where slug = 'furniture';
update public.service_categories set name_he = 'תיקון מכשירים', icon = '🔌' where slug in ('appliance_repair', 'appliances');
update public.service_categories set name_he = 'מחשבים', icon = '💻' where slug = 'computers';
update public.service_categories set name_he = 'זגגות', icon = '🪟' where slug in ('glazing', 'glass');
update public.service_categories set name_he = 'שיפוצים', icon = '🏗️' where slug in ('renovations', 'renovation');
update public.service_categories set name_he = 'כללי / אחר', icon = '🧰' where slug in ('general', 'other');

-- 3) Orphan English-named rows with empty/null slug: fill Hebrew+icon only when target slug is free
--    If target slug already exists, just update this row's name_he/icon without changing slug.
update public.service_categories c
set
  name_he = 'ריהוט',
  icon = '🛋️',
  slug = case
    when c.slug is null or c.slug = '' then
      case when exists (select 1 from public.service_categories x where x.slug = 'furniture')
        then c.slug else 'furniture' end
    else c.slug
  end
where lower(c.name) = 'furniture';

update public.service_categories c
set
  name_he = 'תיקון מכשירים',
  icon = '🔌',
  slug = case
    when c.slug is null or c.slug in ('', 'appliances', 'appliance-repair') then
      case when exists (
        select 1 from public.service_categories x
        where x.slug = 'appliance_repair' and x.id <> c.id
      ) then c.slug else 'appliance_repair' end
    else c.slug
  end
where lower(c.name) in ('appliance repair', 'appliances');

update public.service_categories c
set
  name_he = 'מחשבים',
  icon = '💻',
  slug = case
    when c.slug is null or c.slug = '' then
      case when exists (select 1 from public.service_categories x where x.slug = 'computers' and x.id <> c.id)
        then c.slug else 'computers' end
    else c.slug
  end
where lower(c.name) = 'computers';

update public.service_categories c
set
  name_he = 'זגגות',
  icon = '🪟'
where lower(c.name) in ('glazing', 'glass') or c.name_he = 'זגגות' or c.slug in ('glazing', 'glass');

update public.service_categories c
set
  name_he = 'שיפוצים',
  icon = '🏗️'
where lower(c.name) in ('renovations', 'renovation')
   or c.name_he = 'שיפוצים'
   or c.slug in ('renovations', 'renovation');
