-- Campus report for admins, "find me a room", and faculty class cancellation.

-- Timetables are not secret: everyone signed in may read them (RLS was on with no policy, so clients saw nothing)
create policy "Everyone can read timetable" on timetable_entries for select to authenticated using (true);
create policy "Everyone can read class cancellations" on class_cancellations for select to authenticated using (true);

-- ---------------------------------------------------------------------------
-- Admin report: one jsonb document, so the page needs a single call
-- ---------------------------------------------------------------------------
create or replace function public.campus_report()
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare v_role user_role := my_role();
begin
  if v_role not in ('admin', 'campus_director') then raise exception 'Only administrators can view reports.'; end if;
  return jsonb_build_object(
    'tickets_by_category', coalesce((
      select jsonb_agg(jsonb_build_object(
        'category', category::text,
        'total', total, 'open', open_count, 'overdue', overdue,
        'avg_hours', avg_hours) order by total desc)
      from (
        select category, count(*) as total,
          count(*) filter (where status not in ('RESOLVED', 'CLOSED')) as open_count,
          count(*) filter (where
            (case when status in ('RESOLVED', 'CLOSED') and resolved_at is not null then resolved_at else now() end) - created_at >
            (case priority when 'URGENT' then interval '4 hours' when 'HIGH' then interval '24 hours' when 'MEDIUM' then interval '72 hours' else interval '7 days' end)
          ) as overdue,
          round((avg(extract(epoch from (resolved_at - created_at)) / 3600) filter (where resolved_at is not null))::numeric, 1) as avg_hours
        from service_tickets group by category
      ) t), '[]'::jsonb),
    'room_use_by_period', coalesce((
      select jsonb_agg(jsonb_build_object('period', p.label, 'approved', coalesce(b.n, 0), 'classes', coalesce(c.n, 0)) order by p.start_time)
      from periods p
      left join (select period_id, count(*) n from room_bookings where status = 'APPROVED' group by period_id) b on b.period_id = p.id
      left join (select period_id, count(*) n from timetable_entries group by period_id) c on c.period_id = p.id
    ), '[]'::jsonb),
    'room_requests', coalesce((select jsonb_object_agg(status, n) from (select status, count(*) n from room_bookings group by status) s), '{}'::jsonb),
    'canteen_by_hour', coalesce((
      select jsonb_agg(jsonb_build_object('hour', h, 'orders', n) order by h)
      from (select extract(hour from s.start_time)::int as h, count(*) n
            from orders o join canteen_slots s on s.id = o.slot_id where o.status <> 'FORFEITED' group by 1) x
    ), '[]'::jsonb),
    'canteen_totals', (select jsonb_build_object('orders', count(*), 'revenue', coalesce(sum(total) filter (where status in ('PAID', 'READY', 'COLLECTED')), 0)) from orders),
    'events_by_status', coalesce((select jsonb_object_agg(status, n) from (select status::text, count(*) n from event_requests group by status) s), '{}'::jsonb)
  );
end $$;
grant execute on function public.campus_report() to authenticated;

-- ---------------------------------------------------------------------------
-- Find me a room: free rooms that fit, tightest fit first
-- ---------------------------------------------------------------------------
create or replace function public.suggest_rooms(p_date date, p_period uuid, p_attendees int)
returns table (room_id uuid, room_name text, room_code text, floor_id uuid, block_id uuid, block_name text, floor_label text, capacity int, state text)
language sql stable security definer set search_path = public as $$
  select r.id, r.name, r.code, f.id, b.id, b.name, f.label, r.capacity, 'FREE'
  from rooms r
  join floors f on f.id = r.floor_id
  join blocks b on b.id = f.block_id
  where coalesce(r.bookable, false)
    and r.kind in ('classroom', 'lab', 'hall')
    and coalesce(r.capacity, 0) >= greatest(coalesce(p_attendees, 1), 1)
    and not exists (
      select 1 from timetable_entries t
      where t.room_id = r.id and t.period_id = p_period and t.weekday = extract(dow from p_date)::int
        and not exists (select 1 from class_cancellations c where c.timetable_entry_id = t.id and c.date = p_date)
    )
    and not exists (select 1 from room_bookings x where x.room_id = r.id and x.date = p_date and x.period_id = p_period and x.status in ('APPROVED', 'PENDING'))
  order by r.capacity asc, r.name
  limit 6
$$;
grant execute on function public.suggest_rooms(date, uuid, int) to authenticated;

-- ---------------------------------------------------------------------------
-- Faculty cancel one of their classes for one date; the room is free for that date
-- ---------------------------------------------------------------------------
create or replace function public.cancel_class(p_entry uuid, p_date date, p_reason text default null)
returns class_cancellations
language plpgsql security definer set search_path = public as $$
declare
  v_me profiles;
  v_entry timetable_entries;
  v_room rooms;
  v_row class_cancellations;
  v_today date := ist_now()::date;
begin
  select * into v_me from profiles where id = auth.uid();
  if not found then raise exception 'Sign in to cancel a class.'; end if;
  select * into v_entry from timetable_entries where id = p_entry;
  if not found then raise exception 'Class not found.'; end if;
  if v_me.role not in ('admin', 'dept_office', 'dept_head') and not (v_me.role = 'faculty' and v_me.full_name = v_entry.faculty_name) then
    raise exception 'You can only cancel your own classes.';
  end if;
  if p_date < v_today or p_date > v_today + 14 then raise exception 'Choose a date from today up to 14 days ahead.'; end if;
  if extract(dow from p_date)::int <> v_entry.weekday then raise exception 'This class does not meet on that weekday.'; end if;
  if exists (select 1 from class_cancellations where timetable_entry_id = p_entry and date = p_date) then raise exception 'This class is already cancelled for that date.'; end if;

  insert into class_cancellations (timetable_entry_id, date, cancelled_by, reason)
  values (p_entry, p_date, auth.uid(), nullif(trim(coalesce(p_reason, '')), '')) returning * into v_row;

  select * into v_room from rooms where id = v_entry.room_id;
  insert into notifications (user_id, title, body, link)
  select pr.id, 'Class cancelled: ' || v_entry.course,
    v_room.name || ' is free on ' || to_char(p_date, 'DD Mon') || ' (' || v_entry.section || ').', '/rooms'
  from profiles pr
  where pr.role = 'cr' and pr.section = v_entry.section;
  return v_row;
end $$;
grant execute on function public.cancel_class(uuid, date, text) to authenticated;
