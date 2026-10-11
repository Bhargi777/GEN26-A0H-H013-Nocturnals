-- Rooms booking, event guards, canteen ordering and notifications.
-- All writes that need cross-user checks go through SECURITY DEFINER functions;
-- tables keep RLS on, so the browser client can never bypass it.

-- ============================================================================
-- Helpers
-- ============================================================================
create or replace function public.my_role() returns user_role
language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid()
$$;

create or replace function public.ist_now() returns timestamp
language sql stable as $$ select now() at time zone 'Asia/Kolkata' $$;

create or replace function public.notify_user(p_user uuid, p_title text, p_body text, p_link text)
returns void language sql security definer set search_path = public as $$
  insert into notifications (user_id, title, body, link)
  select p_user, p_title, p_body, p_link where p_user is not null
$$;

create or replace function public.notify_roles(p_roles user_role[], p_title text, p_body text, p_link text)
returns void language sql security definer set search_path = public as $$
  insert into notifications (user_id, title, body, link)
  select id, p_title, p_body, p_link from profiles where role = any(p_roles)
$$;

revoke all on function public.notify_user(uuid, text, text, text) from public, anon, authenticated;
revoke all on function public.notify_roles(user_role[], text, text, text) from public, anon, authenticated;

-- Users may only mark their own notifications read; inserts come from triggers
drop policy if exists "Users can manage their own notifications" on notifications;
create policy "Users read own notifications" on notifications for select to authenticated using (user_id = auth.uid());
create policy "Users update own notifications" on notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Users could update their own profile row, including role. Only admins change these columns.
create or replace function public.profiles_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and my_role() is distinct from 'admin'
     and (new.role is distinct from old.role or new.department_id is distinct from old.department_id
          or new.club_id is distinct from old.club_id or new.email is distinct from old.email) then
    raise exception 'Only an administrator can change role, department, club or email.';
  end if;
  return new;
end $$;
drop trigger if exists profiles_guard on profiles;
create trigger profiles_guard before update on profiles for each row execute procedure profiles_guard();

-- ============================================================================
-- Rooms
-- ============================================================================
drop policy if exists "CRs see room bookings for their block" on room_bookings;
drop policy if exists "Dept office can update bookings for their block" on room_bookings;

create policy "Requester or owning department reads bookings" on room_bookings for select to authenticated using (
  requested_by = auth.uid()
  or exists (
    select 1 from profiles me
    where me.id = auth.uid() and me.role = 'admin'
  )
  or exists (
    select 1
    from profiles me
    join rooms r on r.id = room_bookings.room_id
    join floors f on f.id = r.floor_id
    join blocks b on b.id = f.block_id
    where me.id = auth.uid() and me.role in ('dept_office', 'dept_head') and b.owner_department_id = me.department_id
  )
);

-- Per-period state of a room on one date: CLASS, BOOKED, PENDING or FREE
create or replace function public.room_slot_status(p_room uuid, p_date date)
returns table (period_id uuid, state text)
language sql stable security definer set search_path = public as $$
  select p.id,
    case
      when exists (
        select 1 from timetable_entries t
        where t.room_id = p_room and t.period_id = p.id and t.weekday = extract(dow from p_date)::int
          and not exists (select 1 from class_cancellations c where c.timetable_entry_id = t.id and c.date = p_date)
      ) then 'CLASS'
      when exists (select 1 from room_bookings b where b.room_id = p_room and b.date = p_date and b.period_id = p.id and b.status = 'APPROVED') then 'BOOKED'
      when exists (select 1 from room_bookings b where b.room_id = p_room and b.date = p_date and b.period_id = p.id and b.status = 'PENDING') then 'PENDING'
      else 'FREE'
    end
  from periods p
  order by p.start_time
$$;

-- One period across every room of a floor, for the floor plan: CLASS, BOOKED, PENDING, FREE or CLOSED
create or replace function public.floor_availability(p_floor uuid, p_date date, p_period uuid)
returns table (room_id uuid, state text)
language sql stable security definer set search_path = public as $$
  select r.id,
    case
      when not coalesce(r.bookable, false) then 'CLOSED'
      when exists (
        select 1 from timetable_entries t
        where t.room_id = r.id and t.period_id = p_period and t.weekday = extract(dow from p_date)::int
          and not exists (select 1 from class_cancellations c where c.timetable_entry_id = t.id and c.date = p_date)
      ) then 'CLASS'
      when exists (select 1 from room_bookings b where b.room_id = r.id and b.date = p_date and b.period_id = p_period and b.status = 'APPROVED') then 'BOOKED'
      when exists (select 1 from room_bookings b where b.room_id = r.id and b.date = p_date and b.period_id = p_period and b.status = 'PENDING') then 'PENDING'
      else 'FREE'
    end
  from rooms r where r.floor_id = p_floor
