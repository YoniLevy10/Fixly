-- Add beauty / wellness home-service categories to Fixly marketplace

insert into public.service_categories (name, slug, name_he, icon, sort_order)
select v.name, v.slug, v.name_he, v.icon, v.sort_order
from (values
  ('Nails', 'nails', 'מניקור וציפורניים', '💅', 5),
  ('Hair', 'hair', 'תספורת ועיצוב', '✂️', 6),
  ('Makeup', 'makeup', 'איפור', '💄', 7)
) as v(name, slug, name_he, icon, sort_order)
where not exists (
  select 1 from public.service_categories c where c.slug = v.slug
);

update public.service_categories
set name_he = 'מניקור וציפורניים', icon = '💅', name = 'Nails'
where slug in ('nails', 'manicure');

update public.service_categories
set name_he = 'תספורת ועיצוב', icon = '✂️', name = 'Hair'
where slug in ('hair', 'barber');

update public.service_categories
set name_he = 'איפור', icon = '💄', name = 'Makeup'
where slug = 'makeup';
