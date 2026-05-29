-- RLS: allow MVP read/update on requests (anon client)
drop policy if exists "Public requests select" on public.requests;
create policy "Public requests select"
  on public.requests for select
  using (true);

drop policy if exists "Public requests update" on public.requests;
create policy "Public requests update"
  on public.requests for update
  using (true)
  with check (true);

drop policy if exists "Public request images select" on public.request_images;
create policy "Public request images select"
  on public.request_images for select
  using (true);

drop policy if exists "Public request images insert" on public.request_images;
create policy "Public request images insert"
  on public.request_images for insert
  with check (true);

drop policy if exists "Public categories select" on public.categories;
create policy "Public categories select"
  on public.categories for select
  using (true);

-- Guest user (stable id for demo / pre-auth)
insert into public.users (id, full_name, email, user_type, city)
values (
  '00000000-0000-4000-8000-000000000001',
  'אורח',
  'guest@fixly.app',
  'customer',
  'תל אביב-יפו'
)
on conflict (id) do nothing;

-- Demo professionals (Hebrew) — only if table empty
insert into public.professionals (
  id,
  title,
  description,
  category_id,
  rating,
  reviews_count,
  hourly_price,
  city,
  available,
  profile_image
)
select * from (values
  (
    '10000000-0000-4000-8000-000000000001'::uuid,
    'יוסי כהן',
    'אינסטלטור מוסמך — מעל 15 שנות ניסיון',
    'aa907679-96ff-43fd-ab34-63b6bb0c212f'::uuid,
    4.9,
    127,
    200,
    'תל אביב',
    true,
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
  ),
  (
    '10000000-0000-4000-8000-000000000002'::uuid,
    'דוד לוי',
    'חשמלאי מוסמך עם רישיון קבלן',
    '09a1fb31-8a09-4d19-b24c-553b842b0980'::uuid,
    4.8,
    89,
    250,
    'ירושלים',
    true,
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
  ),
  (
    '10000000-0000-4000-8000-000000000003'::uuid,
    'מוחמד עבאס',
    'טכנאי מזגנים — התקנה ותיקון',
    '29657c06-c464-4e8e-a08d-7eb57c2c8c0d'::uuid,
    4.7,
    64,
    300,
    'חיפה',
    true,
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face'
  ),
  (
    '10000000-0000-4000-8000-000000000004'::uuid,
    'רחל גרין',
    'מנקה מקצועית לדירות ומשרדים',
    '99726b35-8eb7-4da4-a0d0-f98b6324002d'::uuid,
    5.0,
    203,
    150,
    'תל אביב',
    false,
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face'
  )
) as v(id, title, description, category_id, rating, reviews_count, hourly_price, city, available, profile_image)
where not exists (select 1 from public.professionals limit 1);
