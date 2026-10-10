-- Ticket department reassignment
-- Allows dept_admin and admin to move a ticket to another department

create or replace function reassign_ticket_department(
  p_ticket_id uuid,
  p_new_department_id uuid,
  p_note text
) returns service_tickets as $$
declare
  v_ticket service_tickets;
  v_role user_role;
  v_dept_id uuid;
  v_old_dept_id uuid;
  v_new_dept_name text;
begin
  select role, department_id into v_role, v_dept_id from profiles where id = auth.uid();
  
  select * into v_ticket from service_tickets where id = p_ticket_id;
  if not found then
    raise exception 'Ticket not found';
  end if;

  -- Only dept_admin (for their department) and admin can reassign departments
  if v_role = 'dept_admin' then
    if v_ticket.assigned_department_id != v_dept_id then
      raise exception 'Dept admin can only reassign tickets from their own department';
    end if;
  elsif v_role != 'admin' then
    raise exception 'Only dept admin or admin can reassign ticket department';
  end if;

  -- Verify the new department exists
  select name into v_new_dept_name from departments where id = p_new_department_id;
  if not found then
    raise exception 'Department not found';
  end if;

  v_old_dept_id := v_ticket.assigned_department_id;

  perform set_config('app.is_transition_func', 'true', true);

  update service_tickets set
    assigned_department_id = p_new_department_id,
    assigned_to = null  -- Clear assignee when department changes
  where id = p_ticket_id
  returning * into v_ticket;

  insert into events (entity_type, entity_id, actor_id, action, from_status, to_status, note)
  values ('ticket', p_ticket_id, auth.uid(), 'REASSIGN_DEPARTMENT', v_old_dept_id::text, p_new_department_id::text, p_note);

  -- Notify requester
  if v_ticket.requester_id != auth.uid() then
    insert into notifications (user_id, title, body, link)
    values (v_ticket.requester_id, 'Ticket Reassigned', 'Ticket moved to ' || v_new_dept_name || ' department', '/service-requests/' || p_ticket_id);
  end if;

  -- Notify new department's technicians/admins (optional - could be expanded)
  -- For now, just notify if there was a previous assignee
  if v_ticket.assigned_to is not null and v_ticket.assigned_to != auth.uid() then
    insert into notifications (user_id, title, body, link)
    values (v_ticket.assigned_to, 'Ticket Reassigned', 'Ticket moved to ' || v_new_dept_name || ' department', '/service-requests/' || p_ticket_id);
  end if;

  return v_ticket;
end;
$$ language plpgsql security definer;