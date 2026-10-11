-- Seed script for CampusConnect

-- Departments
insert into public.departments (id, name, code) values
  ('d0000000-0000-0000-0000-000000000001', 'Computer Science and Engineering', 'CSE'),
  ('d0000000-0000-0000-0000-000000000002', 'Electrical Engineering', 'ELEC'),
  ('d0000000-0000-0000-0000-000000000003', 'Information Technology Services', 'IT'),
  ('d0000000-0000-0000-0000-000000000004', 'Facilities & Maintenance', 'FAC'),
  ('d0000000-0000-0000-0000-000000000005', 'Student Affairs', 'SAO');

-- Buildings
insert into public.buildings (id, name, code) values
  ('b0000000-0000-0000-0000-000000000001', 'Ramanujan Block', 'RB'),
  ('b0000000-0000-0000-0000-000000000002', 'Faraday Hall', 'FH'),
  ('b0000000-0000-0000-0000-000000000003', 'Main Hostel', 'MH'),
  ('b0000000-0000-0000-0000-000000000004', 'Admin Block', 'AB'),
  ('b0000000-0000-0000-0000-000000000005', 'Auditorium', 'AUD'),
  ('b0000000-0000-0000-0000-000000000006', 'Sports Complex', 'SC');

-- Blocks
insert into public.blocks (id, code, name, owner_department_id) values
  ('b1000000-0000-0000-0000-000000000001', 'RB-1', 'Ramanujan Block 1', 'd0000000-0000-0000-0000-000000000001'),
  ('b1000000-0000-0000-0000-000000000002', 'FH-1', 'Faraday Hall 1', 'd0000000-0000-0000-0000-000000000002');

