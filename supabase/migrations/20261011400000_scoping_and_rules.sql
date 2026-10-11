-- Per-canteen staff scoping, club president lock, ticket state machine,
-- item handover checks, the campus calendar and extra data validation.

-- ---------------------------------------------------------------------------
-- Staff belong to exactly one canteen
-- ---------------------------------------------------------------------------
alter table profiles add column if not exists canteen_id uuid references canteens(id) on delete set null;

create or replace function public.my_canteen() returns uuid
language sql stable security definer set search_path = public as $$
  select canteen_id from profiles where id = auth.uid()
$$;
grant execute on function public.my_canteen() to authenticated;

create or replace function public.profiles_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and my_role() is distinct from 'admin'
     and (new.role is distinct from old.role or new.department_id is distinct from old.department_id
          or new.club_id is distinct from old.club_id or new.canteen_id is distinct from old.canteen_id
          or new.email is distinct from old.email) then
    raise exception 'Only an administrator can change role, department, club, canteen or email.';
  end if;
  return new;
end $$;

-- Staff only see orders of their own canteen; admins see all
drop policy if exists "Canteen staff can view orders" on orders;
create policy "Canteen staff see own canteen orders" on orders for select to authenticated using (
  exists (select 1 from profiles p where p.id = auth.uid() and (
    p.role = 'admin' or (p.role in ('canteen_kitchen', 'canteen_counter', 'canteen_manager') and p.canteen_id = orders.canteen_id)))
);
drop policy if exists "Staff read order items" on order_items;
create policy "Staff read order items" on order_items for select to authenticated using (
  exists (select 1 from orders o where o.id = order_items.order_id and o.user_id = auth.uid())
  or exists (select 1 from orders o join profiles p on p.id = auth.uid() where o.id = order_items.order_id and (
    p.role = 'admin' or (p.role in ('canteen_kitchen', 'canteen_counter', 'canteen_manager') and p.canteen_id = o.canteen_id)))
);

-- A manager edits only their own canteen's menu and slots
drop policy if exists "Manager manages menu" on menu_items;
create policy "Manager manages own menu" on menu_items for all to authenticated
  using (exists (select 1 from profiles p where p.id = auth.uid() and (p.role = 'admin' or (p.role = 'canteen_manager' and p.canteen_id = menu_items.canteen_id))))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and (p.role = 'admin' or (p.role = 'canteen_manager' and p.canteen_id = menu_items.canteen_id))));
drop policy if exists "Manager manages slots" on canteen_slots;
create policy "Manager manages own slots" on canteen_slots for all to authenticated
  using (exists (select 1 from profiles p where p.id = auth.uid() and (p.role = 'admin' or (p.role = 'canteen_manager' and p.canteen_id = canteen_slots.canteen_id))))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and (p.role = 'admin' or (p.role = 'canteen_manager' and p.canteen_id = canteen_slots.canteen_id))));

-- ---------------------------------------------------------------------------
-- Handover: every item must be ticked before an order is collected (bill closed)
-- ---------------------------------------------------------------------------
alter table order_items add column if not exists given boolean not null default false;

create or replace function public.set_item_given(p_item uuid, p_given boolean)
returns order_items
language plpgsql security definer set search_path = public as $$
declare
  v_me profiles;
  v_item order_items;
  v_order orders;
begin
  select * into v_me from profiles where id = auth.uid();
  if not found or v_me.role not in ('canteen_kitchen', 'canteen_counter', 'canteen_manager', 'admin') then raise exception 'Only canteen staff can do this.'; end if;
  select * into v_item from order_items where id = p_item;
  if not found then raise exception 'Item not found.'; end if;
  select * into v_order from orders where id = v_item.order_id;
  if v_me.role <> 'admin' and v_me.canteen_id is distinct from v_order.canteen_id then raise exception 'This order belongs to another canteen.'; end if;
  if v_order.status <> 'READY' then raise exception 'Items can be ticked once the order is ready.'; end if;
  update order_items set given = p_given where id = p_item returning * into v_item;
  update orders set updated_at = now() where id = v_order.id;   -- wakes realtime listeners
  return v_item;
end $$;
grant execute on function public.set_item_given(uuid, boolean) to authenticated;

create or replace function public.advance_order(p_id uuid, p_to order_status)
returns orders
language plpgsql security definer set search_path = public as $$
declare
  v_me profiles;
  v_order orders;
  v_ok boolean;
