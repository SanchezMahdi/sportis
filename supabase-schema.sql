-- ============================================================
-- Sportis – Supabase Schema
-- Run this in your Supabase SQL editor to set up the database
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- TABLES
-- ============================================================

-- Users table (extends Supabase auth.users)
create table public.users (
  id uuid references auth.users on delete cascade not null primary key,
  name text not null,
  email text not null,
  city text,
  gender text,
  sports text[] default '{}',
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Sessions table
create table public.sessions (
  id uuid default uuid_generate_v4() primary key,
  creator_id uuid references public.users(id) on delete cascade not null,
  sport text not null,
  title text not null,
  description text,
  date date not null,
  time time not null,
  location text not null,
  address text,
  lat float8,
  lng float8,
  max_players int not null default 10,
  gender_filter text not null default 'Gemischt',
  skill_level text not null default 'Mittel',
  equipment boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Session participants
create table public.session_participants (
  id uuid default uuid_generate_v4() primary key,
  session_id uuid references public.sessions(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(session_id, user_id)
);

-- Messages
create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  session_id uuid references public.sessions(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  text text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Courts / Venues
create table public.courts (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  address text not null,
  lat float8,
  lng float8,
  sports text[] default '{}',
  indoor boolean default false,
  free boolean default true,
  photo_url text,
  added_by uuid references public.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Reported OSM venues (community blacklist)
create table public.reported_osm_venues (
  id uuid default uuid_generate_v4() primary key,
  osm_id text not null unique,
  name text,
  reported_by uuid references public.users(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.reported_osm_venues enable row level security;

create policy "Anyone can read reported venues"
  on public.reported_osm_venues for select using (true);

create policy "Authenticated users can report venues"
  on public.reported_osm_venues for insert with check (auth.role() = 'authenticated');

-- Notifications
create table public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  message text not null,
  type text not null default 'info',  -- 'join' | 'leave' | 'message' | 'info'
  session_id uuid references public.sessions(id) on delete cascade,
  read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Reports
create table public.reports (
  id uuid default uuid_generate_v4() primary key,
  reporter_id uuid references public.users(id) on delete cascade not null,
  reported_user_id uuid references public.users(id) on delete cascade not null,
  session_id uuid references public.sessions(id) on delete cascade,
  reason text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.users enable row level security;
alter table public.sessions enable row level security;
alter table public.session_participants enable row level security;
alter table public.messages enable row level security;
alter table public.courts enable row level security;

-- Users policies
create policy "Public profiles are viewable by everyone"
  on public.users for select using (true);

create policy "Users can insert their own profile"
  on public.users for insert with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.users for update using (auth.uid() = id);

-- Sessions policies
create policy "Sessions are viewable by everyone"
  on public.sessions for select using (true);

create policy "Authenticated users can create sessions"
  on public.sessions for insert with check (auth.role() = 'authenticated');

create policy "Creators can update their sessions"
  on public.sessions for update using (auth.uid() = creator_id);

create policy "Creators can delete their sessions"
  on public.sessions for delete using (auth.uid() = creator_id);

-- Session participants policies
create policy "Participants are viewable by everyone"
  on public.session_participants for select using (true);

create policy "Authenticated users can join sessions"
  on public.session_participants for insert with check (auth.role() = 'authenticated');

create policy "Users can leave sessions"
  on public.session_participants for delete using (auth.uid() = user_id);

-- Messages policies
create policy "Messages viewable by everyone"
  on public.messages for select using (true);

create policy "Authenticated users can send messages"
  on public.messages for insert with check (auth.role() = 'authenticated');

-- Courts policies
create policy "Courts viewable by everyone"
  on public.courts for select using (true);

create policy "Authenticated users can add courts"
  on public.courts for insert with check (auth.role() = 'authenticated');

alter table public.notifications enable row level security;
alter table public.reports enable row level security;

-- Notifications policies
create policy "Users can view their own notifications"
  on public.notifications for select using (auth.uid() = user_id);

create policy "System can insert notifications"
  on public.notifications for insert with check (true);

create policy "Users can mark their notifications as read"
  on public.notifications for update using (auth.uid() = user_id);

-- Reports policies
create policy "Authenticated users can submit reports"
  on public.reports for insert with check (auth.role() = 'authenticated');

create policy "Users can view their own reports"
  on public.reports for select using (auth.uid() = reporter_id);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Function to handle new user registration
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger: auto-create user profile on sign up
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function: notify session creator when someone joins
create or replace function public.handle_session_join()
returns trigger as $$
declare
  v_session record;
  v_joiner_name text;
begin
  select s.*, u.name into v_session
  from public.sessions s
  join public.users u on u.id = new.user_id
  where s.id = new.session_id
  limit 1;

  select name into v_joiner_name from public.users where id = new.user_id;

  -- Don't notify if creator joins their own session
  if v_session.creator_id = new.user_id then
    return new;
  end if;

  insert into public.notifications (user_id, message, type, session_id)
  values (
    v_session.creator_id,
    v_joiner_name || ' ist deiner Session "' || v_session.title || '" beigetreten.',
    'join',
    new.session_id
  );

  return new;
end;
$$ language plpgsql security definer;

create trigger on_session_join
  after insert on public.session_participants
  for each row execute procedure public.handle_session_join();