$$;
grant execute on function public.floor_availability(uuid, date, uuid) to authenticated;

create or replace function public.request_room_booking(
  p_room uuid, p_date date, p_period uuid, p_reason text, p_faculty_name text, p_attendees int
) returns room_bookings
language plpgsql security definer set search_path = public as $$
declare
  v_role user_role := my_role();
  v_room rooms;
  v_period periods;
  v_state text;
  v_dept uuid;
  v_row room_bookings;
  v_today date := ist_now()::date;
begin
  if auth.uid() is null then raise exception 'Sign in to request a room.'; end if;
  if v_role not in ('faculty', 'cr', 'admin') then
    raise exception 'Only faculty and class representatives can request rooms.';
  end if;
  if coalesce(trim(p_reason), '') = '' then raise exception 'Enter a reason for the booking.'; end if;
  if coalesce(trim(p_faculty_name), '') = '' then raise exception 'Enter the faculty name.'; end if;

  select * into v_room from rooms where id = p_room;
  if not found or not coalesce(v_room.bookable, false) or v_room.floor_id is null then
    raise exception 'This room cannot be booked.';
  end if;
  if p_attendees is null or p_attendees < 1 then raise exception 'Enter the number of attendees.'; end if;
  if v_room.capacity is not null and p_attendees > v_room.capacity then
    raise exception 'This room seats %, but % attendees were entered.', v_room.capacity, p_attendees;
  end if;

  if p_date < v_today or p_date > v_today + 14 then
    raise exception 'Choose a date from today up to 14 days ahead.';
  end if;
  select * into v_period from periods where id = p_period;
  if not found then raise exception 'Choose a period.'; end if;
  if p_date = v_today and v_period.end_time <= ist_now()::time then
    raise exception 'This period has already ended today.';
  end if;

  select state into v_state from room_slot_status(p_room, p_date) where period_id = p_period;
  if v_state = 'CLASS' then raise exception 'A scheduled class uses this room in this period.'; end if;
  if v_state = 'BOOKED' then raise exception 'This room is already booked for this period.'; end if;
  if exists (
    select 1 from room_bookings
    where room_id = p_room and date = p_date and period_id = p_period and requested_by = auth.uid() and status = 'PENDING'
  ) then
    raise exception 'You already have a pending request for this slot.';
  end if;

  insert into room_bookings (room_id, date, period_id, requested_by, reason, faculty_name, attendees)
  values (p_room, p_date, p_period, auth.uid(), trim(p_reason), trim(p_faculty_name), p_attendees)
  returning * into v_row;

  select b.owner_department_id into v_dept
  from floors f join blocks b on b.id = f.block_id where f.id = v_room.floor_id;
  insert into notifications (user_id, title, body, link)
  select id, 'New room request ' || v_row.code,
    v_room.name || ' on ' || to_char(p_date, 'DD Mon') || ', ' || v_period.label || '.', '/rooms/dept'
  from profiles where role in ('dept_office', 'dept_head') and department_id = v_dept;

  return v_row;
end $$;

create or replace function public.decide_room_booking(p_id uuid, p_approve boolean, p_note text default null)
returns room_bookings
language plpgsql security definer set search_path = public as $$
declare
  v_me profiles;
  v_booking room_bookings;
  v_owner uuid;
  v_row room_bookings;
begin
  select * into v_me from profiles where id = auth.uid();
  if not found or v_me.role not in ('dept_office', 'dept_head', 'admin') then
    raise exception 'Only department staff can decide room requests.';
  end if;
  select * into v_booking from room_bookings where id = p_id for update;
  if not found then raise exception 'Request not found.'; end if;
  if v_booking.status <> 'PENDING' then raise exception 'This request has already been decided.'; end if;

  select b.owner_department_id into v_owner
  from rooms r join floors f on f.id = r.floor_id join blocks b on b.id = f.block_id
  where r.id = v_booking.room_id;
  if v_me.role <> 'admin' and v_me.department_id is distinct from v_owner then
    raise exception 'This room belongs to another department.';
  end if;

  if p_approve then
    update room_bookings
      set status = 'REJECTED', decided_by = auth.uid(), decision_note = 'Slot allocated to another request'
      where room_id = v_booking.room_id and date = v_booking.date and period_id = v_booking.period_id
        and status = 'PENDING' and id <> p_id;
    begin
      update room_bookings
        set status = 'APPROVED', decided_by = auth.uid(), decision_note = nullif(trim(coalesce(p_note, '')), '')
        where id = p_id returning * into v_row;
    exception when unique_violation then
      raise exception 'This slot is already booked.';
    end;
  else
    if coalesce(trim(p_note), '') = '' then raise exception 'Enter a reason for rejecting.'; end if;
    update room_bookings
      set status = 'REJECTED', decided_by = auth.uid(), decision_note = trim(p_note)
      where id = p_id returning * into v_row;
  end if;
  return v_row;
