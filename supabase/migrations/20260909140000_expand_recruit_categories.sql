-- Expand home-service categories used by Superadmin prospect recruitment.
-- Production may lack UNIQUE(slug), so avoid ON CONFLICT (slug).

-- 1) Insert missing slugs only
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
where not exists (
  select 1 from public.service_categories c where c.slug = v.slug
);

-- 2) Refresh labels/icons for rows that already exist
update public.service_categories set name = 'Tiling & Ceramics', name_he = 'ריצוף וקרמיקה', icon = '🧱', sort_order = coalesce(sort_order, 100) where slug = 'tiling';
update public.service_categories set name_he = 'שיפוצים', icon = '🏗️', sort_order = coalesce(sort_order, 170) where slug = 'renovations';
update public.service_categories set name = 'Waterproofing', name_he = 'איטום', icon = '🛡️', sort_order = coalesce(sort_order, 175) where slug = 'waterproofing';
update public.service_categories set name = 'Aluminum', name_he = 'אלומיניום', icon = '🪟', sort_order = coalesce(sort_order, 180) where slug = 'aluminum';
update public.service_categories set name = 'Drywall', name_he = 'גבס וטיח', icon = '🧱', sort_order = coalesce(sort_order, 185) where slug = 'drywall';
update public.service_categories set name = 'Solar', name_he = 'סולאר ודודי שמש', icon = '☀️', sort_order = coalesce(sort_order, 190) where slug = 'solar';
update public.service_categories set name_he = 'תיקון מכשירים', icon = '🔌', sort_order = coalesce(sort_order, 140) where slug = 'appliance_repair';
update public.service_categories set name_he = 'הדברה', icon = '🐛', sort_order = coalesce(sort_order, 120) where slug = 'pest_control';
update public.service_categories set name_he = 'זגגות', icon = '🪟', sort_order = coalesce(sort_order, 160) where slug = 'glazing';
update public.service_categories set name_he = 'ריהוט', icon = '🛋️', sort_order = coalesce(sort_order, 130) where slug = 'furniture';

-- 3) Optional: add UNIQUE(slug) for future upserts (skips if duplicates exist)
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.service_categories'::regclass
      and contype in ('u', 'p')
      and pg_get_constraintdef(oid) ilike '%(slug)%'
  ) and not exists (
    select 1 from public.service_categories
    where slug is not null
    group by slug
    having count(*) > 1
  ) then
    alter table public.service_categories
      add constraint service_categories_slug_key unique (slug);
  end if;
exception
  when duplicate_object then
    null;
end $$;
