-- Service requests: demo story for seeded environments. Owner: Dev 3.
--
-- A student reports a broken projector, triage suggests AV_EQUIPMENT, the
-- ELEC dept admin assigns a technician, the technician resolves it and the
-- student confirms and rates it. Every status change goes through
-- transition_ticket as the person who would make it, so events and
-- notifications come from the real rules.
--
-- Only the database owner can run it. Call it from supabase/seed.sql after the
-- users, departments, buildings and rooms are seeded:
--   select public.svc_seed_demo_story();

create or replace function public.svc_seed_demo_story()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_title constant text := 'Projector not showing anything in Room 204';
  v_start constant timestamptz := now() - interval '3 days';
  v_dept uuid;
  v_student uuid;
  v_admin uuid;
  v_tech uuid;
  v_room uuid;
  v_building uuid;
  v_ticket uuid;
  v_code text;
begin
  if exists (select 1 from service_tickets where title = v_title) then
    return 'demo story already seeded';
  end if;

  select id into v_dept from departments where code = 'ELEC';
  select id into v_student from profiles where role = 'student' order by created_at, email limit 1;
  select id into v_admin from profiles
    where role = 'dept_admin' and department_id = v_dept order by created_at, email limit 1;
  select id into v_tech from profiles
    where role = 'technician' and department_id = v_dept order by created_at, email limit 1;
  select id, building_id into v_room, v_building from rooms order by name limit 1;

  if v_dept is null or v_student is null or v_admin is null or v_tech is null or v_room is null then
    return 'skipped: needs an ELEC department, a student, an ELEC dept_admin, an ELEC technician and a room';
  end if;

  -- 1. The student reports it. Triage suggested AV_EQUIPMENT with medium
  --    priority; the student kept the category and raised the priority.
  insert into service_tickets (
    requester_id, title, description, category, priority, building_id, room_id,
    location_note, assigned_department_id, ai_suggested_category,
    ai_suggested_priority, ai_confidence, created_at, updated_at
  ) values (
    v_student, v_title,
    'The projector turns on but shows no signal from the HDMI cable. There is a lecture here at 10 am.',
    'AV_EQUIPMENT', 'HIGH', v_building, v_room, 'Ceiling projector at the front of the room',
    v_dept, 'AV_EQUIPMENT', 'MEDIUM', 0.7, v_start, v_start
  )
  returning id, code into v_ticket, v_code;

  if not exists (select 1 from events where entity_type = 'ticket' and entity_id = v_ticket) then
    insert into events (entity_type, entity_id, actor_id, action, from_status, to_status, created_at)
    values ('ticket', v_ticket, v_student, 'created', null, 'OPEN', v_start);
  end if;

  -- 2. The dept admin assigns the technician.
  perform set_config('request.jwt.claim.sub', v_admin::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', v_admin, 'role', 'authenticated')::text, true);
  perform transition_ticket(p_ticket_id => v_ticket, p_to_status => 'ASSIGNED', p_assigned_to => v_tech);

  -- 3. The technician starts and resolves it.
  perform set_config('request.jwt.claim.sub', v_tech::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', v_tech, 'role', 'authenticated')::text, true);
  perform transition_ticket(p_ticket_id => v_ticket, p_to_status => 'IN_PROGRESS');
  perform transition_ticket(
    p_ticket_id => v_ticket,
    p_to_status => 'RESOLVED',
    p_note => 'Replaced the faulty HDMI cable and reset the projector input source.'
  );

  -- 4. The student confirms the fix and rates it.
  perform set_config('request.jwt.claim.sub', v_student::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', v_student, 'role', 'authenticated')::text, true);
  perform transition_ticket(
    p_ticket_id => v_ticket,
    p_to_status => 'CLOSED',
    p_rating => 5,
    p_feedback => 'Fixed before the lecture. Thank you.'
  );

  perform set_config('request.jwt.claim.sub', '', true);
  perform set_config('request.jwt.claims', '', true);

  -- Spread the story over a day and a half so the timeline reads naturally.
  update events e
  set created_at = v_start + step.delay
  from (values
    ('ASSIGNED', interval '2 hours'),
    ('IN_PROGRESS', interval '5 hours'),
    ('RESOLVED', interval '1 day 2 hours'),
    ('CLOSED', interval '1 day 6 hours')
  ) as step(status, delay)
  where e.entity_type = 'ticket' and e.entity_id = v_ticket and e.to_status = step.status;

  update service_tickets
  set resolved_at = v_start + interval '1 day 2 hours',
      closed_at = v_start + interval '1 day 6 hours',
      updated_at = v_start + interval '1 day 6 hours'
  where id = v_ticket;

  return 'seeded demo story ' || v_code;
end;
$$;

revoke all on function public.svc_seed_demo_story() from public, anon, authenticated;