end $$;

create or replace function public.cancel_room_booking(p_id uuid)
returns room_bookings
language plpgsql security definer set search_path = public as $$
declare v_row room_bookings;
begin
  update room_bookings set status = 'CANCELLED'
    where id = p_id and requested_by = auth.uid() and status in ('PENDING', 'APPROVED')
    returning * into v_row;
  if not found then raise exception 'This request cannot be cancelled.'; end if;
  return v_row;
end $$;

create or replace function public.room_booking_notify() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from old.status and new.status in ('APPROVED', 'REJECTED') then
    perform notify_user(new.requested_by,
      'Room request ' || new.code || ' ' || lower(new.status),
      coalesce(new.decision_note, 'Your room request was ' || lower(new.status) || '.'),
      '/rooms/my-requests');
  end if;
  return new;
end $$;
drop trigger if exists room_booking_notify on room_bookings;
create trigger room_booking_notify after update on room_bookings for each row execute procedure room_booking_notify();

-- ============================================================================
-- Events: RLS and transition guard
-- ============================================================================
create policy "Everyone can read clubs" on clubs for select to authenticated using (true);

drop policy if exists "Club presidents see their own event requests" on event_requests;
create policy "Requesters see their own event requests" on event_requests for select to authenticated using (requested_by = auth.uid());

drop policy if exists "Club presidents create event requests" on event_requests;
create policy "Club presidents create event requests" on event_requests for insert to authenticated with check (
  requested_by = auth.uid() and status = 'SUBMITTED'
  and exists (select 1 from profiles where id = auth.uid() and role in ('club_president', 'admin'))
);

drop policy if exists "Reviewers and requester update event requests" on event_requests;
create policy "Reviewers and requester update event requests" on event_requests for update to authenticated using (
  requested_by = auth.uid()
  or exists (select 1 from profiles where id = auth.uid() and role in ('osa', 'campus_director', 'events_dept', 'admin'))
);

create or replace function public.event_request_guard() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_role user_role;
begin
  if new.status = old.status or auth.uid() is null then return new; end if;
  v_role := my_role();
  if v_role = 'admin' then return new; end if;
  if v_role = 'osa' and old.status = 'SUBMITTED' and new.status in ('PENDING_DIRECTOR', 'REJECTED', 'CHANGES_REQUESTED') then return new; end if;
  if v_role = 'campus_director' and old.status = 'PENDING_DIRECTOR' and new.status in ('APPROVED', 'REJECTED') then return new; end if;
  if v_role = 'events_dept' and old.status = 'APPROVED' and new.status = 'CALENDARED' then return new; end if;
  if old.requested_by = auth.uid() and old.status = 'CHANGES_REQUESTED' and new.status = 'SUBMITTED' then return new; end if;
  raise exception 'You cannot move an event from % to %.', old.status, new.status;
end $$;
drop trigger if exists event_request_guard on event_requests;
create trigger event_request_guard before update on event_requests for each row execute procedure event_request_guard();

create or replace function public.event_request_notify() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    perform notify_roles(array['osa']::user_role[], 'New event request ' || new.code, new.title, '/events/review');
    return new;
  end if;
  if new.status is distinct from old.status then
    perform notify_user(new.requested_by,
      'Event ' || new.code || ': ' || replace(lower(new.status::text), '_', ' '),
      coalesce(new.decision_note, new.title), '/events/mine');
    if new.status = 'PENDING_DIRECTOR' then
      perform notify_roles(array['campus_director']::user_role[], 'Event awaiting approval ' || new.code, new.title, '/events/director');
    elsif new.status = 'APPROVED' then
      perform notify_roles(array['events_dept']::user_role[], 'Approved event to calendar ' || new.code, new.title, '/events/calendar');
    elsif new.status = 'SUBMITTED' then
      perform notify_roles(array['osa']::user_role[], 'Event resubmitted ' || new.code, new.title, '/events/review');
    end if;
  end if;
  return new;
