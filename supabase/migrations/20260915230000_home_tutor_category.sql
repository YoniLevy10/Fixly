-- Home-visit tutor category for Fixly marketplace + recruit discovery.
-- Idempotent without requiring ON CONFLICT (prod may lack unique(slug)).

-- Ensure unique(slug) exists when safe (no duplicate slugs).
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.service_categories'::regclass
      and contype = 'u'
      and pg_get_constraintdef(oid) ilike '%(slug)%'
  ) then
    if not exists (
      select 1 from public.service_categories
      where slug is not null
      group by slug
      having count(*) > 1
    ) then
      alter table public.service_categories
        add constraint service_categories_slug_key unique (slug);
    end if;
  end if;
end $$;

insert into public.service_categories (name, slug, name_he, icon, sort_order)
select v.name, v.slug, v.name_he, v.icon, v.sort_order
from (values
  ('Home tutor', 'home_tutor', 'מורה פרטי', '📚', 28)
) as v(name, slug, name_he, icon, sort_order)
where not exists (
  select 1 from public.service_categories c where c.slug = v.slug
);

update public.service_categories
set
  name_he = 'מורה פרטי',
  icon = '📚',
  sort_order = coalesce(sort_order, 28)
where slug = 'home_tutor';
