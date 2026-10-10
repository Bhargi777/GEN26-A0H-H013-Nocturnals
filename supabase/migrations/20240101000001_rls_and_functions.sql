-- Enable RLS
alter table departments enable row level security;
alter table buildings enable row level security;
alter table rooms enable row level security;
alter table profiles enable row level security;
alter table service_tickets enable row level security;
alter table ticket_followers enable row level security;
alter table admin_requests enable row level security;
alter table events enable row level security;
alter table notifications enable row level security;

-- Base definitions for RLS
create policy "Everyone can read departments" on departments for select to authenticated using (true);
create policy "Everyone can read buildings" on buildings for select to authenticated using (true);
create policy "Everyone can read rooms" on rooms for select to authenticated using (true);

create policy "Users can read their own profile" on profiles for select to authenticated using (auth.uid() = id);
create policy "Admins can read all profiles" on profiles for select to authenticated using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
create policy "Everyone can read profiles" on profiles for select to authenticated using (true);
create policy "Users can update their own profile" on profiles for update to authenticated using (auth.uid() = id);

create policy "Students can view their own tickets" on service_tickets for select to authenticated using (
  requester_id = auth.uid()
);
create policy "Technicians and dept admins can view their dept tickets" on service_tickets for select to authenticated using (
  exists (
    select 1 from profiles p 
    where p.id = auth.uid() 
    and p.role in ('technician', 'dept_admin') 
    and p.department_id = assigned_department_id
  )
);
create policy "Admins can view all tickets" on service_tickets for select to authenticated using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

create policy "Users can create tickets" on service_tickets for insert to authenticated with check (
  requester_id = auth.uid()
);
create policy "Users can update own tickets (non-status)" on service_tickets for update to authenticated using (
  requester_id = auth.uid()
);

create policy "Students can view their own admin requests" on admin_requests for select to authenticated using (
  requester_id = auth.uid()
);
create policy "Dept admins can view requests for their dept" on admin_requests for select to authenticated using (
  exists (
    select 1 from profiles student
    join profiles me on me.id = auth.uid()
    where student.id = admin_requests.requester_id
    and student.department_id = me.department_id
    and me.role = 'dept_admin'
  )
);
create policy "Office staff can view requests at PENDING_OFFICE and later" on admin_requests for select to authenticated using (
  exists (
    select 1 from profiles where id = auth.uid() and role = 'office_staff'
  )
  and status in ('PENDING_OFFICE', 'APPROVED', 'REJECTED')
);
create policy "Admins can view all admin requests" on admin_requests for select to authenticated using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

create policy "Users can create admin requests" on admin_requests for insert to authenticated with check (
  requester_id = auth.uid()
);

create policy "Users can see followers of tickets they can see" on ticket_followers for select to authenticated using (
  exists (select 1 from service_tickets st where st.id = ticket_id)
);
create policy "Users can follow tickets" on ticket_followers for insert to authenticated with check (
  user_id = auth.uid()
);

create policy "Users can see events for tickets they can see" on events for select to authenticated using (
  entity_type = 'ticket' and exists (select 1 from service_tickets st where st.id = entity_id)
);
create policy "Users can see events for admin requests they can see" on events for select to authenticated using (
  entity_type = 'admin_request' and exists (select 1 from admin_requests ar where ar.id = entity_id)
);

create policy "Users can manage their own notifications" on notifications for all to authenticated using (user_id = auth.uid());

create or replace function block_direct_status_update()
returns trigger as $$
begin
  if old.status is distinct from new.status then
    if current_setting('app.is_transition_func', true) is distinct from 'true' then
      raise exception 'Direct update of status is not allowed. Use transition functions.';
    end if;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger block_status_update_tickets
  before update on service_tickets
  for each row execute procedure block_direct_status_update();

create trigger block_status_update_admin_reqs
  before update on admin_requests
  for each row execute procedure block_direct_status_update();

create or replace function transition_ticket(
  p_ticket_id uuid,
  p_to_status ticket_status,
  p_note text,
  p_assigned_to uuid
) returns service_tickets as $$
declare
  v_ticket service_tickets;
  v_role user_role;
  v_dept_id uuid;