end $$;
drop trigger if exists event_request_notify on event_requests;
create trigger event_request_notify after insert or update on event_requests for each row execute procedure event_request_notify();

-- ============================================================================
-- Canteen
-- ============================================================================
create policy "Staff read order items" on order_items for select to authenticated using (
  exists (select 1 from orders o where o.id = order_items.order_id and o.user_id = auth.uid())
  or exists (select 1 from profiles where id = auth.uid() and role in ('canteen_kitchen', 'canteen_counter', 'canteen_manager', 'admin'))
);
drop policy if exists "Canteen staff can view orders for their canteen" on orders;
create policy "Canteen staff can view orders" on orders for select to authenticated using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('canteen_kitchen', 'canteen_counter', 'canteen_manager', 'admin'))
);
-- Orders are created and moved only through place_order / advance_order
drop policy if exists "Students can place orders" on orders;

create policy "Manager manages menu" on menu_items for all to authenticated
  using (exists (select 1 from profiles where id = auth.uid() and role in ('canteen_manager', 'admin')))
  with check (exists (select 1 from profiles where id = auth.uid() and role in ('canteen_manager', 'admin')));
create policy "Manager manages slots" on canteen_slots for all to authenticated
  using (exists (select 1 from profiles where id = auth.uid() and role in ('canteen_manager', 'admin')))
  with check (exists (select 1 from profiles where id = auth.uid() and role in ('canteen_manager', 'admin')));

create or replace function public.place_order(p_canteen uuid, p_slot uuid, p_items jsonb)
returns orders
language plpgsql security definer set search_path = public as $$
declare
  v_canteen canteens;
  v_slot canteen_slots;
  v_now timestamp := ist_now();
  v_start timestamp;
  v_end timestamp;
  v_total numeric(12, 2) := 0;
  v_count int;
  v_token text;
  v_order orders;
  v_line record;
  v_item menu_items;
begin
  if auth.uid() is null then raise exception 'Sign in to place an order.'; end if;
  if my_role() in ('canteen_kitchen', 'canteen_counter', 'canteen_manager') then
    raise exception 'Canteen staff cannot place orders.';
  end if;
  select * into v_canteen from canteens where id = p_canteen;
  if not found then raise exception 'Canteen not found.'; end if;
  select * into v_slot from canteen_slots where id = p_slot and canteen_id = p_canteen;
  if not found then raise exception 'Choose a pickup slot.'; end if;

  v_start := v_slot.slot_date + v_slot.start_time;
  v_end := v_slot.slot_date + v_slot.end_time;
  if v_start < v_now + interval '15 minutes' then raise exception 'Pickup must start at least 15 minutes from now.'; end if;
  if v_end > v_now + interval '60 minutes' then raise exception 'Pickup must end within 60 minutes from now.'; end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Add at least one item to your order.';
  end if;

  perform pg_advisory_xact_lock(hashtext('canteen-order-' || p_canteen::text));

  select count(*) into v_count from orders where slot_id = p_slot and status <> 'FORFEITED';
  if v_count >= v_slot.capacity then raise exception 'This slot is full. Choose another slot.'; end if;

  for v_line in select (e->>'item_id')::uuid as item_id, (e->>'quantity')::int as quantity from jsonb_array_elements(p_items) e loop
    if v_line.quantity is null or v_line.quantity < 1 or v_line.quantity > 20 then
      raise exception 'Quantity must be between 1 and 20.';
    end if;
    select * into v_item from menu_items where id = v_line.item_id and canteen_id = p_canteen;
    if not found then raise exception 'An item is not on this canteen''s menu.'; end if;
    if not v_item.available then raise exception '% is not available right now.', v_item.name; end if;
    v_total := v_total + v_item.price * v_line.quantity;
  end loop;

  select count(*) + 1 into v_count from orders
    where canteen_id = p_canteen and (created_at at time zone 'Asia/Kolkata')::date = v_now::date;
  v_token := v_canteen.code || '-' || lpad(v_count::text, 3, '0');

  insert into orders (token, canteen_id, user_id, slot_id, total)
  values (v_token, p_canteen, auth.uid(), p_slot, v_total) returning * into v_order;

  insert into order_items (order_id, item_id, quantity, unit_price)
  select v_order.id, (e->>'item_id')::uuid, (e->>'quantity')::int, m.price
  from jsonb_array_elements(p_items) e join menu_items m on m.id = (e->>'item_id')::uuid;

  return v_order;
