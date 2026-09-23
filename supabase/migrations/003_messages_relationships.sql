-- Ensure PostgREST can discover message relationships for embedded selects.
-- The frontend no longer depends on these relationships, but keeping them in
-- the database prevents schema drift and enables future typed joins.

do $$
begin
  if not exists (
    select 1
    from pg_constraint c
    join pg_attribute a
      on a.attrelid = c.conrelid
     and a.attnum = any(c.conkey)
    where c.contype = 'f'
      and c.conrelid = 'public.messages'::regclass
      and c.confrelid = 'public.sessions'::regclass
      and a.attname = 'session_id'
  ) then
    alter table public.messages
      add constraint messages_session_id_fkey
      foreign key (session_id)
      references public.sessions(id)
      on delete cascade
      not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint c
    join pg_attribute a
      on a.attrelid = c.conrelid
     and a.attnum = any(c.conkey)
    where c.contype = 'f'
      and c.conrelid = 'public.messages'::regclass
      and c.confrelid = 'public.users'::regclass
      and a.attname = 'user_id'
  ) then
    alter table public.messages
      add constraint messages_user_id_fkey
      foreign key (user_id)
      references public.users(id)
      on delete cascade
      not valid;
  end if;
end $$;

notify pgrst, 'reload schema';
