-- Optional pilot seed (run in Supabase SQL Editor AFTER heavy marketing).
-- Safe / idempotent: only inserts when matching rows are absent.
-- Adjust city / names / phones to your pilot market.
-- Marketing gate: replace placeholders with ≥20 real claimed pros before ads.

-- Ensure core categories exist (in case older DB missed seeds)
insert into public.service_categories (name, slug, name_he)
select v.name, v.slug, v.name_he
from (values
  ('Elevators', 'elevators', 'מעליות'),
  ('Cleaning', 'cleaning', 'ניקיון'),
  ('Electrician', 'electricity', 'חשמל'),
  ('Plumber', 'plumbing', 'אינסטלציה'),
  ('Air Conditioning', 'ac', 'מיזוג'),
  ('Gardening', 'gardening', 'גינון'),
  ('Locksmith', 'locksmith', 'מנעולים'),
  ('Pest Control', 'pest_control', 'הדברה'),
  ('General', 'general', 'כללי / אחר'),
  ('Nails', 'nails', 'ציפורניים'),
  ('Hair', 'hair', 'שיער'),
  ('Makeup', 'makeup', 'איפור')
) as v(name, slug, name_he)
where not exists (
  select 1 from public.service_categories c where c.slug = v.slug
);

-- Example active pros in חדרה (replace phones / titles before production use)
-- These are scaffolding only — do NOT run ads until you have 20+ claimed real pros.
insert into public.professionals (title, description, city, available, category_id, phone)
select
  v.title,
  v.description,
  v.city,
  true,
  c.id,
  v.phone
from (values
  ('מעלית פלוס חדרה', 'שירות מעליות — פיילוט', 'חדרה', 'elevators', '972501111111'),
  ('אלי מעליות', 'תיקוני מעליות — פיילוט', 'חדרה', 'elevators', '972502222222'),
  ('ניקיון אקספרס חדרה', 'ניקיון בניינים — פיילוט', 'חדרה', 'cleaning', '972503333333'),
  ('חשמל מהיר חדרה', 'תיקוני חשמל — פיילוט', 'חדרה', 'electricity', '972504444444'),
  ('אינסטלציה 24/7 חדרה', 'סתימות ודליפות — פיילוט', 'חדרה', 'plumbing', '972505555555'),
  ('מיזוג צפון', 'התקנה ותיקון מזגנים — פיילוט', 'חדרה', 'ac', '972506666666')
) as v(title, description, city, category_slug, phone)
join public.service_categories c on c.slug = v.category_slug
where not exists (
  select 1
  from public.professionals p
  where p.title = v.title and p.city = v.city
);
