-- Normalize category Hebrew labels + emoji icons for IL market
-- Fixes English-only names (Furniture, Appliance Repair, …) showing in Hebrew UI

-- Ensure known marketplace categories exist
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
where not exists (
  select 1 from public.service_categories c where c.slug = v.slug
);

-- Backfill Hebrew + icons for existing rows by slug
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

-- Fix rows that were seeded with English name only (no useful slug)
update public.service_categories
set slug = 'furniture', name_he = 'ריהוט', icon = '🛋️'
where lower(name) = 'furniture' and (slug is null or slug = '' or slug = 'furniture');

update public.service_categories
set slug = 'appliance_repair', name_he = 'תיקון מכשירים', icon = '🔌'
where lower(name) in ('appliance repair', 'appliances')
  and (slug is null or slug in ('', 'appliance_repair', 'appliances', 'appliance-repair'));

update public.service_categories
set slug = 'computers', name_he = 'מחשבים', icon = '💻'
where lower(name) = 'computers' and (slug is null or slug in ('', 'computers'));

update public.service_categories
set slug = 'glazing', name_he = 'זגגות', icon = '🪟'
where (lower(name) in ('glazing', 'glass') or name_he in ('זגגות'))
  and (slug is null or slug in ('', 'glazing', 'glass'));

update public.service_categories
set slug = 'renovations', name_he = 'שיפוצים', icon = '🏗️'
where (lower(name) in ('renovations', 'renovation') or name_he = 'שיפוצים')
  and (slug is null or slug in ('', 'renovations', 'renovation'));
