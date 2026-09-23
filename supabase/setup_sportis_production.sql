-- ============================================================
-- Sportis production setup / repair
-- Project target: https://zrxcagcwhffqawctepep.supabase.co
--
-- Run this once in Supabase SQL Editor for the sportis1 project.
-- It is intentionally idempotent: it creates missing tables/columns,
-- relationships, RLS policies, storage bucket, and helper functions.
-- ============================================================

create extension if not exists "uuid-ossp";

-- ============================================================
-- Core tables
-- ============================================================

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  name text,
  full_name text,
  city text,
  gender text,
  sports text[] default '{}',
  avatar_url text,
  mvp_count integer default 0,
  high_fives_received integer default 0,
  sessions_played integer default 0,
  reliability_score float default 50,
  win_loss_ratio float default 0,
  avg_rating float default 0,
  last_activity timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.users add column if not exists email text;
alter table public.users add column if not exists name text;
alter table public.users add column if not exists full_name text;
alter table public.users add column if not exists city text;
alter table public.users add column if not exists gender text;
alter table public.users add column if not exists sports text[] default '{}';
alter table public.users add column if not exists avatar_url text;
alter table public.users add column if not exists mvp_count integer default 0;
alter table public.users add column if not exists high_fives_received integer default 0;
alter table public.users add column if not exists sessions_played integer default 0;
alter table public.users add column if not exists reliability_score float default 50;
alter table public.users add column if not exists win_loss_ratio float default 0;
alter table public.users add column if not exists avg_rating float default 0;
alter table public.users add column if not exists last_activity timestamp with time zone;
alter table public.users add column if not exists created_at timestamp with time zone default timezone('utc'::text, now()) not null;

