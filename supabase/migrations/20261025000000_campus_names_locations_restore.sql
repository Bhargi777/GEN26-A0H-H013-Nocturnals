-- Campus naming, room map coordinates and reversible faculty class cancellations.
-- Existing rows are updated in place so deployed environments keep their IDs and history.

alter table public.rooms add column if not exists latitude double precision;
alter table public.rooms add column if not exists longitude double precision;

update public.canteens set code = 'IT', name = 'IT Canteen' where code = 'NORTH';
update public.canteens set code = 'MBA', name = 'MBA Canteen' where code = 'SOUTH';
update public.clubs set code = 'NATYA', name = 'Natya' where code = 'IEEE';
update public.profiles set full_name = 'Natya President' where email = 'ieee.president@example.edu';
update public.buildings set code = 'AB-3', name = 'AB-3' where code = 'RB';
update public.buildings set code = 'AB-2', name = 'AB-2' where code = 'FH';

update public.blocks set code = 'AB-3', name = 'AB-3' where code = 'RB-1';
update public.blocks set code = 'AB-2', name = 'AB-2' where code = 'FH-1';
insert into public.blocks (code, name, owner_department_id)
select v.code, v.name, d.id
from (values
  ('AB-1', 'AB-1', 'FAC'),
  ('AB-4', 'AB-4', 'IT'),
  ('MBA', 'MBA', 'SAO')
) as v(code, name, department_code)
join public.departments d on d.code = v.department_code
on conflict (code) do update set name = excluded.name, owner_department_id = excluded.owner_department_id;

update public.floors set label = case when level = 0 then 'Ground Floor' else 'Floor ' || level end;
insert into public.floors (block_id, level, label, grid_cols, grid_rows)
select b.id, levels.level, case when levels.level = 0 then 'Ground Floor' else 'Floor ' || levels.level end, 13, 3
from public.blocks b cross join generate_series(0, 3) as levels(level)
on conflict (block_id, level) do update set label = excluded.label;

-- Approximate campus points for event venues; replace with surveyed points when available.
update public.rooms set latitude = 10.9036046, longitude = 76.899696 where latitude is null;
update public.rooms set latitude = 10.90385, longitude = 76.89920 where code like 'RB-%' or code like 'AB-3-%';
update public.rooms set latitude = 10.90335, longitude = 76.89920 where code like 'FH-%' or code like 'AB-2-%';
update public.rooms set latitude = 10.90400, longitude = 76.90000 where code in ('AUD-MAIN', 'AUD-SEM-A', 'AUD-SEM-B');
update public.rooms set latitude = 10.90320, longitude = 76.90000 where code = 'SC-HALL';

drop function if exists public.campus_calendar(date, date);
create function public.campus_calendar(p_from date, p_to date)
returns table (id uuid, code text, title text, event_type text, club_name text, hall_name text, hall_latitude double precision, hall_longitude double precision, event_date date, start_time time, end_time time, status text)
language sql stable security definer set search_path = public as $$
  select e.id, e.code, e.title, e.event_type, c.name, h.name, h.latitude, h.longitude,
    e.event_date, e.start_time, e.end_time, e.status::text
  from event_requests e
  join clubs c on c.id = e.club_id
  left join rooms h on h.id = e.hall_id
  where e.status in ('APPROVED', 'CALENDARED') and e.event_date between p_from and p_to
  order by e.event_date, e.start_time
$$;
grant execute on function public.campus_calendar(date, date) to authenticated;

create or replace function public.restore_class(p_entry uuid, p_date date)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_me profiles;
  v_entry timetable_entries;
  v_today date := ist_now()::date;
begin
  select * into v_me from profiles where id = auth.uid();
  if not found then raise exception 'Sign in to restore a class.'; end if;
  select * into v_entry from timetable_entries where id = p_entry;
  if not found then raise exception 'Class not found.'; end if;
  if v_me.role not in ('admin', 'dept_office', 'dept_head') and not (v_me.role = 'faculty' and v_me.full_name = v_entry.faculty_name) then
    raise exception 'You can only restore your own classes.';
  end if;
  if p_date < v_today or p_date > v_today + 14 then raise exception 'Choose a date from today up to 14 days ahead.'; end if;
  if extract(dow from p_date)::int <> v_entry.weekday then raise exception 'This class does not meet on that weekday.'; end if;
  delete from class_cancellations where timetable_entry_id = p_entry and date = p_date;
  if not found then raise exception 'This class is not cancelled for that date.'; end if;
  insert into notifications (user_id, title, body, link)
  select pr.id, 'Class restored: ' || v_entry.course,
    'The class is scheduled again on ' || to_char(p_date, 'DD Mon') || ' (' || v_entry.section || ').', '/rooms/classes'
  from profiles pr where pr.role = 'cr' and pr.section = v_entry.section;
end $$;
grant execute on function public.restore_class(uuid, date) to authenticated;