begin
  select * into v_me from profiles where id = auth.uid();
  if not found or v_me.role not in ('canteen_kitchen', 'canteen_counter', 'canteen_manager', 'admin') then raise exception 'Only canteen staff can do this.'; end if;
  select * into v_order from orders where id = p_id for update;
  if not found then raise exception 'Order not found.'; end if;
  if v_me.role <> 'admin' and v_me.canteen_id is distinct from v_order.canteen_id then raise exception 'This order belongs to another canteen.'; end if;

  v_ok := v_me.role in ('canteen_manager', 'admin')
    or (v_me.role = 'canteen_counter' and ((v_order.status = 'PLACED' and p_to = 'PAID') or (v_order.status = 'READY' and p_to = 'COLLECTED')))
    or (v_me.role = 'canteen_kitchen' and ((v_order.status = 'PAID' and p_to = 'READY') or (v_order.status = 'READY' and p_to = 'COLLECTED')));
  if not v_ok then raise exception 'You cannot move an order from % to %.', v_order.status, p_to; end if;

  if p_to = 'COLLECTED' and exists (select 1 from order_items where order_id = p_id and not given) then
    raise exception 'Tick every item as handed over before closing the bill.';
  end if;

  update orders set status = p_to,
    paid_at = case when p_to = 'PAID' then now() else paid_at end,
    collected_at = case when p_to = 'COLLECTED' then now() else collected_at end
    where id = p_id returning * into v_order;
  return v_order;
end $$;

create or replace function public.forfeit_unpaid_orders() returns int
language plpgsql security definer set search_path = public as $$
declare
  v_me profiles;
  v_count int;
begin
  select * into v_me from profiles where id = auth.uid();
  if not found or v_me.role not in ('canteen_counter', 'canteen_manager', 'admin') then raise exception 'Not allowed.'; end if;
  update orders o set status = 'FORFEITED'
    from canteen_slots s
    where s.id = o.slot_id and o.status = 'PLACED' and (s.slot_date + s.end_time) < ist_now()
      and (v_me.role = 'admin' or o.canteen_id = v_me.canteen_id);
  get diagnostics v_count = row_count;
  return v_count;
end $$;

-- ---------------------------------------------------------------------------
-- Club presidents act only for their own club
-- ---------------------------------------------------------------------------
drop policy if exists "Club presidents create event requests" on event_requests;
create policy "Club presidents create event requests" on event_requests for insert to authenticated with check (
  requested_by = auth.uid() and status = 'SUBMITTED' and exists (
    select 1 from profiles p where p.id = auth.uid() and (p.role = 'admin' or (p.role = 'club_president' and p.club_id = event_requests.club_id)))
);

create or replace function public.event_request_guard() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_role user_role;
begin
  if auth.uid() is null then return new; end if;
  v_role := my_role();
  if v_role is distinct from 'admin' and new.club_id is distinct from old.club_id then raise exception 'The club of a request cannot be changed.'; end if;
  if new.status = old.status then return new; end if;
  if v_role = 'admin' then return new; end if;
  if v_role = 'osa' and old.status = 'SUBMITTED' and new.status in ('PENDING_DIRECTOR', 'REJECTED', 'CHANGES_REQUESTED') then return new; end if;
  if v_role = 'campus_director' and old.status = 'PENDING_DIRECTOR' and new.status in ('APPROVED', 'REJECTED') then return new; end if;
  if v_role = 'events_dept' and old.status = 'APPROVED' and new.status = 'CALENDARED' then return new; end if;
  if old.requested_by = auth.uid() and old.status = 'CHANGES_REQUESTED' and new.status = 'SUBMITTED' then return new; end if;
  raise exception 'You cannot move an event from % to %.', old.status, new.status;
end $$;

-- ---------------------------------------------------------------------------
-- Campus calendar: approved events are visible to everyone who is signed in
-- ---------------------------------------------------------------------------
create or replace function public.campus_calendar(p_from date, p_to date)
returns table (id uuid, code text, title text, event_type text, club_name text, hall_name text, event_date date, start_time time, end_time time, status text)
language sql stable security definer set search_path = public as $$
  select e.id, e.code, e.title, e.event_type, c.name, h.name, e.event_date, e.start_time, e.end_time, e.status::text
  from event_requests e
  join clubs c on c.id = e.club_id
  left join rooms h on h.id = e.hall_id
  where e.status in ('APPROVED', 'CALENDARED') and e.event_date between p_from and p_to
  order by e.event_date, e.start_time
$$;
grant execute on function public.campus_calendar(date, date) to authenticated;

