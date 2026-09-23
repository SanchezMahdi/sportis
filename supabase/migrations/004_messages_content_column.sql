-- Match the production messages table shape: some deployed databases require
-- content in addition to text for chat rows.

alter table public.messages
  add column if not exists content text;

update public.messages
set content = coalesce(content, text, '')
where content is null;

alter table public.messages
  alter column content set not null;
