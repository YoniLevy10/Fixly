-- Storage bucket for request + chat images (idempotent)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'request-images',
  'request-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- Public read
drop policy if exists "request_images_public_read" on storage.objects;
create policy "request_images_public_read"
  on storage.objects for select
  using (bucket_id = 'request-images');

-- Authenticated upload (customers + pros)
drop policy if exists "request_images_auth_insert" on storage.objects;
create policy "request_images_auth_insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'request-images');

drop policy if exists "request_images_auth_update" on storage.objects;
create policy "request_images_auth_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'request-images');