begin
  select role, department_id into v_role, v_dept_id from profiles where id = auth.uid();
  
  select * into v_ticket from service_tickets where id = p_ticket_id;
  if not found then
    raise exception 'Ticket not found';
  end if;

  if p_to_status = 'CLOSED' or p_to_status = 'REOPENED' then
    if v_ticket.requester_id != auth.uid() then
      raise exception 'Only requester can close or reopen';
    end if;
  end if;

  if v_role = 'technician' and p_to_status = 'CLOSED' then
    raise exception 'Technician cannot close a ticket';
  end if;

  perform set_config('app.is_transition_func', 'true', true);

  update service_tickets set 
    status = p_to_status,
    assigned_to = coalesce(p_assigned_to, assigned_to),
    resolved_at = case when p_to_status = 'RESOLVED' then now() else resolved_at end,
    closed_at = case when p_to_status = 'CLOSED' then now() else closed_at end
  where id = p_ticket_id
  returning * into v_ticket;

  insert into events (entity_type, entity_id, actor_id, action, from_status, to_status, note)
  values ('ticket', p_ticket_id, auth.uid(), 'TRANSITION', v_ticket.status::text, p_to_status::text, p_note);

  if v_ticket.requester_id != auth.uid() then
    insert into notifications (user_id, title, body, link)
    values (v_ticket.requester_id, 'Ticket Updated', 'Status changed to ' || p_to_status, '/service-requests/' || p_ticket_id);
  end if;

  return v_ticket;
end;
$$ language plpgsql security definer;

create or replace function decide_admin_request(
  p_request_id uuid,
  p_decision text,
  p_note text
) returns admin_requests as $$
declare
  v_req admin_requests;
  v_role user_role;
  v_new_status admin_request_status;
begin
  select role into v_role from profiles where id = auth.uid();
  select * into v_req from admin_requests where id = p_request_id;
  if not found then raise exception 'Request not found'; end if;

  if v_req.status = 'PENDING_DEPT' then
    if v_role != 'dept_admin' then raise exception 'Only dept admin can decide at this stage'; end if;
    if p_decision = 'FORWARD' then v_new_status := 'PENDING_OFFICE';
    elsif p_decision = 'REJECT' then v_new_status := 'REJECTED';
    else raise exception 'Invalid decision'; end if;
  elsif v_req.status = 'PENDING_OFFICE' then
    if v_role != 'office_staff' then raise exception 'Only office staff can decide at this stage'; end if;
    if p_decision = 'APPROVE' then v_new_status := 'APPROVED';
    elsif p_decision = 'REJECT' then v_new_status := 'REJECTED';
    else raise exception 'Invalid decision'; end if;
  else
    raise exception 'Request is not pending';
  end if;

  perform set_config('app.is_transition_func', 'true', true);

  update admin_requests set
    status = v_new_status,
    current_reviewer_role = case when v_new_status = 'PENDING_OFFICE' then 'office_staff'::user_role else current_reviewer_role end,
    decided_by = auth.uid(),
    decision_note = p_note,
    decided_at = case when v_new_status in ('APPROVED', 'REJECTED') then now() else decided_at end
  where id = p_request_id
  returning * into v_req;

  insert into events (entity_type, entity_id, actor_id, action, from_status, to_status, note)
  values ('admin_request', p_request_id, auth.uid(), p_decision, v_req.status::text, v_new_status::text, p_note);

  insert into notifications (user_id, title, body, link)
  values (v_req.requester_id, 'Admin Request Updated', 'Status changed to ' || v_new_status, '/requests/' || p_request_id);

  return v_req;
end;
$$ language plpgsql security definer;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
values ('ticket-photos', 'ticket-photos', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
on conflict do nothing;

insert into storage.buckets (id, name, public) 
values ('admin-documents', 'admin-documents', false)
on conflict do nothing;

create policy "Ticket photos visibility" on storage.objects for select to authenticated using (bucket_id = 'ticket-photos');
create policy "Ticket photos upload" on storage.objects for insert to authenticated with check (bucket_id = 'ticket-photos');
create policy "Admin documents visibility" on storage.objects for select to authenticated using (bucket_id = 'admin-documents');
create policy "Admin documents upload" on storage.objects for insert to authenticated with check (bucket_id = 'admin-documents');
