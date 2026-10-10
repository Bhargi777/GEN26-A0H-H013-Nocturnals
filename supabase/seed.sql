-- Seed script for CampusConnect

-- Departments
insert into public.departments (id, name, code) values
  ('d0000000-0000-0000-0000-000000000001', 'Computer Science and Engineering', 'CSE'),
  ('d0000000-0000-0000-0000-000000000002', 'Electrical Engineering', 'ELEC'),
  ('d0000000-0000-0000-0000-000000000003', 'Information Technology Services', 'IT'),
  ('d0000000-0000-0000-0000-000000000004', 'Hostel Administration', 'HOSTEL'),
  ('d0000000-0000-0000-0000-000000000005', 'Academic Office', 'ACAD');

-- Buildings
insert into public.buildings (id, name, code) values
  ('b0000000-0000-0000-0000-000000000001', 'Ramanujan Block', 'RB'),
  ('b0000000-0000-0000-0000-000000000002', 'Faraday Hall', 'FH'),
  ('b0000000-0000-0000-0000-000000000003', 'Main Hostel', 'MH'),
  ('b0000000-0000-0000-0000-000000000004', 'Admin Block', 'AB');

-- Rooms
insert into public.rooms (id, building_id, name, floor) values
  ('r0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Lab 101', '1'),
  ('r0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'Lecture Hall 2', '2'),
  ('r0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002', 'Staff Room 12', '1'),
  ('r0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000003', 'Room 304', '3'),
  ('r0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000004', 'Registrar Office', 'G');

-- Users
-- extension for crypt
create extension if not exists "pgcrypto";

insert into auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data) values
  ('u0000000-0000-0000-0000-000000000001', 'arjun.s@example.edu', crypt('password123', gen_salt('bf')), now(), '{"full_name": "Arjun Sharma"}'),
  ('u0000000-0000-0000-0000-000000000002', 'priya.m@example.edu', crypt('password123', gen_salt('bf')), now(), '{"full_name": "Priya Menon"}'),
  ('u0000000-0000-0000-0000-000000000003', 'dr.rao@example.edu', crypt('password123', gen_salt('bf')), now(), '{"full_name": "Dr. Venkatesh Rao"}'),
  ('u0000000-0000-0000-0000-000000000004', 'ramesh.t@example.edu', crypt('password123', gen_salt('bf')), now(), '{"full_name": "Ramesh Tiwari"}'),
  ('u0000000-0000-0000-0000-000000000005', 'suresh.e@example.edu', crypt('password123', gen_salt('bf')), now(), '{"full_name": "Suresh Kumar"}'),
  ('u0000000-0000-0000-0000-000000000006', 'hod.cse@example.edu', crypt('password123', gen_salt('bf')), now(), '{"full_name": "Prof. Anita Desai"}'),
  ('u0000000-0000-0000-0000-000000000007', 'office.acad@example.edu', crypt('password123', gen_salt('bf')), now(), '{"full_name": "Meera Iyer"}'),
  ('u0000000-0000-0000-0000-000000000008', 'admin.sys@example.edu', crypt('password123', gen_salt('bf')), now(), '{"full_name": "System Admin"}');

-- Profiles roles and departments
update public.profiles set role = 'student', department_id = 'd0000000-0000-0000-0000-000000000001', roll_no = 'CSE2021045' where email = 'arjun.s@example.edu';
update public.profiles set role = 'student', department_id = 'd0000000-0000-0000-0000-000000000002', roll_no = 'ELE2022091' where email = 'priya.m@example.edu';
update public.profiles set role = 'faculty', department_id = 'd0000000-0000-0000-0000-000000000001' where email = 'dr.rao@example.edu';
update public.profiles set role = 'technician', department_id = 'd0000000-0000-0000-0000-000000000003' where email = 'ramesh.t@example.edu';
update public.profiles set role = 'technician', department_id = 'd0000000-0000-0000-0000-000000000002' where email = 'suresh.e@example.edu';
update public.profiles set role = 'dept_admin', department_id = 'd0000000-0000-0000-0000-000000000001' where email = 'hod.cse@example.edu';
update public.profiles set role = 'office_staff', department_id = 'd0000000-0000-0000-0000-000000000005' where email = 'office.acad@example.edu';
update public.profiles set role = 'admin' where email = 'admin.sys@example.edu';

