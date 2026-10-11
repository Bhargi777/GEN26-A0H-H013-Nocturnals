-- MASTER-SPEC Safe Role Migration: 6 roles → 14 roles with data preservation
-- Maps: dept_admin → dept_office, office_staff → osa
-- Preserves: student, faculty, technician, admin

-- ============================================================================
-- STEP 1: Create new role enum with all 14 roles
-- ============================================================================
create type user_role_new as enum (
  'student', 'faculty', 'cr', 'club_president', 'technician', 'dept_office',
  'dept_head', 'events_dept', 'osa', 'campus_director', 'canteen_kitchen',
  'canteen_counter', 'canteen_manager', 'admin'
);

-- ============================================================================
-- STEP 2: Drop all policies that depend on profiles.role (before column drop)
-- ============================================================================
-- Policies on profiles table that reference role
drop policy if exists "Admins can read all profiles" on profiles;

-- Policies on service_tickets table that reference role
drop policy if exists "Technicians and dept admins can view their dept tickets" on service_tickets;
drop policy if exists "Admins can view all tickets" on service_tickets;

-- Policies on admin_requests table that reference role
drop policy if exists "Dept admins can view requests for their dept" on admin_requests;
drop policy if exists "Office staff can view requests at PENDING_OFFICE and later" on admin_requests;
drop policy if exists "Admins can view all admin requests" on admin_requests;

-- ============================================================================
-- STEP 3: Migrate role data with mapping
-- ============================================================================
-- Add a temp column to store the new role value
alter table profiles add column if not exists role_new user_role_new;

-- Map old roles to new roles
update profiles
set role_new = case
  when role::text = 'dept_admin' then 'dept_office'::user_role_new
  when role::text = 'office_staff' then 'osa'::user_role_new
  when role::text = 'student' then 'student'::user_role_new
  when role::text = 'faculty' then 'faculty'::user_role_new
  when role::text = 'technician' then 'technician'::user_role_new
  when role::text = 'admin' then 'admin'::user_role_new
  else 'student'::user_role_new  -- fallback default
end;

-- Drop old role column, rename new one
alter table profiles drop column role;
alter table profiles rename column role_new to role;

-- Drop old enum
drop type if exists user_role;

-- Rename new enum to standard name
alter type user_role_new rename to user_role;

-- ============================================================================
-- STEP 4: Add columns for Module A (Rooms), B (Events), D (Canteen)
-- ============================================================================
alter table profiles add column if not exists section text;
alter table profiles add column if not exists club_id uuid;

-- ============================================================================
-- STEP 5: Recreate policies with new role enum and corrected table references
-- ============================================================================

-- Profiles policies
create policy "Admins can read all profiles" on profiles for select to authenticated using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin'::user_role)
);

-- Service Tickets policies (Module C - service requests)
create policy "Technicians and dept admins can view their dept tickets" on service_tickets for select to authenticated using (
  exists (
    select 1 from profiles p
    where p.id = auth.uid()
    and p.role in ('technician'::user_role, 'dept_office'::user_role)
    and p.department_id = (select department_id from service_tickets st where st.id = service_tickets.id)
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
    where me.role = 'dept_office'::user_role
    and me.department_id = student.department_id
    and student.id = (select requester_id from admin_requests ar where ar.id = admin_requests.id)
  )
);

create policy "Office staff can view requests at PENDING_OFFICE and later" on admin_requests for select to authenticated using (
  exists (
    select 1 from profiles where id = auth.uid() and role = 'osa'::user_role
  )
);

create policy "Admins can view all admin requests" on admin_requests for select to authenticated using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin'::user_role)
);

-- ============================================================================
-- STEP 6: Note on event_log reviewer_role enum
-- ============================================================================
-- event_log.reviewer_role enum will be created when event_requests table is added
-- in the next migration (20261011200002_master_spec_tables.sql)
