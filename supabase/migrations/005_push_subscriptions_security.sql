-- Harden Web Push subscription storage.
-- Users can only manage their own browser push endpoints. Service-role Edge
-- Functions bypass RLS for delivery and stale-endpoint cleanup.

create table if not exists public.push_subscriptions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.push_subscriptions add column if not exists id uuid default uuid_generate_v4();
alter table public.push_subscriptions add column if not exists user_id uuid;
alter table public.push_subscriptions add column if not exists endpoint text;
alter table public.push_subscriptions add column if not exists p256dh text;
alter table public.push_subscriptions add column if not exists auth text;
alter table public.push_subscriptions add column if not exists created_at timestamp with time zone default timezone('utc'::text, now()) not null;
alter table public.push_subscriptions add column if not exists updated_at timestamp with time zone default timezone('utc'::text, now()) not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'push_subscriptions_user_endpoint_key'
  ) then
    alter table public.push_subscriptions
      add constraint push_subscriptions_user_endpoint_key unique (user_id, endpoint);
  end if;
end $$;

create index if not exists push_subscriptions_user_id_idx
  on public.push_subscriptions(user_id);

alter table public.push_subscriptions enable row level security;

drop policy if exists "Users can view own push subscriptions" on public.push_subscriptions;
create policy "Users can view own push subscriptions"
  on public.push_subscriptions for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own push subscriptions" on public.push_subscriptions;
create policy "Users can insert own push subscriptions"
  on public.push_subscriptions for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own push subscriptions" on public.push_subscriptions;
create policy "Users can update own push subscriptions"
  on public.push_subscriptions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own push subscriptions" on public.push_subscriptions;
create policy "Users can delete own push subscriptions"
  on public.push_subscriptions for delete
  using (auth.uid() = user_id);