-- Insert Service Tickets
insert into public.service_tickets (id, requester_id, title, description, category, priority, status, building_id, room_id, location_note, assigned_department_id, assigned_to) values
  ('t0000000-0000-0000-0000-000000000001', 'u0000000-0000-0000-0000-000000000001', 'Projector not working in Lab 101', 'The projector turns on but displays no signal from the podium computer.', 'AV_EQUIPMENT', 'HIGH', 'ASSIGNED', 'b0000000-0000-0000-0000-000000000001', 'r0000000-0000-0000-0000-000000000001', 'Front podium', 'd0000000-0000-0000-0000-000000000003', 'u0000000-0000-0000-0000-000000000004'),
  ('t0000000-0000-0000-0000-000000000002', 'u0000000-0000-0000-0000-000000000002', 'Hostel Room 304 Fan making noise', 'The ceiling fan makes a loud grinding noise when turned to speed 5.', 'ELECTRICAL', 'MEDIUM', 'OPEN', 'b0000000-0000-0000-0000-000000000003', 'r0000000-0000-0000-0000-000000000004', 'Above bed 2', 'd0000000-0000-0000-0000-000000000002', null),
  ('t0000000-0000-0000-0000-000000000003', 'u0000000-0000-0000-0000-000000000003', 'Wi-Fi dropped in Staff Room 12', 'The campus network drops frequently in this corner of the building.', 'NETWORK', 'HIGH', 'IN_PROGRESS', 'b0000000-0000-0000-0000-000000000002', 'r0000000-0000-0000-0000-000000000003', '', 'd0000000-0000-0000-0000-000000000003', 'u0000000-0000-0000-0000-000000000004'),
  ('t0000000-0000-0000-0000-000000000004', 'u0000000-0000-0000-0000-000000000001', 'Broken chair in Lecture Hall 2', 'One of the chairs in the third row is missing a leg.', 'FURNITURE', 'LOW', 'RESOLVED', 'b0000000-0000-0000-0000-000000000001', 'r0000000-0000-0000-0000-000000000002', 'Third row left side', 'd0000000-0000-0000-0000-000000000004', null),
  ('t0000000-0000-0000-0000-000000000005', 'u0000000-0000-0000-0000-000000000002', 'Leaking tap in washroom', 'The tap near the entrance is continuously leaking water.', 'PLUMBING', 'MEDIUM', 'CLOSED', 'b0000000-0000-0000-0000-000000000001', null, 'First floor left washroom', 'd0000000-0000-0000-0000-000000000004', null),
  ('t0000000-0000-0000-0000-000000000006', 'u0000000-0000-0000-0000-000000000002', 'No internet', 'cannot connect to wifi.', 'NETWORK', 'MEDIUM', 'OPEN', 'b0000000-0000-0000-0000-000000000001', null, '', 'd0000000-0000-0000-0000-000000000003', null),
  ('t0000000-0000-0000-0000-000000000007', 'u0000000-0000-0000-0000-000000000001', 'AC not cooling', 'The AC is blowing hot air.', 'ELECTRICAL', 'MEDIUM', 'ASSIGNED', 'b0000000-0000-0000-0000-000000000002', 'r0000000-0000-0000-0000-000000000003', '', 'd0000000-0000-0000-0000-000000000002', 'u0000000-0000-0000-0000-000000000005'),
  ('t0000000-0000-0000-0000-000000000008', 'u0000000-0000-0000-0000-000000000001', 'Cleaning required', 'Dustbin is overflowing.', 'CLEANLINESS', 'LOW', 'OPEN', 'b0000000-0000-0000-0000-000000000001', 'r0000000-0000-0000-0000-000000000001', '', 'd0000000-0000-0000-0000-000000000004', null),
  ('t0000000-0000-0000-0000-000000000009', 'u0000000-0000-0000-0000-000000000003', 'Socket spark', 'Spark when plugging in.', 'ELECTRICAL', 'URGENT', 'IN_PROGRESS', 'b0000000-0000-0000-0000-000000000001', 'r0000000-0000-0000-0000-000000000002', '', 'd0000000-0000-0000-0000-000000000002', 'u0000000-0000-0000-0000-000000000005'),
  ('t0000000-0000-0000-0000-000000000010', 'u0000000-0000-0000-0000-000000000002', 'Library access denied', 'Id card not working.', 'OTHER', 'MEDIUM', 'OPEN', 'b0000000-0000-0000-0000-000000000004', null, '', 'd0000000-0000-0000-0000-000000000005', null),
  ('t0000000-0000-0000-0000-000000000011', 'u0000000-0000-0000-0000-000000000001', 'Table missing', 'Exam desk missing.', 'FURNITURE', 'HIGH', 'RESOLVED', 'b0000000-0000-0000-0000-000000000002', 'r0000000-0000-0000-0000-000000000003', '', 'd0000000-0000-0000-0000-000000000004', null),
  ('t0000000-0000-0000-0000-000000000012', 'u0000000-0000-0000-0000-000000000003', 'Mic not working', 'Audio issues in LH2.', 'AV_EQUIPMENT', 'HIGH', 'CLOSED', 'b0000000-0000-0000-0000-000000000001', 'r0000000-0000-0000-0000-000000000002', '', 'd0000000-0000-0000-0000-000000000003', null),
  ('t0000000-0000-0000-0000-000000000013', 'u0000000-0000-0000-0000-000000000002', 'Water cooler empty', 'No drinking water.', 'HOSTEL', 'MEDIUM', 'REOPENED', 'b0000000-0000-0000-0000-000000000003', null, 'Floor 3', 'd0000000-0000-0000-0000-000000000004', null),
  ('t0000000-0000-0000-0000-000000000014', 'u0000000-0000-0000-0000-000000000001', 'Network drop', 'Wifi slow.', 'NETWORK', 'LOW', 'OPEN', 'b0000000-0000-0000-0000-000000000003', 'r0000000-0000-0000-0000-000000000004', '', 'd0000000-0000-0000-0000-000000000003', null),
  ('t0000000-0000-0000-0000-000000000015', 'u0000000-0000-0000-0000-000000000003', 'Board markers dry', 'Need new markers.', 'OTHER', 'LOW', 'ASSIGNED', 'b0000000-0000-0000-0000-000000000002', 'r0000000-0000-0000-0000-000000000003', '', 'd0000000-0000-0000-0000-000000000005', 'u0000000-0000-0000-0000-000000000007');