-- Floors
insert into public.floors (id, block_id, level, label, grid_cols, grid_rows) values
  ('f0000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 1, 'Floor 1', 4, 4),
  ('f0000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000001', 2, 'Floor 2', 4, 4);

-- Rooms (including halls for events)
insert into public.rooms (id, floor_id, building_id, name, floor, code, kind, capacity, bookable) values
  ('e0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Lab 101', '1', 'RB-LAB-101', 'lab', 30, true),
  ('e0000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Lecture Hall 1', '1', 'RB-LH-101', 'classroom', 60, true),
  ('e0000000-0000-0000-0000-000000000003', 'f0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 'Staff Room 12', '2', 'FH-SR-201', 'classroom', 20, true),
  ('e0000000-0000-0000-0000-000000000004', NULL, 'b0000000-0000-0000-0000-000000000003', 'Room 304', '3', 'MH-304', 'classroom', 2, true),
  ('e0000000-0000-0000-0000-000000000005', NULL, 'b0000000-0000-0000-0000-000000000004', 'Registrar Office', 'G', 'AB-REG', 'classroom', 10, false),
  ('e0000000-0000-0000-0000-000000000006', NULL, 'b0000000-0000-0000-0000-000000000005', 'Main Auditorium', '1', 'AUD-MAIN', 'hall', 500, true),
  ('e0000000-0000-0000-0000-000000000007', NULL, 'b0000000-0000-0000-0000-000000000005', 'Seminar Hall A', '1', 'AUD-SEM-A', 'hall', 150, true),
  ('e0000000-0000-0000-0000-000000000008', NULL, 'b0000000-0000-0000-0000-000000000005', 'Seminar Hall B', '1', 'AUD-SEM-B', 'hall', 100, true),
  ('e0000000-0000-0000-0000-000000000009', NULL, 'b0000000-0000-0000-0000-000000000006', 'Sports Hall', '1', 'SC-HALL', 'hall', 200, true);

-- Periods
insert into public.periods (id, label, start_time, end_time) values
  ('90000000-0000-0000-0000-000000000001', 'Period 1', '07:00:00', '08:00:00'),
  ('90000000-0000-0000-0000-000000000002', 'Period 2', '08:00:00', '09:00:00'),
  ('90000000-0000-0000-0000-000000000003', 'Period 3', '09:00:00', '10:00:00'),
  ('90000000-0000-0000-0000-000000000004', 'Period 4', '10:15:00', '11:15:00'),
  ('90000000-0000-0000-0000-000000000005', 'Period 5', '11:15:00', '12:15:00'),
  ('90000000-0000-0000-0000-000000000006', 'Period 6', '13:00:00', '14:00:00'),
  ('90000000-0000-0000-0000-000000000007', 'Period 7', '14:00:00', '15:00:00'),
  ('90000000-0000-0000-0000-000000000008', 'Period 8', '15:00:00', '16:00:00');

-- Clubs
insert into public.clubs (id, code, name) values
  ('c0000000-0000-0000-0000-000000000001', 'ACM', 'ACM Student Chapter'),
  ('c0000000-0000-0000-0000-000000000002', 'IEEE', 'IEEE Student Branch'),
  ('c0000000-0000-0000-0000-000000000003', 'DANCE', 'Dance Club'),
  ('c0000000-0000-0000-0000-000000000004', 'MUSIC', 'Music Club'),
  ('c0000000-0000-0000-0000-000000000005', 'SPORTS', 'Sports Club'),
  ('c0000000-0000-0000-0000-000000000006', 'TECH', 'Tech Club'),
  ('c0000000-0000-0000-0000-000000000007', 'ARTS', 'Arts Club'),
  ('c0000000-0000-0000-0000-000000000008', 'DRAMA', 'Drama Club');

-- Canteens
insert into public.canteens (id, code, name, location) values
  ('c1000000-0000-0000-0000-000000000001', 'MAIN', 'Main Canteen', 'Building A, Ground Floor'),
  ('c1000000-0000-0000-0000-000000000002', 'NORTH', 'North Canteen', 'Building B, Ground Floor'),
  ('c1000000-0000-0000-0000-000000000003', 'SOUTH', 'South Canteen', 'Building C, First Floor');

-- Menu Items
insert into public.menu_items (id, canteen_id, name, price, category, veg, available) values
  -- Main Canteen
  ('3a000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'Biryani (Chicken)', 150, 'rice', false, true),
  ('3a000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000001', 'Biryani (Vegetable)', 120, 'rice', true, true),
  ('3a000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000001', 'Butter Chicken', 180, 'curry', false, true),
  ('3a000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000001', 'Paneer Butter Masala', 160, 'curry', true, true),
  ('3a000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000001', 'Dosa', 80, 'breakfast', true, true),
  ('3a000000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000001', 'Tea', 20, 'beverage', true, true),
  -- North Canteen
  ('3a000000-0000-0000-0000-000000000007', 'c1000000-0000-0000-0000-000000000002', 'Naan with Chole', 100, 'bread', true, true),
  ('3a000000-0000-0000-0000-000000000008', 'c1000000-0000-0000-0000-000000000002', 'Roti (3 pieces)', 90, 'bread', true, true),
  ('3a000000-0000-0000-0000-000000000009', 'c1000000-0000-0000-0000-000000000002', 'Vada Pav', 50, 'snack', true, true),
  ('3a000000-0000-0000-0000-000000000010', 'c1000000-0000-0000-0000-000000000002', 'Chai', 20, 'beverage', true, true),
  -- South Canteen
  ('3a000000-0000-0000-0000-000000000011', 'c1000000-0000-0000-0000-000000000003', 'Pesarattu', 80, 'breakfast', true, true),
  ('3a000000-0000-0000-0000-000000000012', 'c1000000-0000-0000-0000-000000000003', 'Upma', 60, 'breakfast', true, true),
  ('3a000000-0000-0000-0000-000000000013', 'c1000000-0000-0000-0000-000000000003', 'Lemon Rice', 80, 'rice', true, true),
  ('3a000000-0000-0000-0000-000000000014', 'c1000000-0000-0000-0000-000000000003', 'Filter Coffee', 30, 'beverage', true, true);

-- Users
-- extension for crypt
create extension if not exists "pgcrypto";

insert into auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, instance_id, aud, role, raw_app_meta_data, confirmation_token, recovery_token, email_change, email_change_token_new, created_at, updated_at) select v.id::uuid, v.email, v.pw, v.confirmed, v.meta::jsonb, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}'::jsonb, '', '', '', '', now(), now() from (values
  ('a5000000-0000-0000-0000-000000000001', 'arjun.s@example.edu', crypt('password123', gen_salt('bf')), now(), '{"full_name": "Arjun Sharma"}'),
  ('a5000000-0000-0000-0000-000000000002', 'priya.m@example.edu', crypt('password123', gen_salt('bf')), now(), '{"full_name": "Priya Menon"}'),
  ('a5000000-0000-0000-0000-000000000003', 'dr.rao@example.edu', crypt('password123', gen_salt('bf')), now(), '{"full_name": "Dr. Venkatesh Rao"}'),
  ('a5000000-0000-0000-0000-000000000004', 'ramesh.t@example.edu', crypt('password123', gen_salt('bf')), now(), '{"full_name": "Ramesh Tiwari"}'),
  ('a5000000-0000-0000-0000-000000000005', 'suresh.e@example.edu', crypt('password123', gen_salt('bf')), now(), '{"full_name": "Suresh Kumar"}'),
  ('a5000000-0000-0000-0000-000000000006', 'hod.cse@example.edu', crypt('password123', gen_salt('bf')), now(), '{"full_name": "Prof. Anita Desai"}'),
  ('a5000000-0000-0000-0000-000000000007', 'osa.staff@example.edu', crypt('password123', gen_salt('bf')), now(), '{"full_name": "Meera Iyer"}'),
  ('a5000000-0000-0000-0000-000000000008', 'director.campus@example.edu', crypt('password123', gen_salt('bf')), now(), '{"full_name": "Dr. Campus Director"}'),
  ('a5000000-0000-0000-0000-000000000009', 'club.president@example.edu', crypt('password123', gen_salt('bf')), now(), '{"full_name": "Rohit Kumar"}'),
  ('a5000000-0000-0000-0000-000000000010', 'admin.sys@example.edu', crypt('password123', gen_salt('bf')), now(), '{"full_name": "System Admin"}'),
  ('a5000000-0000-0000-0000-000000000011', 'cr.cse@example.edu', crypt('password123', gen_salt('bf')), now(), '{"full_name": "Kavya Reddy"}'),
  ('a5000000-0000-0000-0000-000000000012', 'office.cse@example.edu', crypt('password123', gen_salt('bf')), now(), '{"full_name": "Sunil Verma"}'),
  ('a5000000-0000-0000-0000-000000000013', 'events.dept@example.edu', crypt('password123', gen_salt('bf')), now(), '{"full_name": "Neha Kapoor"}'),
  ('a5000000-0000-0000-0000-000000000014', 'kitchen.main@example.edu', crypt('password123', gen_salt('bf')), now(), '{"full_name": "Balu Kitchen"}'),
  ('a5000000-0000-0000-0000-000000000015', 'counter.main@example.edu', crypt('password123', gen_salt('bf')), now(), '{"full_name": "Lata Counter"}'),
  ('a5000000-0000-0000-0000-000000000016', 'canteen.manager@example.edu', crypt('password123', gen_salt('bf')), now(), '{"full_name": "Hari Manager"}')) as v(id, email, pw, confirmed, meta);

insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), u.id, u.id::text, jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true), 'email', now(), now(), now() from auth.users u;

-- Profiles roles and departments (using new role names from migration)
update public.profiles set role = 'student', department_id = 'd0000000-0000-0000-0000-000000000001', roll_no = 'CSE2021045' where email = 'arjun.s@example.edu';
update public.profiles set role = 'student', department_id = 'd0000000-0000-0000-0000-000000000002', roll_no = 'ELE2022091' where email = 'priya.m@example.edu';
update public.profiles set role = 'faculty', department_id = 'd0000000-0000-0000-0000-000000000001' where email = 'dr.rao@example.edu';
update public.profiles set role = 'technician', department_id = 'd0000000-0000-0000-0000-000000000003' where email = 'ramesh.t@example.edu';
update public.profiles set role = 'technician', department_id = 'd0000000-0000-0000-0000-000000000002' where email = 'suresh.e@example.edu';
update public.profiles set role = 'dept_head', department_id = 'd0000000-0000-0000-0000-000000000001' where email = 'hod.cse@example.edu';
update public.profiles set role = 'osa', department_id = 'd0000000-0000-0000-0000-000000000005' where email = 'osa.staff@example.edu';
update public.profiles set role = 'campus_director' where email = 'director.campus@example.edu';
update public.profiles set role = 'club_president', club_id = 'c0000000-0000-0000-0000-000000000001' where email = 'club.president@example.edu';
update public.profiles set role = 'admin' where email = 'admin.sys@example.edu';
update public.profiles set role = 'cr', department_id = 'd0000000-0000-0000-0000-000000000001', roll_no = 'CSE2023012', section = 'CSE-A' where email = 'cr.cse@example.edu';
update public.profiles set role = 'dept_office', department_id = 'd0000000-0000-0000-0000-000000000001' where email = 'office.cse@example.edu';
update public.profiles set role = 'events_dept', department_id = 'd0000000-0000-0000-0000-000000000005' where email = 'events.dept@example.edu';
update public.profiles set role = 'canteen_kitchen' where email = 'kitchen.main@example.edu';
update public.profiles set role = 'canteen_counter' where email = 'counter.main@example.edu';
update public.profiles set role = 'canteen_manager' where email = 'canteen.manager@example.edu';

