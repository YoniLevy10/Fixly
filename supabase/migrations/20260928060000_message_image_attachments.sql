-- Chat image attachments on request messages
alter table public.messages
  add column if not exists image_url text;

-- Allow image-only messages (empty/short body) while keeping length cap
alter table public.messages
  drop constraint if exists messages_body_check;

alter table public.messages
  alter column body set default '';

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'messages'
      and column_name = 'body'
      and is_nullable = 'NO'
  ) then
    -- keep NOT NULL; empty string is fine for image-only
    null;
  end if;
end $$;

alter table public.messages
  add constraint messages_body_or_image_check
  check (
    char_length(coalesce(body, '')) <= 2000
    and (
      char_length(trim(coalesce(body, ''))) >= 1
      or (image_url is not null and char_length(trim(image_url)) > 0)
    )
  );