-- Insert Admin Requests
insert into public.admin_requests (id, requester_id, type, purpose, details, status, current_reviewer_role) values
  ('a0000000-0000-0000-0000-000000000001', 'u0000000-0000-0000-0000-000000000001', 'BONAFIDE', 'For opening a bank account at SBI.', '{"branch": "SBI Campus"}', 'PENDING_OFFICE', 'office_staff'),
  ('a0000000-0000-0000-0000-000000000002', 'u0000000-0000-0000-0000-000000000002', 'NOC', 'For an external internship at TechCorp.', '{"company": "TechCorp", "duration_months": 3}', 'PENDING_DEPT', 'dept_admin'),
  ('a0000000-0000-0000-0000-000000000003', 'u0000000-0000-0000-0000-000000000001', 'NOC', 'Attending a workshop.', '{"workshop": "AI Summit"}', 'PENDING_OFFICE', 'office_staff'),
  ('a0000000-0000-0000-0000-000000000004', 'u0000000-0000-0000-0000-000000000002', 'BONAFIDE', 'Passport application.', '{"reason": "Passport"}', 'APPROVED', 'office_staff'),
  ('a0000000-0000-0000-0000-000000000005', 'u0000000-0000-0000-0000-000000000001', 'NOC', 'Part time job.', '{"company": "Startup"}', 'REJECTED', 'dept_admin'),
  ('a0000000-0000-0000-0000-000000000006', 'u0000000-0000-0000-0000-000000000002', 'BONAFIDE', 'Bus pass renewal.', '{"reason": "Transport"}', 'APPROVED', 'office_staff');