end $$;

-- How many live orders each slot holds (RLS hides other users' orders, so this is definer-side)
create or replace function public.canteen_slot_load(p_canteen uuid, p_date date)
returns table (slot_id uuid, taken int)
language sql stable security definer set search_path = public as $$
  select s.id, (select count(*)::int from orders o where o.slot_id = s.id and o.status <> 'FORFEITED')
  from canteen_slots s where s.canteen_id = p_canteen and s.slot_date = p_date
$$;
grant execute on function public.canteen_slot_load(uuid, date) to authenticated;

-- Staff move orders along: counter PLACED->PAID and READY->COLLECTED, kitchen PAID->READY
create or replace function public.advance_order(p_id uuid, p_to order_status)
returns orders
language plpgsql security definer set search_path = public as $$
declare
  v_role user_role := my_role();
  v_order orders;
  v_ok boolean;
begin
  select * into v_order from orders where id = p_id for update;
  if not found then raise exception 'Order not found.'; end if;
  v_ok := v_role in ('canteen_manager', 'admin')
    or (v_role = 'canteen_counter' and ((v_order.status = 'PLACED' and p_to = 'PAID') or (v_order.status = 'READY' and p_to = 'COLLECTED')))
    or (v_role = 'canteen_kitchen' and v_order.status = 'PAID' and p_to = 'READY');
  if not v_ok then raise exception 'You cannot move an order from % to %.', v_order.status, p_to; end if;
  update orders set status = p_to,
    paid_at = case when p_to = 'PAID' then now() else paid_at end,
    collected_at = case when p_to = 'COLLECTED' then now() else collected_at end
    where id = p_id returning * into v_order;
  return v_order;
end $$;

-- Unpaid orders whose pickup slot has ended are forfeited
create or replace function public.forfeit_unpaid_orders() returns int
language plpgsql security definer set search_path = public as $$
declare v_count int;
begin
  if my_role() not in ('canteen_counter', 'canteen_manager', 'admin') then raise exception 'Not allowed.'; end if;
  update orders o set status = 'FORFEITED'
    from canteen_slots s
    where s.id = o.slot_id and o.status = 'PLACED' and (s.slot_date + s.end_time) < ist_now();
  get diagnostics v_count = row_count;
  return v_count;
end $$;

create or replace function public.order_notify() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from old.status then
    if new.status = 'READY' then
      perform notify_user(new.user_id, 'Order ' || new.token || ' is ready', 'Collect it at the counter.', '/canteen/orders');
    elsif new.status = 'FORFEITED' then
      perform notify_user(new.user_id, 'Order ' || new.token || ' forfeited', 'The pickup slot ended before payment.', '/canteen/orders');
    end if;
  end if;
  return new;
end $$;
drop trigger if exists order_notify on orders;
create trigger order_notify after update on orders for each row execute procedure order_notify();

-- ============================================================================
-- Grants and realtime
-- ============================================================================
revoke execute on function public.request_room_booking(uuid, date, uuid, text, text, int) from public, anon;
revoke execute on function public.decide_room_booking(uuid, boolean, text) from public, anon;
revoke execute on function public.cancel_room_booking(uuid) from public, anon;
revoke execute on function public.place_order(uuid, uuid, jsonb) from public, anon;
revoke execute on function public.advance_order(uuid, order_status) from public, anon;
revoke execute on function public.forfeit_unpaid_orders() from public, anon;
grant execute on function public.request_room_booking(uuid, date, uuid, text, text, int) to authenticated;
grant execute on function public.decide_room_booking(uuid, boolean, text) to authenticated;
grant execute on function public.cancel_room_booking(uuid) to authenticated;
grant execute on function public.place_order(uuid, uuid, jsonb) to authenticated;
grant execute on function public.advance_order(uuid, order_status) to authenticated;
grant execute on function public.forfeit_unpaid_orders() to authenticated;
grant execute on function public.room_slot_status(uuid, date) to authenticated;
grant execute on function public.my_role() to authenticated;

do $$
declare t text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach t in array array['notifications', 'room_bookings', 'event_requests', 'orders', 'menu_items', 'canteen_slots'] loop
      if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
        execute format('alter publication supabase_realtime add table public.%I', t);
      end if;
    end loop;
  end if;
end $$;
