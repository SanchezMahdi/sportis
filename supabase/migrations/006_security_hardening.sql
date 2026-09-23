-- Harden high-risk client-accessible tables and RPCs.
-- Service-role Edge Functions and SECURITY DEFINER triggers continue to perform
-- system writes; browser clients get only the permissions they actually need.

-- Do not expose user email addresses through public profile reads.
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

-- Notifications are system-generated. Users may read/update/delete their own
-- notifications, but browser clients must not create arbitrary notifications.
drop policy if exists "System can insert notifications" on public.notifications;
revoke insert on public.notifications from anon, authenticated;

-- Messages may only be created by active participants of the target session.
drop policy if exists "Authenticated users can send messages" on public.messages;
create policy "Participants can send messages"
  on public.messages for insert
  with check (
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

-- Equipment claiming must go through the guarded RPCs below.
drop policy if exists "Participants can update equipment" on public.equipment_items;
revoke update on public.equipment_items from anon, authenticated;

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
  where id = p_item_id
    and brought_by is null;
end;
$$;

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
  where id = p_item_id
    and brought_by = auth.uid();
end;
$$;

grant execute on function public.claim_equipment(uuid, uuid) to authenticated;
grant execute on function public.unclaim_equipment(uuid) to authenticated;

-- Reviews must be tied to real participants and cannot target yourself.
drop policy if exists "Authenticated users can submit reviews" on public.reviews;
create policy "Participants can submit reviews"
  on public.reviews for insert
  with check (
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

-- Recalculate score counters from source rows instead of incrementing blindly.
-- This keeps the function idempotent when several participants submit votes.
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

grant execute on function public.submit_review(uuid, uuid, boolean, boolean) to authenticated;
grant execute on function public.finalize_session_scores(uuid) to authenticated;