-- Insert Service Tickets
insert into public.service_tickets (id, requester_id, title, description, category, priority, status, building_id, room_id, location_note, assigned_department_id, assigned_to) values
  ('70000000-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000001', 'Projector not working in Lab 101', 'The projector turns on but displays no signal from the podium computer.', 'AV_EQUIPMENT', 'HIGH', 'ASSIGNED', 'b0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'Front podium', 'd0000000-0000-0000-0000-000000000003', 'a5000000-0000-0000-0000-000000000004'),
  ('70000000-0000-0000-0000-000000000002', 'a5000000-0000-0000-0000-000000000002', 'Hostel Room 304 Fan making noise', 'The ceiling fan makes a loud grinding noise when turned to speed 5.', 'ELECTRICAL', 'MEDIUM', 'OPEN', 'b0000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000004', 'Above bed 2', 'd0000000-0000-0000-0000-000000000002', null),
  ('70000000-0000-0000-0000-000000000003', 'a5000000-0000-0000-0000-000000000003', 'Wi-Fi dropped in Staff Room 12', 'The campus network drops frequently in this corner of the building.', 'NETWORK', 'HIGH', 'IN_PROGRESS', 'b0000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000003', '', 'd0000000-0000-0000-0000-000000000003', 'a5000000-0000-0000-0000-000000000004'),
  ('70000000-0000-0000-0000-000000000004', 'a5000000-0000-0000-0000-000000000001', 'Broken chair in Lecture Hall 2', 'One of the chairs in the third row is missing a leg.', 'FURNITURE', 'LOW', 'RESOLVED', 'b0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000002', 'Third row left side', 'd0000000-0000-0000-0000-000000000004', null),
  ('70000000-0000-0000-0000-000000000005', 'a5000000-0000-0000-0000-000000000002', 'Leaking tap in washroom', 'The tap near the entrance is continuously leaking water.', 'PLUMBING', 'MEDIUM', 'CLOSED', 'b0000000-0000-0000-0000-000000000001', null, 'First floor left washroom', 'd0000000-0000-0000-0000-000000000004', null),
  ('70000000-0000-0000-0000-000000000006', 'a5000000-0000-0000-0000-000000000002', 'No internet', 'cannot connect to wifi.', 'NETWORK', 'MEDIUM', 'OPEN', 'b0000000-0000-0000-0000-000000000001', null, '', 'd0000000-0000-0000-0000-000000000003', null),
  ('70000000-0000-0000-0000-000000000007', 'a5000000-0000-0000-0000-000000000001', 'AC not cooling', 'The AC is blowing hot air.', 'ELECTRICAL', 'MEDIUM', 'ASSIGNED', 'b0000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000003', '', 'd0000000-0000-0000-0000-000000000002', 'a5000000-0000-0000-0000-000000000005'),
  ('70000000-0000-0000-0000-000000000008', 'a5000000-0000-0000-0000-000000000001', 'Cleaning required', 'Dustbin is overflowing.', 'CLEANLINESS', 'LOW', 'OPEN', 'b0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', '', 'd0000000-0000-0000-0000-000000000004', null),
  ('70000000-0000-0000-0000-000000000009', 'a5000000-0000-0000-0000-000000000003', 'Socket spark', 'Spark when plugging in.', 'ELECTRICAL', 'URGENT', 'IN_PROGRESS', 'b0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000002', '', 'd0000000-0000-0000-0000-000000000002', 'a5000000-0000-0000-0000-000000000005'),
  ('70000000-0000-0000-0000-000000000010', 'a5000000-0000-0000-0000-000000000002', 'Library access denied', 'Id card not working.', 'OTHER', 'MEDIUM', 'OPEN', 'b0000000-0000-0000-0000-000000000004', null, '', 'd0000000-0000-0000-0000-000000000005', null),
  ('70000000-0000-0000-0000-000000000011', 'a5000000-0000-0000-0000-000000000001', 'Table missing', 'Exam desk missing.', 'FURNITURE', 'HIGH', 'RESOLVED', 'b0000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000003', '', 'd0000000-0000-0000-0000-000000000004', null),
  ('70000000-0000-0000-0000-000000000012', 'a5000000-0000-0000-0000-000000000003', 'Mic not working', 'Audio issues in LH2.', 'AV_EQUIPMENT', 'HIGH', 'CLOSED', 'b0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000002', '', 'd0000000-0000-0000-0000-000000000003', null),
  ('70000000-0000-0000-0000-000000000013', 'a5000000-0000-0000-0000-000000000002', 'Water cooler empty', 'No drinking water.', 'HOSTEL', 'MEDIUM', 'REOPENED', 'b0000000-0000-0000-0000-000000000003', null, 'Floor 3', 'd0000000-0000-0000-0000-000000000004', null),
  ('70000000-0000-0000-0000-000000000014', 'a5000000-0000-0000-0000-000000000001', 'Network drop', 'Wifi slow.', 'NETWORK', 'LOW', 'OPEN', 'b0000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000004', '', 'd0000000-0000-0000-0000-000000000003', null),
  ('70000000-0000-0000-0000-000000000015', 'a5000000-0000-0000-0000-000000000003', 'Board markers dry', 'Need new markers.', 'OTHER', 'LOW', 'ASSIGNED', 'b0000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000003', '', 'd0000000-0000-0000-0000-000000000005', 'a5000000-0000-0000-0000-000000000007');


-- Insert Admin Requests
insert into public.admin_requests (id, requester_id, type, purpose, details, status, current_reviewer_role) values
  ('a0000000-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000001', 'BONAFIDE', 'For opening a bank account at SBI.', '{"branch": "SBI Campus"}', 'PENDING_OFFICE', 'osa'),
  ('a0000000-0000-0000-0000-000000000002', 'a5000000-0000-0000-0000-000000000002', 'NOC', 'For an external internship at TechCorp.', '{"company": "TechCorp", "duration_months": 3}', 'PENDING_DEPT', 'dept_office'),
  ('a0000000-0000-0000-0000-000000000003', 'a5000000-0000-0000-0000-000000000001', 'NOC', 'Attending a workshop.', '{"workshop": "AI Summit"}', 'PENDING_OFFICE', 'osa'),
  ('a0000000-0000-0000-0000-000000000004', 'a5000000-0000-0000-0000-000000000002', 'BONAFIDE', 'Passport application.', '{"reason": "Passport"}', 'APPROVED', 'osa'),
  ('a0000000-0000-0000-0000-000000000005', 'a5000000-0000-0000-0000-000000000001', 'NOC', 'Part time job.', '{"company": "Startup"}', 'REJECTED', 'dept_office'),
  ('a0000000-0000-0000-0000-000000000006', 'a5000000-0000-0000-0000-000000000002', 'BONAFIDE', 'Bus pass renewal.', '{"reason": "Transport"}', 'APPROVED', 'osa');


-- Timetable: Lab 101 and Lecture Hall 1 are taken on some weekday periods
insert into public.timetable_entries (room_id, weekday, period_id, course, section, faculty_name)
select r.id, w.d, p.id, 'CS201 Data Structures', 'CSE-A', 'Dr. Venkatesh Rao'
from public.rooms r cross join (values (1), (2), (3), (4), (5)) as w(d)
join public.periods p on p.label in ('Period 3', 'Period 4')
where r.code = 'RB-LH-101';

insert into public.timetable_entries (room_id, weekday, period_id, course, section, faculty_name)
select r.id, w.d, p.id, 'CS252 Networks Lab', 'CSE-B', 'Dr. Venkatesh Rao'
from public.rooms r cross join (values (1), (3), (5)) as w(d)
join public.periods p on p.label = 'Period 6'
where r.code = 'RB-LAB-101';

-- Canteen slots: 15 minute grid over the whole day, IST today and the next two days
insert into public.canteen_slots (canteen_id, slot_date, start_time, end_time, capacity)
select c.id, d::date, t::time, (t + interval '15 minutes')::time, 25
from public.canteens c
cross join generate_series((now() at time zone 'Asia/Kolkata')::date, (now() at time zone 'Asia/Kolkata')::date + 2, interval '1 day') as d
cross join generate_series(timestamp '2000-01-01 00:00', timestamp '2000-01-01 23:30', interval '15 minutes') as t;

-- Floor plans: grid sizes and room positions (sample layout: wings F/C top, D/A bottom, corridor between)
update public.floors set grid_cols = 13, grid_rows = 3 where id in ('f0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000002');
insert into public.floors (id, block_id, level, label, grid_cols, grid_rows) values
  ('f0000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000002', 1, 'Floor 1', 9, 3),
  ('f0000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000002', 2, 'Floor 2', 9, 3);
-- existing rooms get plan positions
update public.rooms set floor_id = 'f0000000-0000-0000-0000-000000000002', grid_x = 0, grid_y = 0, grid_w = 3, grid_h = 1 where code = 'RB-LAB-101';
update public.rooms set floor_id = 'f0000000-0000-0000-0000-000000000002', grid_x = 3, grid_y = 0, grid_w = 3, grid_h = 1 where code = 'RB-LH-101';
update public.rooms set floor_id = 'f0000000-0000-0000-0000-000000000004', grid_x = 0, grid_y = 0, grid_w = 3, grid_h = 1 where code = 'FH-SR-201';
insert into public.rooms (id, floor_id, building_id, name, floor, code, kind, capacity, bookable, grid_x, grid_y, grid_w, grid_h) values
  ('e0000000-0000-0000-0000-000000000020', 'f0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Room F103', '1', 'RB-F103', 'classroom', 60, true, 0, 0, 2, 1),
  ('e0000000-0000-0000-0000-000000000021', 'f0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Room F102', '1', 'RB-F102', 'classroom', 60, true, 2, 0, 2, 1),
  ('e0000000-0000-0000-0000-000000000022', 'f0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Room F101', '1', 'RB-F101', 'classroom', 60, true, 4, 0, 2, 1),
  ('e0000000-0000-0000-0000-000000000023', 'f0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Room C104', '1', 'RB-C104', 'classroom', 60, true, 7, 0, 2, 1),
  ('e0000000-0000-0000-0000-000000000024', 'f0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Room C103', '1', 'RB-C103', 'classroom', 60, true, 9, 0, 2, 1),
  ('e0000000-0000-0000-0000-000000000025', 'f0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Room C102', '1', 'RB-C102', 'classroom', 60, true, 11, 0, 2, 1),
  ('e0000000-0000-0000-0000-000000000026', 'f0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Room D104', '1', 'RB-D104', 'classroom', 40, true, 0, 2, 2, 1),
  ('e0000000-0000-0000-0000-000000000027', 'f0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Room D103', '1', 'RB-D103', 'classroom', 40, true, 2, 2, 2, 1),
  ('e0000000-0000-0000-0000-000000000028', 'f0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Room D102', '1', 'RB-D102', 'classroom', 40, true, 4, 2, 2, 1),
  ('e0000000-0000-0000-0000-000000000029', 'f0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Room A104', '1', 'RB-A104', 'classroom', 40, true, 7, 2, 2, 1),
  ('e0000000-0000-0000-0000-000000000030', 'f0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Room A103', '1', 'RB-A103', 'classroom', 40, true, 9, 2, 2, 1),
  ('e0000000-0000-0000-0000-000000000031', 'f0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Room A102', '1', 'RB-A102', 'classroom', 40, true, 11, 2, 2, 1),
  ('e0000000-0000-0000-0000-000000000032', 'f0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Stairs North', '1', 'RB-ST1', 'stairs', null, false, 6, 0, 1, 1),
  ('e0000000-0000-0000-0000-000000000033', 'f0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Stairs South', '1', 'RB-ST2', 'stairs', null, false, 6, 2, 1, 1),
  ('e0000000-0000-0000-0000-000000000034', 'f0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'Lab 102', '2', 'RB-LAB-102', 'lab', 30, true, 7, 0, 3, 1),
  ('e0000000-0000-0000-0000-000000000035', 'f0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'Lecture Hall 2', '2', 'RB-LH-102', 'classroom', 60, true, 10, 0, 3, 1),
  ('e0000000-0000-0000-0000-000000000036', 'f0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'Seminar 201', '2', 'RB-SEM-201', 'classroom', 80, true, 0, 2, 4, 1),
  ('e0000000-0000-0000-0000-000000000037', 'f0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'Faculty Lounge', '2', 'RB-FL-201', 'classroom', 15, false, 4, 2, 2, 1),
  ('e0000000-0000-0000-0000-000000000038', 'f0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'Lab 103', '2', 'RB-LAB-103', 'lab', 30, true, 7, 2, 3, 1),
  ('e0000000-0000-0000-0000-000000000039', 'f0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'Server Room', '2', 'RB-SRV-201', 'lab', null, false, 10, 2, 3, 1),
  ('e0000000-0000-0000-0000-000000000040', 'f0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'Stairs', '2', 'RB-ST3', 'stairs', null, false, 6, 0, 1, 1),
  ('e0000000-0000-0000-0000-000000000041', 'f0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002', 'FH 101', '1', 'FH-101', 'classroom', 50, true, 0, 0, 3, 1),
  ('e0000000-0000-0000-0000-000000000042', 'f0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002', 'FH 102', '1', 'FH-102', 'classroom', 50, true, 3, 0, 3, 1),
  ('e0000000-0000-0000-0000-000000000043', 'f0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002', 'FH 103', '1', 'FH-103', 'classroom', 50, true, 6, 0, 3, 1),
  ('e0000000-0000-0000-0000-000000000044', 'f0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002', 'FH 104', '1', 'FH-104', 'classroom', 50, true, 0, 2, 3, 1),
  ('e0000000-0000-0000-0000-000000000045', 'f0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002', 'FH 105', '1', 'FH-105', 'classroom', 50, true, 3, 2, 3, 1),
  ('e0000000-0000-0000-0000-000000000046', 'f0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002', 'Drawing Hall', '1', 'FH-DH', 'hall', 120, true, 6, 2, 3, 1),
  ('e0000000-0000-0000-0000-000000000047', 'f0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000002', 'FH 201', '2', 'FH-201', 'classroom', 50, true, 3, 0, 3, 1),
  ('e0000000-0000-0000-0000-000000000048', 'f0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000002', 'FH 202', '2', 'FH-202', 'classroom', 50, true, 6, 0, 3, 1),
  ('e0000000-0000-0000-0000-000000000049', 'f0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000002', 'Seminar Hall FH', '2', 'FH-SEM', 'hall', 100, true, 0, 2, 5, 1),
  ('e0000000-0000-0000-0000-000000000050', 'f0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000002', 'Electronics Lab', '2', 'FH-ELAB', 'lab', 35, true, 5, 2, 4, 1);

-- Some wing rooms are in use on weekday mornings so the plan shows both states
insert into public.timetable_entries (room_id, weekday, period_id, course, section, faculty_name)
select r.id, w.d, p.id, 'Scheduled class', 'CSE-' || right(r.code, 1), 'Dr. Venkatesh Rao'
from public.rooms r cross join (values (1), (2), (3), (4), (5)) as w(d)
join public.periods p on p.label in ('Period 3', 'Period 4')
where r.code in ('RB-F102', 'RB-C102', 'RB-D104', 'RB-D103', 'RB-D102', 'RB-A104', 'RB-A102', 'RB-LAB-102', 'FH-102');