-- ---------------------------------------------------------------------------
-- Ticket state machine with role and department checks (it had neither)
-- ---------------------------------------------------------------------------
create or replace function public.transition_ticket(p_ticket_id uuid, p_to_status ticket_status, p_note text, p_assigned_to uuid)
returns service_tickets
language plpgsql security definer set search_path = public as $$
declare
  v_me profiles;
  v_t service_tickets;
  v_old ticket_status;
  v_staff boolean;
  v_tech profiles;
begin
  select * into v_me from profiles where id = auth.uid();
  if not found then raise exception 'Sign in to update a ticket.'; end if;
  select * into v_t from service_tickets where id = p_ticket_id for update;
  if not found then raise exception 'Ticket not found'; end if;
  v_old := v_t.status;
  v_staff := v_me.role in ('dept_office', 'dept_head') and v_me.department_id is not distinct from v_t.assigned_department_id;

  -- Allowed moves: OPEN/REOPENED -> ASSIGNED -> IN_PROGRESS -> RESOLVED -> CLOSED or REOPENED; the requester may also close an OPEN or REOPENED ticket
  if not (
    (v_old in ('OPEN', 'ASSIGNED', 'REOPENED') and p_to_status = 'ASSIGNED')
    or (v_old in ('ASSIGNED', 'REOPENED') and p_to_status = 'IN_PROGRESS')
    or (v_old in ('ASSIGNED', 'IN_PROGRESS', 'REOPENED') and p_to_status = 'RESOLVED')
    or (v_old = 'RESOLVED' and p_to_status in ('CLOSED', 'REOPENED'))
    or (v_old in ('OPEN', 'REOPENED') and p_to_status = 'CLOSED')
  ) then
    raise exception 'A ticket cannot move from % to %.', v_old, p_to_status;
  end if;

  if p_to_status in ('CLOSED', 'REOPENED') then
    if v_t.requester_id <> auth.uid() then raise exception 'Only the requester can close or reopen a ticket.'; end if;
  elsif p_to_status = 'ASSIGNED' then
    if not (v_staff or v_me.role = 'admin') then raise exception 'Only the department office can assign a ticket.'; end if;
    select * into v_tech from profiles where id = coalesce(p_assigned_to, v_t.assigned_to);
    if not found or v_tech.role <> 'technician' then raise exception 'Choose a technician.'; end if;
    if v_tech.department_id is distinct from v_t.assigned_department_id then raise exception 'That technician belongs to another department.'; end if;
  else
    if not (v_staff or v_me.role = 'admin' or (v_me.role = 'technician' and v_t.assigned_to = auth.uid())) then
      raise exception 'Only the assigned technician or the department office can do this.';
    end if;
  end if;

  perform set_config('app.is_transition_func', 'true', true);
  update service_tickets set
    status = p_to_status,
    assigned_to = coalesce(p_assigned_to, assigned_to),
    resolved_at = case when p_to_status = 'RESOLVED' then now() else resolved_at end,
    closed_at = case when p_to_status = 'CLOSED' then now() else closed_at end
  where id = p_ticket_id returning * into v_t;

  insert into events (entity_type, entity_id, actor_id, action, from_status, to_status, note)
  values ('ticket', p_ticket_id, auth.uid(), 'TRANSITION', v_old::text, p_to_status::text, p_note);

  if v_t.requester_id <> auth.uid() then
    insert into notifications (user_id, title, body, link)
    values (v_t.requester_id, 'Ticket ' || v_t.code || ' updated', 'Status changed to ' || replace(lower(p_to_status::text), '_', ' '), '/service-requests/' || v_t.code);
  end if;
  return v_t;
end $$;

-- ---------------------------------------------------------------------------
-- Data validation at the source
-- ---------------------------------------------------------------------------
alter table menu_items add constraint menu_items_price_positive check (price > 0 and price <= 5000) not valid;
alter table canteen_slots add constraint canteen_slots_capacity_positive check (capacity between 1 and 500) not valid;
alter table room_bookings add constraint room_bookings_attendees_positive check (attendees between 1 and 1000) not valid;
alter table event_requests add constraint event_requests_attendance_positive check (expected_attendance between 1 and 5000) not valid;
alter table event_requests add constraint event_requests_phone_format check (contact_phone ~ '^[0-9+ ]{7,15}$') not valid;
alter table event_requests add constraint event_requests_time_order check (end_time > start_time) not valid;
alter table orders add constraint orders_total_nonnegative check (total >= 0) not valid;
alter table order_items add constraint order_items_quantity_range check (quantity between 1 and 20) not valid;