create table if not exists public.sessions (
  id uuid default uuid_generate_v4() primary key,
  creator_id uuid,
  sport text,
  title text,
  description text,
  date date,
  time time,
  location text,
  address text,
  lat float8,
  lng float8,
  max_players int default 10,
  gender_filter text default 'Gemischt',
  skill_level text default 'Mittel',
  equipment boolean default false,
  reminder_sent boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.sessions add column if not exists creator_id uuid;
alter table public.sessions add column if not exists sport text;
alter table public.sessions add column if not exists title text;
alter table public.sessions add column if not exists description text;
alter table public.sessions add column if not exists date date;
alter table public.sessions add column if not exists time time;
alter table public.sessions add column if not exists location text;
alter table public.sessions add column if not exists address text;
alter table public.sessions add column if not exists lat float8;
alter table public.sessions add column if not exists lng float8;
alter table public.sessions add column if not exists max_players int default 10;
alter table public.sessions add column if not exists gender_filter text default 'Gemischt';
alter table public.sessions add column if not exists skill_level text default 'Mittel';
alter table public.sessions add column if not exists equipment boolean default false;
alter table public.sessions add column if not exists reminder_sent boolean default false;
alter table public.sessions add column if not exists created_at timestamp with time zone default timezone('utc'::text, now()) not null;

create table if not exists public.session_participants (
  id uuid default uuid_generate_v4() primary key,
  session_id uuid,
  user_id uuid,
  waitlist boolean default false,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.session_participants add column if not exists session_id uuid;
alter table public.session_participants add column if not exists user_id uuid;
alter table public.session_participants add column if not exists waitlist boolean default false;
alter table public.session_participants add column if not exists joined_at timestamp with time zone default timezone('utc'::text, now()) not null;

create table if not exists public.messages (
  id uuid default uuid_generate_v4() primary key,
  session_id uuid,
  user_id uuid,
  text text,
  content text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.messages add column if not exists session_id uuid;
alter table public.messages add column if not exists user_id uuid;
alter table public.messages add column if not exists text text;
alter table public.messages add column if not exists content text;
update public.messages set content = coalesce(content, text, '') where content is null;
alter table public.messages alter column content set not null;
alter table public.messages add column if not exists created_at timestamp with time zone default timezone('utc'::text, now()) not null;

create table if not exists public.courts (
  id uuid default uuid_generate_v4() primary key,
  name text,
  address text,
  lat float8,
  lng float8,
  sports text[] default '{}',
  indoor boolean default false,
  free boolean default true,
  photo_url text,
  added_by uuid,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.courts add column if not exists name text;
alter table public.courts add column if not exists address text;
alter table public.courts add column if not exists lat float8;
alter table public.courts add column if not exists lng float8;
alter table public.courts add column if not exists sports text[] default '{}';
alter table public.courts add column if not exists indoor boolean default false;
alter table public.courts add column if not exists free boolean default true;
alter table public.courts add column if not exists photo_url text;
alter table public.courts add column if not exists added_by uuid;
alter table public.courts add column if not exists created_at timestamp with time zone default timezone('utc'::text, now()) not null;

create table if not exists public.reported_osm_venues (
  id uuid default uuid_generate_v4() primary key,
  osm_id text not null unique,
  name text,
  reported_by uuid,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid,
  message text not null,
  type text not null default 'info',
  session_id uuid,
  read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.reports (
  id uuid default uuid_generate_v4() primary key,
  reporter_id uuid,
  reported_user_id uuid,
  session_id uuid,
  reason text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.join_requests (
  id uuid default uuid_generate_v4() primary key,
  session_id uuid,
  user_id uuid,
  status text default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.equipment_items (
  id uuid default uuid_generate_v4() primary key,
  session_id uuid,
  item_name text not null,
  brought_by uuid,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.reviews (
  id uuid default uuid_generate_v4() primary key,
  session_id uuid,
  from_user_id uuid,
  to_user_id uuid,
  is_mvp boolean default false,
  high_five boolean default false,
  rating integer default 3,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.score_history (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid,
  mvp_count integer default 0,
  high_fives_received integer default 0,
  sessions_played integer default 0,
  reliability_score float default 50,
  win_loss_ratio float default 0,
  avg_rating float default 0,
  recorded_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Court booking tables used by the booking migration.
create table if not exists public.court_partners (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  logo_url text,
  api_key text,
  api_base_url text,
  commission_rate float default 0.15,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.court_bookings (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid,
  session_id uuid,
  court_id uuid,
  partner_id uuid,
  partner_booking_id text,
  court_name text not null,
  court_address text,
  booking_date date not null,
  time_from time not null,
  time_to time not null,
  duration_minutes integer,
  price_cents integer,
  currency text default 'EUR',
  status text default 'confirmed',
  booking_url text,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.earnings (
  id uuid default uuid_generate_v4() primary key,
  booking_id uuid,
  partner_id uuid,
  commission_amount_cents integer not null,
  commission_rate float,
  status text default 'pending',
  notes text,
  calculated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  paid_at timestamp with time zone
);

-- ============================================================
-- Relationships for PostgREST embedded selects
-- ============================================================

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'sessions_creator_id_fkey') then
    alter table public.sessions
      add constraint sessions_creator_id_fkey foreign key (creator_id) references public.users(id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'session_participants_session_id_fkey') then
    alter table public.session_participants
      add constraint session_participants_session_id_fkey foreign key (session_id) references public.sessions(id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'session_participants_user_id_fkey') then
    alter table public.session_participants
      add constraint session_participants_user_id_fkey foreign key (user_id) references public.users(id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'session_participants_unique_session_user') then
    alter table public.session_participants
      add constraint session_participants_unique_session_user unique (session_id, user_id);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'messages_session_id_fkey') then
    alter table public.messages
      add constraint messages_session_id_fkey foreign key (session_id) references public.sessions(id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'messages_user_id_fkey') then
    alter table public.messages
      add constraint messages_user_id_fkey foreign key (user_id) references public.users(id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'courts_added_by_fkey') then
    alter table public.courts
      add constraint courts_added_by_fkey foreign key (added_by) references public.users(id) on delete set null;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'reported_osm_venues_reported_by_fkey') then
    alter table public.reported_osm_venues
      add constraint reported_osm_venues_reported_by_fkey foreign key (reported_by) references public.users(id) on delete set null;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'notifications_user_id_fkey') then
    alter table public.notifications
      add constraint notifications_user_id_fkey foreign key (user_id) references public.users(id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'notifications_session_id_fkey') then
    alter table public.notifications
      add constraint notifications_session_id_fkey foreign key (session_id) references public.sessions(id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'join_requests_unique_session_user') then
    alter table public.join_requests
      add constraint join_requests_unique_session_user unique (session_id, user_id);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'equipment_items_session_id_fkey') then
    alter table public.equipment_items
      add constraint equipment_items_session_id_fkey foreign key (session_id) references public.sessions(id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'equipment_items_brought_by_fkey') then
    alter table public.equipment_items
      add constraint equipment_items_brought_by_fkey foreign key (brought_by) references public.users(id) on delete set null;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'reviews_unique_session_from_to') then
    alter table public.reviews
      add constraint reviews_unique_session_from_to unique (session_id, from_user_id, to_user_id);
  end if;
end $$;

-- ============================================================
-- RLS policies
-- ============================================================

alter table public.users enable row level security;
alter table public.sessions enable row level security;
alter table public.session_participants enable row level security;
alter table public.messages enable row level security;
alter table public.courts enable row level security;
alter table public.reported_osm_venues enable row level security;
alter table public.notifications enable row level security;
alter table public.reports enable row level security;
alter table public.join_requests enable row level security;
alter table public.equipment_items enable row level security;
alter table public.reviews enable row level security;
alter table public.score_history enable row level security;
alter table public.court_partners enable row level security;
alter table public.court_bookings enable row level security;
alter table public.earnings enable row level security;

drop policy if exists "Public profiles are viewable by everyone" on public.users;
create policy "Public profiles are viewable by everyone" on public.users for select using (true);
drop policy if exists "Users can insert their own profile" on public.users;
create policy "Users can insert their own profile" on public.users for insert with check (auth.uid() = id);
drop policy if exists "Users can update their own profile" on public.users;
create policy "Users can update their own profile" on public.users for update using (auth.uid() = id);
drop policy if exists "Users can delete their own profile" on public.users;
create policy "Users can delete their own profile" on public.users for delete using (auth.uid() = id);

-- Public profiles should not expose email addresses.
revoke select on public.users from anon, authenticated;
grant select (
  id,
  name,
  full_name,
  city,
  gender,
  sports,
  avatar_url,
  mvp_count,
  high_fives_received,
  sessions_played,
  reliability_score,
  win_loss_ratio,
  avg_rating,
  last_activity,
  created_at
) on public.users to anon, authenticated;

drop policy if exists "Sessions are viewable by everyone" on public.sessions;
create policy "Sessions are viewable by everyone" on public.sessions for select using (true);
drop policy if exists "Authenticated users can create sessions" on public.sessions;
create policy "Authenticated users can create sessions" on public.sessions for insert with check (auth.role() = 'authenticated' and auth.uid() = creator_id);
drop policy if exists "Creators can update their sessions" on public.sessions;
create policy "Creators can update their sessions" on public.sessions for update using (auth.uid() = creator_id);
drop policy if exists "Creators can delete their sessions" on public.sessions;
create policy "Creators can delete their sessions" on public.sessions for delete using (auth.uid() = creator_id);

drop policy if exists "Participants are viewable by everyone" on public.session_participants;
create policy "Participants are viewable by everyone" on public.session_participants for select using (true);
drop policy if exists "Authenticated users can join sessions" on public.session_participants;
create policy "Authenticated users can join sessions" on public.session_participants for insert with check (auth.role() = 'authenticated' and auth.uid() = user_id);
drop policy if exists "Users can leave sessions" on public.session_participants;
create policy "Users can leave sessions" on public.session_participants for delete using (auth.uid() = user_id);

drop policy if exists "Messages viewable by everyone" on public.messages;
create policy "Messages viewable by everyone" on public.messages for select using (true);
drop policy if exists "Authenticated users can send messages" on public.messages;
create policy "Participants can send messages" on public.messages for insert with check (
  auth.role() = 'authenticated'
  and auth.uid() = user_id
  and exists (
    select 1
    from public.session_participants sp
    where sp.session_id = messages.session_id
      and sp.user_id = auth.uid()
      and coalesce(sp.waitlist, false) = false
  )
);

drop policy if exists "Courts viewable by everyone" on public.courts;
create policy "Courts viewable by everyone" on public.courts for select using (true);
drop policy if exists "Authenticated users can add courts" on public.courts;
create policy "Authenticated users can add courts" on public.courts for insert with check (auth.role() = 'authenticated' and auth.uid() = added_by);

drop policy if exists "Anyone can read reported venues" on public.reported_osm_venues;
create policy "Anyone can read reported venues" on public.reported_osm_venues for select using (true);
drop policy if exists "Authenticated users can report venues" on public.reported_osm_venues;
create policy "Authenticated users can report venues" on public.reported_osm_venues for insert with check (auth.role() = 'authenticated' and auth.uid() = reported_by);

drop policy if exists "Users can view their own notifications" on public.notifications;
create policy "Users can view their own notifications" on public.notifications for select using (auth.uid() = user_id);
drop policy if exists "System can insert notifications" on public.notifications;
revoke insert on public.notifications from anon, authenticated;
drop policy if exists "Users can mark their notifications as read" on public.notifications;
create policy "Users can mark their notifications as read" on public.notifications for update using (auth.uid() = user_id);
drop policy if exists "Users can delete their own notifications" on public.notifications;
create policy "Users can delete their own notifications" on public.notifications for delete using (auth.uid() = user_id);

drop policy if exists "Authenticated users can submit reports" on public.reports;
create policy "Authenticated users can submit reports" on public.reports for insert with check (auth.role() = 'authenticated' and auth.uid() = reporter_id);
drop policy if exists "Users can view their own reports" on public.reports;
create policy "Users can view their own reports" on public.reports for select using (auth.uid() = reporter_id);

drop policy if exists "Join requests readable by involved users" on public.join_requests;
create policy "Join requests readable by involved users" on public.join_requests
  for select using (
    auth.uid() = user_id
    or exists (select 1 from public.sessions s where s.id = session_id and s.creator_id = auth.uid())
  );
drop policy if exists "Users can create own join requests" on public.join_requests;
create policy "Users can create own join requests" on public.join_requests for insert with check (auth.uid() = user_id);
drop policy if exists "Users can delete own join requests" on public.join_requests;
create policy "Users can delete own join requests" on public.join_requests for delete using (auth.uid() = user_id);

drop policy if exists "Equipment visible to everyone" on public.equipment_items;
create policy "Equipment visible to everyone" on public.equipment_items for select using (true);
drop policy if exists "Session creators can add equipment" on public.equipment_items;
create policy "Session creators can add equipment" on public.equipment_items
  for insert with check (exists (select 1 from public.sessions s where s.id = session_id and s.creator_id = auth.uid()));
drop policy if exists "Session creators can delete equipment" on public.equipment_items;
create policy "Session creators can delete equipment" on public.equipment_items
  for delete using (exists (select 1 from public.sessions s where s.id = session_id and s.creator_id = auth.uid()));
drop policy if exists "Participants can update equipment" on public.equipment_items;
revoke update on public.equipment_items from anon, authenticated;

drop policy if exists "Reviews viewable by everyone" on public.reviews;
create policy "Reviews viewable by everyone" on public.reviews for select using (true);
drop policy if exists "Authenticated users can submit reviews" on public.reviews;
create policy "Participants can submit reviews" on public.reviews for insert with check (
  auth.role() = 'authenticated'
  and auth.uid() = from_user_id
  and from_user_id <> to_user_id
  and exists (
    select 1
    from public.session_participants sp
    where sp.session_id = reviews.session_id
      and sp.user_id = auth.uid()
      and coalesce(sp.waitlist, false) = false
  )
  and exists (
    select 1
    from public.session_participants sp
    where sp.session_id = reviews.session_id
      and sp.user_id = reviews.to_user_id
      and coalesce(sp.waitlist, false) = false
  )
);
drop policy if exists "Score history viewable by everyone" on public.score_history;
create policy "Score history viewable by everyone" on public.score_history for select using (true);

drop policy if exists "Court partners public" on public.court_partners;
create policy "Court partners public" on public.court_partners for select using (is_active = true);
drop policy if exists "Bookings viewable by owner" on public.court_bookings;
create policy "Bookings viewable by owner" on public.court_bookings for select using (auth.uid() = user_id or auth.role() = 'service_role');
drop policy if exists "Authenticated users can create bookings" on public.court_bookings;
create policy "Authenticated users can create bookings" on public.court_bookings for insert with check (auth.role() = 'authenticated' and auth.uid() = user_id);
drop policy if exists "Users can update own bookings" on public.court_bookings;
create policy "Users can update own bookings" on public.court_bookings for update using (auth.uid() = user_id);
drop policy if exists "Earnings admin only" on public.earnings;
create policy "Earnings admin only" on public.earnings for select using (auth.role() = 'service_role');

-- ============================================================
-- Auth profile trigger
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, name, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  )
  on conflict (id) do update set
    email = excluded.email,
    name = coalesce(public.users.name, excluded.name),
    full_name = coalesce(public.users.full_name, excluded.full_name);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Backfill profiles for already-created auth users.
insert into public.users (id, email, name, full_name)
select
  au.id,
  au.email,
  coalesce(au.raw_user_meta_data->>'name', split_part(au.email, '@', 1)),
  coalesce(au.raw_user_meta_data->>'name', split_part(au.email, '@', 1))
from auth.users au
on conflict (id) do nothing;

-- ============================================================
-- Helper functions
-- ============================================================

create or replace function public.handle_session_join()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session record;
  v_joiner_name text;
begin
  select * into v_session from public.sessions where id = new.session_id limit 1;
  select coalesce(name, email, 'Ein Spieler') into v_joiner_name from public.users where id = new.user_id;

  if v_session.creator_id is null or v_session.creator_id = new.user_id then
    return new;
  end if;

  insert into public.notifications (user_id, message, type, session_id)
  values (
    v_session.creator_id,
    coalesce(v_joiner_name, 'Ein Spieler') || ' ist deiner Session "' || coalesce(v_session.title, 'Session') || '" beigetreten.',
    'join',
    new.session_id
  );
  return new;
end;
$$;

drop trigger if exists on_session_join on public.session_participants;
create trigger on_session_join
  after insert on public.session_participants
  for each row execute procedure public.handle_session_join();

create or replace function public.delete_session(p_session_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.sessions where id = p_session_id and creator_id = auth.uid()
  ) then
    raise exception 'Keine Berechtigung';
  end if;
  delete from public.sessions where id = p_session_id;
end;
$$;
grant execute on function public.delete_session(uuid) to authenticated;

create or replace function public.update_session(
  p_session_id uuid,
  p_title text,
  p_sport text,
  p_date date,
  p_time time,
  p_location text,
  p_address text,
  p_max_players int,
  p_gender_filter text,
  p_skill_level text,
  p_description text,
  p_equipment boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.sessions where id = p_session_id and creator_id = auth.uid()
  ) then
    raise exception 'Keine Berechtigung';
  end if;

  update public.sessions set
    title = p_title,
    sport = p_sport,
    date = p_date,
    time = p_time,
    location = p_location,
    address = p_address,
    max_players = p_max_players,
    gender_filter = p_gender_filter,
    skill_level = p_skill_level,
    description = p_description,
    equipment = p_equipment
  where id = p_session_id;
end;
$$;
grant execute on function public.update_session(uuid, text, text, date, time, text, text, int, text, text, text, boolean) to authenticated;

create or replace function public.cleanup_expired_sessions()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.sessions where date < current_date;
end;
$$;
grant execute on function public.cleanup_expired_sessions() to authenticated;

create or replace function public.claim_equipment(p_item_id uuid, p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session_id uuid;
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'Keine Berechtigung';
  end if;

  select session_id into v_session_id
  from public.equipment_items
  where id = p_item_id;

  if v_session_id is null then
    raise exception 'Ausrüstung nicht gefunden';
  end if;

  if not exists (
    select 1
    from public.session_participants sp
    where sp.session_id = v_session_id
      and sp.user_id = auth.uid()
      and coalesce(sp.waitlist, false) = false
  ) and not exists (
    select 1
    from public.sessions s
    where s.id = v_session_id
      and s.creator_id = auth.uid()
  ) then
    raise exception 'Nur Teilnehmer können Ausrüstung beanspruchen';
  end if;

  update public.equipment_items
  set brought_by = p_user_id
  where id = p_item_id and brought_by is null;
end;
$$;
grant execute on function public.claim_equipment(uuid, uuid) to authenticated;

create or replace function public.unclaim_equipment(p_item_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Nicht angemeldet';
  end if;

  update public.equipment_items
  set brought_by = null
  where id = p_item_id and brought_by = auth.uid();
end;
$$;
grant execute on function public.unclaim_equipment(uuid) to authenticated;

create or replace function public.accept_join_request(p_request_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_req record;
begin
  select jr.* into v_req
  from public.join_requests jr
  join public.sessions s on s.id = jr.session_id
  where jr.id = p_request_id and s.creator_id = auth.uid();

  if v_req.id is null then
    raise exception 'Anfrage nicht gefunden';
  end if;

  insert into public.session_participants (session_id, user_id, waitlist)
  values (v_req.session_id, v_req.user_id, false)
  on conflict (session_id, user_id) do update set waitlist = false;

  update public.join_requests set status = 'accepted' where id = p_request_id;
end;
$$;
grant execute on function public.accept_join_request(uuid) to authenticated;

create or replace function public.reject_join_request(p_request_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.join_requests jr
  set status = 'rejected'
  from public.sessions s
  where jr.id = p_request_id and s.id = jr.session_id and s.creator_id = auth.uid();
end;
$$;
grant execute on function public.reject_join_request(uuid) to authenticated;

create or replace function public.calculate_ranking_score(p_user_id uuid)
returns integer
language plpgsql
stable
as $$
declare
  v_user record;
begin
  select * into v_user from public.users where id = p_user_id;
  return round(
    (coalesce(v_user.mvp_count, 0) * 25 * 0.25) +
    (coalesce(v_user.high_fives_received, 0) * 15 * 0.15) +
    (coalesce(v_user.reliability_score, 50) * 0.30) +
    (least(coalesce(v_user.sessions_played, 0), 100) * 0.10) +
    (coalesce(v_user.avg_rating, 0) * 20 * 0.20)
  )::integer;
end;
$$;

create or replace function public.get_tier_from_score(p_score int)
returns text
language plpgsql
immutable
as $$
begin
  if p_score >= 5000 then
    return 'Platin';
  elsif p_score >= 3000 then
    return 'Gold';
  elsif p_score >= 1500 then
    return 'Silber';
  else
    return 'Bronze';
  end if;
end;
$$;

create or replace function public.get_user_ranking(p_sport text default null, p_city text default null)
returns table(
  rank bigint,
  user_id uuid,
  name text,
  avatar_url text,
  city text,
  score int,
  tier text,
  mvp_count int,
  high_fives_received int,
  sessions_played int,
  reliability_score float,
  avg_rating float
)
language plpgsql
as $$
begin
  return query
  select
    row_number() over (order by public.calculate_ranking_score(u.id) desc) as rank,
    u.id,
    coalesce(u.full_name, u.name) as name,
    u.avatar_url,
    u.city,
    public.calculate_ranking_score(u.id) as score,
    public.get_tier_from_score(public.calculate_ranking_score(u.id)) as tier,
    coalesce(u.mvp_count, 0),
    coalesce(u.high_fives_received, 0),
    coalesce(u.sessions_played, 0),
    coalesce(u.reliability_score, 50),
    coalesce(u.avg_rating, 0)
  from public.users u
  where (p_sport is null or p_sport = any(u.sports))
    and (p_city is null or u.city ilike '%' || p_city || '%')
  order by score desc;
end;
$$;
grant execute on function public.get_user_ranking(text, text) to authenticated, anon;

create or replace function public.get_my_ranking(p_user_id uuid, p_sport text default null)
returns table(my_rank bigint, my_score int, my_tier text, rank_change int)
language plpgsql
as $$
declare
  v_current_rank bigint;
  v_current_score int;
begin
  select rank, score into v_current_rank, v_current_score
  from public.get_user_ranking(p_sport, null)
  where user_id = p_user_id;

  return query select
    v_current_rank,
    v_current_score,
    public.get_tier_from_score(coalesce(v_current_score, 0)),
    0::int;
end;
$$;
grant execute on function public.get_my_ranking(uuid, text) to authenticated;

create or replace function public.submit_review(
  p_session_id uuid,
  p_to_user_id uuid,
  p_is_mvp boolean default false,
  p_high_five boolean default false
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Nicht angemeldet';
  end if;

  if auth.uid() = p_to_user_id then
    raise exception 'Du kannst dich nicht selbst bewerten';
  end if;

  if not exists (
    select 1
    from public.session_participants sp
    where sp.session_id = p_session_id
      and sp.user_id = auth.uid()
      and coalesce(sp.waitlist, false) = false
  ) then
    raise exception 'Nur Teilnehmer können bewerten';
  end if;

  if not exists (
    select 1
    from public.session_participants sp
    where sp.session_id = p_session_id
      and sp.user_id = p_to_user_id
      and coalesce(sp.waitlist, false) = false
  ) then
    raise exception 'Bewerteter Nutzer ist kein Teilnehmer';
  end if;

  insert into public.reviews (session_id, from_user_id, to_user_id, is_mvp, high_five)
  values (p_session_id, auth.uid(), p_to_user_id, p_is_mvp, p_high_five)
  on conflict (session_id, from_user_id, to_user_id) do update set
    is_mvp = excluded.is_mvp,
    high_five = excluded.high_five;
end;
$$;
grant execute on function public.submit_review(uuid, uuid, boolean, boolean) to authenticated;

create or replace function public.finalize_session_scores(p_session_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Nicht angemeldet';
  end if;

  if not exists (
    select 1
    from public.session_participants sp
    where sp.session_id = p_session_id
      and sp.user_id = auth.uid()
      and coalesce(sp.waitlist, false) = false
  ) and not exists (
    select 1
    from public.sessions s
    where s.id = p_session_id
      and s.creator_id = auth.uid()
  ) then
    raise exception 'Nur Teilnehmer können Scores aktualisieren';
  end if;

  update public.users u
  set
    mvp_count = (
      select count(distinct r.session_id)::int
      from public.reviews r
      where r.to_user_id = u.id
        and r.is_mvp = true
    ),
    high_fives_received = (
      select count(*)::int
      from public.reviews r
      where r.to_user_id = u.id
        and r.high_five = true
    ),
    sessions_played = (
      select count(distinct sp.session_id)::int
      from public.session_participants sp
      join public.sessions s on s.id = sp.session_id
      where sp.user_id = u.id
        and coalesce(sp.waitlist, false) = false
        and s.date <= current_date
    ),
    avg_rating = (
      select coalesce(avg(r.rating)::float, 0)
      from public.reviews r
      where r.to_user_id = u.id
        and r.rating is not null
    ),
    last_activity = now()
  where u.id in (
    select sp.user_id
    from public.session_participants sp
    where sp.session_id = p_session_id
      and coalesce(sp.waitlist, false) = false
    union
    select r.to_user_id
    from public.reviews r
    where r.session_id = p_session_id
  );
end;
$$;
grant execute on function public.finalize_session_scores(uuid) to authenticated;

-- Booking commission helpers
create or replace function public.calculate_booking_commission()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_commission_rate float;
  v_commission_amount integer;
begin
  select commission_rate into v_commission_rate
  from public.court_partners
  where id = new.partner_id;

  v_commission_rate := coalesce(v_commission_rate, 0.15);
  v_commission_amount := round(coalesce(new.price_cents, 0) * v_commission_rate)::int;

  insert into public.earnings (booking_id, partner_id, commission_amount_cents, commission_rate, status)
  values (new.id, new.partner_id, v_commission_amount, v_commission_rate, 'pending');
  return new;
end;
$$;

drop trigger if exists on_booking_calculate_commission on public.court_bookings;
create trigger on_booking_calculate_commission
  after insert on public.court_bookings
  for each row execute procedure public.calculate_booking_commission();

-- ============================================================
-- Avatar storage
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do update
set public = true,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Avatar images are publicly readable" on storage.objects;
create policy "Avatar images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "Users can upload own avatar" on storage.objects;
create policy "Users can upload own avatar"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.role() = 'authenticated');

drop policy if exists "Users can update own avatar" on storage.objects;
create policy "Users can update own avatar"
  on storage.objects for update
  using (bucket_id = 'avatars' and auth.role() = 'authenticated');

drop policy if exists "Users can delete own avatar" on storage.objects;
create policy "Users can delete own avatar"
  on storage.objects for delete
  using (bucket_id = 'avatars' and auth.role() = 'authenticated');

-- Refresh PostgREST schema cache.
notify pgrst, 'reload schema';

-- ============================================================
-- Done
-- ============================================================
