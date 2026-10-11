-- MASTER-SPEC Safe Role Migration: 6 roles → 14 roles with data preservation
-- Maps: dept_admin → dept_office, office_staff → osa
-- Preserves: student, faculty, technician, admin

-- ============================================================================
-- STEP 1: Drop policies that depend on user_role (recreated in STEP 5)
-- ============================================================================
drop policy if exists "Admins can read all profiles" on profiles;
drop policy if exists "Technicians and dept admins can view their dept tickets" on service_tickets;
drop policy if exists "Admins can view all tickets" on service_tickets;
drop policy if exists "Dept admins can view requests for their dept" on admin_requests;
drop policy if exists "Office staff can view requests at PENDING_OFFICE and later" on admin_requests;
drop policy if exists "Admins can view all admin requests" on admin_requests;

-- ============================================================================
-- STEP 2: Move role columns to text, remapping old role names
-- Maps: dept_admin -> dept_office, office_staff -> osa
-- ============================================================================
alter table profiles alter column role drop default;
alter table profiles alter column role type text using role::text;
alter table admin_requests alter column current_reviewer_role type text using current_reviewer_role::text;

update profiles set role = case role
  when 'dept_admin' then 'dept_office'
  when 'office_staff' then 'osa'
  else role end;
update admin_requests set current_reviewer_role = case current_reviewer_role
  when 'dept_admin' then 'dept_office'
  when 'office_staff' then 'osa'
  else current_reviewer_role end;

-- ============================================================================
-- STEP 3: Replace the enum with the 14-role version and cast columns back
-- ============================================================================
drop type user_role;
create type user_role as enum (
  'student', 'faculty', 'cr', 'club_president', 'technician', 'dept_office',
  'dept_head', 'events_dept', 'osa', 'campus_director', 'canteen_kitchen',
  'canteen_counter', 'canteen_manager', 'admin'
);
alter table profiles alter column role type user_role using role::user_role;
alter table profiles alter column role set default 'student';
alter table admin_requests alter column current_reviewer_role type user_role using current_reviewer_role::user_role;

-- Function bodies are plain text and still compare against the old role names
do $$
declare r record; def text;
begin
  for r in select p.oid from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname in ('decide_admin_request', 'reassign_ticket_department', 'svc_seed_demo_story')
  loop
    def := pg_get_functiondef(r.oid);
    def := replace(replace(def, 'dept_admin', 'dept_office'), 'office_staff', 'osa');
    execute def;
  end loop;
end $$;

-- ============================================================================
-- STEP 4: Add columns for Module A (Rooms), B (Events), D (Canteen)
-- ============================================================================
alter table profiles add column if not exists section text;
alter table profiles add column if not exists club_id uuid;

-- ============================================================================
-- STEP 5: Recreate policies with new role enum and corrected table references
-- ============================================================================

-- Profiles policies: the old "Admins can read all profiles" policy selected from profiles
-- inside its own policy (infinite recursion) and is redundant with "Everyone can read profiles".

-- Service Tickets policies (Module C - service requests)
create policy "Technicians and dept admins can view their dept tickets" on service_tickets for select to authenticated using (
  exists (
    select 1 from profiles p
    where p.id = auth.uid()
    and p.role in ('technician'::user_role, 'dept_office'::user_role, 'dept_head'::user_role)
    and p.department_id = assigned_department_id
  )
);

create policy "Admins can view all tickets" on service_tickets for select to authenticated using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin'::user_role)
);

-- Admin Requests policies
create policy "Dept admins can view requests for their dept" on admin_requests for select to authenticated using (
  exists (
    select 1 from profiles student
    join profiles me on me.id = auth.uid()
    where student.id = admin_requests.requester_id
    and student.department_id = me.department_id
    and me.role in ('dept_office'::user_role, 'dept_head'::user_role)
  )
);

create policy "Office staff can view requests at PENDING_OFFICE and later" on admin_requests for select to authenticated using (
  exists (
    select 1 from profiles where id = auth.uid() and role = 'osa'::user_role
  )
  and status in ('PENDING_OFFICE', 'APPROVED', 'REJECTED')
);

create policy "Admins can view all admin requests" on admin_requests for select to authenticated using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin'::user_role)
);

-- ============================================================================
-- STEP 6: Note on event_log reviewer_role enum
-- ============================================================================
-- event_log.reviewer_role enum will be created when event_requests table is added
-- in the next migration (20261011200002_master_spec_tables.sql)
