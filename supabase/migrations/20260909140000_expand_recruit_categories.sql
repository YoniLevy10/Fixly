-- Expand home-service categories used by Superadmin prospect recruitment.
-- tiling → "ריצוף וקרמיקה"; ensure waterproofing / aluminum / drywall / solar exist.

insert into public.service_categories (name, slug, name_he, icon, sort_order)
select v.name, v.slug, v.name_he, v.icon, v.sort_order
from (values
  ('Tiling & Ceramics', 'tiling', 'ריצוף וקרמיקה', '🧱', 100),
  ('Renovations', 'renovations', 'שיפוצים', '🏗️', 170),
  ('Waterproofing', 'waterproofing', 'איטום', '🛡️', 175),
  ('Aluminum', 'aluminum', 'אלומיניום', '🪟', 180),
  ('Drywall', 'drywall', 'גבס וטיח', '🧱', 185),
  ('Solar', 'solar', 'סולאר ודודי שמש', '☀️', 190),
  ('Appliance Repair', 'appliance_repair', 'תיקון מכשירים', '🔌', 140),
  ('Pest Control', 'pest_control', 'הדברה', '🐛', 120),
  ('Glazing', 'glazing', 'זגגות', '🪟', 160),
  ('Furniture', 'furniture', 'ריהוט', '🛋️', 130)
) as v(name, slug, name_he, icon, sort_order)
on conflict (slug) do update
set
  name = excluded.name,
  name_he = excluded.name_he,
  icon = excluded.icon,
  sort_order = coalesce(public.service_categories.sort_order, excluded.sort_order);

update public.service_categories
set name_he = 'ריצוף וקרמיקה', name = 'Tiling & Ceramics', icon = '🧱'
where slug = 'tiling';
