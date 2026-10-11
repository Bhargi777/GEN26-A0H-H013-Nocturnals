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
  ('bl000000-0000-0000-0000-000000000001', 'RB-1', 'Ramanujan Block 1', 'd0000000-0000-0000-0000-000000000001'),
  ('bl000000-0000-0000-0000-000000000002', 'FH-1', 'Faraday Hall 1', 'd0000000-0000-0000-0000-000000000002');

-- Floors
insert into public.floors (id, block_id, level, label, grid_cols, grid_rows) values
  ('f0000000-0000-0000-0000-000000000001', 'bl000000-0000-0000-0000-000000000001', 1, 'Floor 1', 4, 4),
  ('f0000000-0000-0000-0000-000000000002', 'bl000000-0000-0000-0000-000000000001', 2, 'Floor 2', 4, 4);

-- Rooms (including halls for events)
insert into public.rooms (id, floor_id, building_id, name, floor, code, kind, capacity, bookable) values
  ('r0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Lab 101', '1', 'RB-LAB-101', 'lab', 30, true),
  ('r0000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Lecture Hall 1', '1', 'RB-LH-101', 'classroom', 60, true),
  ('r0000000-0000-0000-0000-000000000003', 'f0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 'Staff Room 12', '2', 'FH-SR-201', 'classroom', 20, true),
  ('r0000000-0000-0000-0000-000000000004', NULL, 'b0000000-0000-0000-0000-000000000003', 'Room 304', '3', 'MH-304', 'classroom', 2, true),
  ('r0000000-0000-0000-0000-000000000005', NULL, 'b0000000-0000-0000-0000-000000000004', 'Registrar Office', 'G', 'AB-REG', 'classroom', 10, false),
  ('r0000000-0000-0000-0000-000000000006', NULL, 'b0000000-0000-0000-0000-000000000005', 'Main Auditorium', '1', 'AUD-MAIN', 'hall', 500, true),
  ('r0000000-0000-0000-0000-000000000007', NULL, 'b0000000-0000-0000-0000-000000000005', 'Seminar Hall A', '1', 'AUD-SEM-A', 'hall', 150, true),
  ('r0000000-0000-0000-0000-000000000008', NULL, 'b0000000-0000-0000-0000-000000000005', 'Seminar Hall B', '1', 'AUD-SEM-B', 'hall', 100, true),
  ('r0000000-0000-0000-0000-000000000009', NULL, 'b0000000-0000-0000-0000-000000000006', 'Sports Hall', '1', 'SC-HALL', 'hall', 200, true);

-- Periods
insert into public.periods (id, label, start_time, end_time) values
  ('p0000000-0000-0000-0000-000000000001', 'Period 1', '07:00:00', '08:00:00'),
  ('p0000000-0000-0000-0000-000000000002', 'Period 2', '08:00:00', '09:00:00'),
  ('p0000000-0000-0000-0000-000000000003', 'Period 3', '09:00:00', '10:00:00'),
  ('p0000000-0000-0000-0000-000000000004', 'Period 4', '10:15:00', '11:15:00'),
  ('p0000000-0000-0000-0000-000000000005', 'Period 5', '11:15:00', '12:15:00'),
  ('p0000000-0000-0000-0000-000000000006', 'Period 6', '13:00:00', '14:00:00'),
  ('p0000000-0000-0000-0000-000000000007', 'Period 7', '14:00:00', '15:00:00'),
  ('p0000000-0000-0000-0000-000000000008', 'Period 8', '15:00:00', '16:00:00');

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
  ('cn000000-0000-0000-0000-000000000001', 'MAIN', 'Main Canteen', 'Building A, Ground Floor'),
  ('cn000000-0000-0000-0000-000000000002', 'NORTH', 'North Canteen', 'Building B, Ground Floor'),
  ('cn000000-0000-0000-0000-000000000003', 'SOUTH', 'South Canteen', 'Building C, First Floor');

-- Menu Items
insert into public.menu_items (id, canteen_id, name, price, category, veg, available) values
  -- Main Canteen
  ('mi000000-0000-0000-0000-000000000001', 'cn000000-0000-0000-0000-000000000001', 'Biryani (Chicken)', 150, 'rice', false, true),
  ('mi000000-0000-0000-0000-000000000002', 'cn000000-0000-0000-0000-000000000001', 'Biryani (Vegetable)', 120, 'rice', true, true),
  ('mi000000-0000-0000-0000-000000000003', 'cn000000-0000-0000-0000-000000000001', 'Butter Chicken', 180, 'curry', false, true),
  ('mi000000-0000-0000-0000-000000000004', 'cn000000-0000-0000-0000-000000000001', 'Paneer Butter Masala', 160, 'curry', true, true),
  ('mi000000-0000-0000-0000-000000000005', 'cn000000-0000-0000-0000-000000000001', 'Dosa', 80, 'breakfast', true, true),
  ('mi000000-0000-0000-0000-000000000006', 'cn000000-0000-0000-0000-000000000001', 'Tea', 20, 'beverage', true, true),
  -- North Canteen
  ('mi000000-0000-0000-0000-000000000007', 'cn000000-0000-0000-0000-000000000002', 'Naan with Chole', 100, 'bread', true, true),
  ('mi000000-0000-0000-0000-000000000008', 'cn000000-0000-0000-0000-000000000002', 'Roti (3 pieces)', 90, 'bread', true, true),
  ('mi000000-0000-0000-0000-000000000009', 'cn000000-0000-0000-0000-000000000002', 'Vada Pav', 50, 'snack', true, true),
  ('mi000000-0000-0000-0000-000000000010', 'cn000000-0000-0000-0000-000000000002', 'Chai', 20, 'beverage', true, true),
  -- South Canteen
  ('mi000000-0000-0000-0000-000000000011', 'cn000000-0000-0000-0000-000000000003', 'Pesarattu', 80, 'breakfast', true, true),
  ('mi000000-0000-0000-0000-000000000012', 'cn000000-0000-0000-0000-000000000003', 'Upma', 60, 'breakfast', true, true),
  ('mi000000-0000-0000-0000-000000000013', 'cn000000-0000-0000-0000-000000000003', 'Lemon Rice', 80, 'rice', true, true),
  ('mi000000-0000-0000-0000-000000000014', 'cn000000-0000-0000-0000-000000000003', 'Filter Coffee', 30, 'beverage', true, true);

-- Canteen Slots
insert into public.canteen_slots (id, canteen_id, slot_date, start_time, end_time, capacity) values
  -- Main Canteen
  ('cs000000-0000-0000-0000-000000000001', 'cn000000-0000-0000-0000-000000000001', CURRENT_DATE, '07:00:00', '09:00:00', 100),
  ('cs000000-0000-0000-0000-000000000002', 'cn000000-0000-0000-0000-000000000001', CURRENT_DATE, '12:00:00', '14:00:00', 150),
  ('cs000000-0000-0000-0000-000000000003', 'cn000000-0000-0000-0000-000000000001', CURRENT_DATE, '17:00:00', '19:00:00', 100),
  -- North Canteen
  ('cs000000-0000-0000-0000-000000000004', 'cn000000-0000-0000-0000-000000000002', CURRENT_DATE, '07:30:00', '09:30:00', 80),
  ('cs000000-0000-0000-0000-000000000005', 'cn000000-0000-0000-0000-000000000002', CURRENT_DATE, '12:30:00', '14:30:00', 120),
  -- South Canteen
  ('cs000000-0000-0000-0000-000000000006', 'cn000000-0000-0000-0000-000000000003', CURRENT_DATE, '08:00:00', '10:00:00', 100),
  ('cs000000-0000-0000-0000-000000000007', 'cn000000-0000-0000-0000-000000000003', CURRENT_DATE, '13:00:00', '15:00:00', 150);

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
  ('u0000000-0000-0000-0000-000000000007', 'osa.staff@example.edu', crypt('password123', gen_salt('bf')), now(), '{"full_name": "Meera Iyer"}'),
  ('u0000000-0000-0000-0000-000000000008', 'director.campus@example.edu', crypt('password123', gen_salt('bf')), now(), '{"full_name": "Dr. Campus Director"}'),
  ('u0000000-0000-0000-0000-000000000009', 'club.president@example.edu', crypt('password123', gen_salt('bf')), now(), '{"full_name": "Rohit Kumar"}'),
  ('u0000000-0000-0000-0000-000000000010', 'admin.sys@example.edu', crypt('password123', gen_salt('bf')), now(), '{"full_name": "System Admin"}');

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
