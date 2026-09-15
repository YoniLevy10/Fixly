-- Home-visit tutor category for Fixly marketplace + recruit discovery.
-- Idempotent.

insert into public.service_categories (name, slug, name_he, icon, sort_order)
select v.name, v.slug, v.name_he, v.icon, v.sort_order
from (values
  ('Home tutor', 'home_tutor', 'מורה פרטי', '📚', 28)
) as v(name, slug, name_he, icon, sort_order)
on conflict (slug) do update
set
  name_he = excluded.name_he,
  icon = excluded.icon,
  sort_order = coalesce(public.service_categories.sort_order, excluded.sort_order);
