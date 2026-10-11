-- Certificates (bonafide, NOC): server-side create, department-scoped decisions,
-- reviewer notifications and a public verification function.

-- Clients could insert any status (even APPROVED) straight into the table. Creation goes through the RPC below.
drop policy if exists "Users can create admin requests" on admin_requests;

create or replace function public.create_admin_request(p_type admin_request_type, p_purpose text, p_details jsonb default '{}'::jsonb)
returns admin_requests
language plpgsql security definer set search_path = public as $$
declare v_row admin_requests;
begin
  if auth.uid() is null then raise exception 'Sign in to request a certificate.'; end if;
  if my_role() not in ('student', 'cr', 'club_president') then
    raise exception 'Only students can request certificates.';
  end if;
  if char_length(trim(coalesce(p_purpose, ''))) < 5 then raise exception 'Describe the purpose in at least 5 characters.'; end if;
  if char_length(p_purpose) > 300 then raise exception 'Keep the purpose under 300 characters.'; end if;

  insert into admin_requests (requester_id, type, purpose, details, status, current_reviewer_role)
  values (
    auth.uid(), p_type, trim(p_purpose), coalesce(p_details, '{}'::jsonb),
    case p_type when 'BONAFIDE' then 'PENDING_OFFICE' else 'PENDING_DEPT' end::admin_request_status,
    case p_type when 'BONAFIDE' then 'osa' else 'dept_office' end::user_role
  ) returning * into v_row;
  return v_row;
end $$;

-- Same decision rules as before, plus: department staff may only decide for students of their own department
create or replace function public.decide_admin_request(p_request_id uuid, p_decision text, p_note text)
returns admin_requests
language plpgsql security definer set search_path = public as $$
declare
  v_req admin_requests;
  v_me profiles;
  v_student_dept uuid;
  v_new_status admin_request_status;
  v_old_status admin_request_status;
begin
  select * into v_me from profiles where id = auth.uid();
  select * into v_req from admin_requests where id = p_request_id for update;
  if not found then raise exception 'Request not found'; end if;
  v_old_status := v_req.status;

  if v_req.status = 'PENDING_DEPT' then
    if v_me.role not in ('dept_office', 'dept_head') then raise exception 'Only department staff can decide at this stage'; end if;
    select department_id into v_student_dept from profiles where id = v_req.requester_id;
    if v_me.department_id is distinct from v_student_dept then raise exception 'This student belongs to another department.'; end if;
    if p_decision = 'FORWARD' then v_new_status := 'PENDING_OFFICE';
    elsif p_decision = 'REJECT' then v_new_status := 'REJECTED';
    else raise exception 'Invalid decision'; end if;
  elsif v_req.status = 'PENDING_OFFICE' then
    if v_me.role <> 'osa' then raise exception 'Only student affairs can decide at this stage'; end if;
    if p_decision = 'APPROVE' then v_new_status := 'APPROVED';
    elsif p_decision = 'REJECT' then v_new_status := 'REJECTED';
    else raise exception 'Invalid decision'; end if;
  else
    raise exception 'Request is not pending';
  end if;
  if v_new_status = 'REJECTED' and char_length(trim(coalesce(p_note, ''))) < 3 then raise exception 'Enter a reason for rejecting.'; end if;

  perform set_config('app.is_transition_func', 'true', true);
  update admin_requests set
    status = v_new_status,
    current_reviewer_role = case when v_new_status = 'PENDING_OFFICE' then 'osa'::user_role else current_reviewer_role end,
    decided_by = auth.uid(),
    decision_note = nullif(trim(coalesce(p_note, '')), ''),
    decided_at = case when v_new_status in ('APPROVED', 'REJECTED') then now() else decided_at end
  where id = p_request_id returning * into v_req;

  insert into events (entity_type, entity_id, actor_id, action, from_status, to_status, note)
  values ('admin_request', p_request_id, auth.uid(), p_decision, v_old_status::text, v_new_status::text, p_note);
  return v_req;
end $$;

-- Notifications: new requests reach the first reviewer, every transition reaches the student
create or replace function public.admin_request_notify() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_dept uuid;
begin
  if tg_op = 'INSERT' then
    if new.status = 'PENDING_DEPT' then
      select department_id into v_dept from profiles where id = new.requester_id;
      insert into notifications (user_id, title, body, link)
      select id, 'New certificate request ' || new.code, new.type::text || ': ' || new.purpose, '/office'
      from profiles where role in ('dept_office', 'dept_head') and department_id = v_dept;
    else
      perform notify_roles(array['osa']::user_role[], 'New certificate request ' || new.code, new.type::text || ': ' || new.purpose, '/office');
    end if;
    return new;
  end if;
  if new.status is distinct from old.status then
    perform notify_user(new.requester_id, 'Certificate ' || new.code || ': ' || replace(lower(new.status::text), '_', ' '),
      coalesce(new.decision_note, 'Your ' || new.type::text || ' request moved forward.'), '/requests/' || new.id);
    if new.status = 'PENDING_OFFICE' then
      perform notify_roles(array['osa']::user_role[], 'Certificate awaiting approval ' || new.code, new.type::text || ': ' || new.purpose, '/office');
    end if;
  end if;
  return new;
end $$;
drop trigger if exists admin_request_notify on admin_requests;
create trigger admin_request_notify after insert or update on admin_requests for each row execute procedure admin_request_notify();

-- Public check of a certificate, reachable without signing in. Only approved requests are visible.
create or replace function public.verify_certificate(p_code text)
returns table (code text, type text, holder text, department text, issued_on date)
language sql stable security definer set search_path = public as $$
  select a.code, a.type::text, p.full_name, d.name, a.decided_at::date
  from admin_requests a
  join profiles p on p.id = a.requester_id
  left join departments d on d.id = p.department_id
  where a.code = upper(trim(p_code)) and a.status = 'APPROVED'
$$;

revoke execute on function public.create_admin_request(admin_request_type, text, jsonb) from public, anon;
revoke execute on function public.decide_admin_request(uuid, text, text) from public, anon;
grant execute on function public.create_admin_request(admin_request_type, text, jsonb) to authenticated;
grant execute on function public.decide_admin_request(uuid, text, text) to authenticated;
grant usage on schema public to anon;
grant execute on function public.verify_certificate(text) to anon, authenticated;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'admin_requests') then
    alter publication supabase_realtime add table public.admin_requests;
  end if;
end $$;
