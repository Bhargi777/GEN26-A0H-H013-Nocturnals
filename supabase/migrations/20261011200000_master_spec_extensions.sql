-- MASTER-SPEC Extension: Rooms (Module A), Events (Module B), Canteen (Module D)
-- Extends existing schema with new tables and roles for complete CampusConnect

-- Enable btree_gist for exclusion constraints (event hall conflicts)
create extension if not exists "btree_gist";

-- ============================================================================
-- STEP 1: Update Role Enum (drop and recreate with all 14 roles)
-- ============================================================================

-- Create new type with all roles
create type user_role_new as enum (
  'student', 'faculty', 'cr', 'club_president', 'technician', 'dept_office',
  'dept_head', 'events_dept', 'osa', 'campus_director', 'canteen_kitchen',
  'canteen_counter', 'canteen_manager', 'admin'
);

-- Alter profiles table: change role column type
alter table profiles alter column role type user_role_new using role::text::user_role_new;

-- Drop old type and rename new one
drop type if exists user_role;
alter type user_role_new rename to user_role;

-- Add new columns to profiles for CR and club_president roles
alter table profiles add column if not exists section text;
alter table profiles add column if not exists club_id uuid;

-- ============================================================================
-- STEP 2: Module A - Classroom Booking Tables
-- ============================================================================

-- Academic blocks (owned by departments)
create table if not exists blocks (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  owner_department_id uuid not null references departments(id) on delete restrict,
  created_at timestamptz not null default now()
);

-- Floors within blocks
create table if not exists floors (
  id uuid primary key default gen_random_uuid(),
  block_id uuid not null references blocks(id) on delete cascade,
  level integer not null,
  label text not null,
  grid_cols integer not null default 10,
  grid_rows integer not null default 10,
  created_at timestamptz not null default now(),
  unique(block_id, level)
);

-- Periods (timetable slots)
create table if not exists periods (
  id uuid primary key default gen_random_uuid(),
  label text not null unique,
  start_time time not null,
  end_time time not null,
  created_at timestamptz not null default now()
);

-- Update rooms table to use floor_id instead of building_id, add grid positioning
alter table rooms drop constraint if exists "rooms_building_id_fkey";
alter table rooms drop column if exists building_id;
alter table rooms add column if not exists floor_id uuid references floors(id) on delete cascade;
alter table rooms add column if not exists code text;
alter table rooms add column if not exists kind text check (kind in ('classroom', 'lab', 'hall', 'corridor', 'stairs', 'washroom', 'lift'));
alter table rooms add column if not exists capacity integer;
alter table rooms add column if not exists equipment text[];
alter table rooms add column if not exists grid_x integer;
alter table rooms add column if not exists grid_y integer;
alter table rooms add column if not exists grid_w integer default 1;
alter table rooms add column if not exists grid_h integer default 1;
alter table rooms add column if not exists bookable boolean default true;
alter table rooms add column if not exists created_at timestamptz default now();

-- Timetable entries
create table if not exists timetable_entries (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  weekday integer not null check (weekday >= 0 and weekday <= 6),
  period_id uuid not null references periods(id) on delete cascade,
  course text not null,
  section text not null,
  faculty_name text not null,
  created_at timestamptz not null default now(),
  unique(room_id, weekday, period_id)
);

-- Class cancellations (frees room for that date only)
create table if not exists class_cancellations (
  id uuid primary key default gen_random_uuid(),
  timetable_entry_id uuid not null references timetable_entries(id) on delete cascade,
  date date not null,
  cancelled_by uuid not null references profiles(id) on delete restrict,
  reason text,
  created_at timestamptz not null default now()
);

-- Room booking requests
create sequence if not exists room_bookings_seq start 1000;

create table if not exists room_bookings (
  id uuid primary key default gen_random_uuid(),
  code text not null default 'RB-' || lpad(nextval('room_bookings_seq')::text, 6, '0'),
  room_id uuid not null references rooms(id) on delete restrict,
  date date not null,
  period_id uuid not null references periods(id) on delete restrict,
  requested_by uuid not null references profiles(id) on delete cascade,
  reason text not null,
  faculty_name text not null,
  attendees integer not null,
  status text not null default 'PENDING' check (status in ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')),
  decided_by uuid references profiles(id) on delete set null,
  decision_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(room_id, date, period_id) where status = 'APPROVED'
);

create trigger handle_updated_at_room_bookings
  before update on room_bookings
  for each row execute procedure handle_updated_at();

-- ============================================================================
-- STEP 3: Module B - Events and Hall Approvals
-- ============================================================================

create table if not exists clubs (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  created_at timestamptz not null default now()
);

create type event_request_status as enum ('SUBMITTED', 'CHANGES_REQUESTED', 'PENDING_DIRECTOR', 'APPROVED', 'REJECTED', 'CALENDARED');

create sequence if not exists event_requests_seq start 1000;

create table if not exists event_requests (
  id uuid primary key default gen_random_uuid(),
  code text not null default 'EV-' || lpad(nextval('event_requests_seq')::text, 6, '0'),
  club_id uuid not null references clubs(id) on delete restrict,
  requested_by uuid not null references profiles(id) on delete cascade,
  title text not null,
  description text not null,
  event_type text not null,
  event_date date not null,
  start_time time not null,
  end_time time not null,
  hall_id uuid not null references rooms(id) on delete restrict,
  expected_attendance integer not null,
  resources_needed text[],
  faculty_coordinator text not null,
  contact_phone text not null,
  budget_estimate numeric(12, 2),
  form_pdf_path text,
  status event_request_status not null default 'SUBMITTED',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger handle_updated_at_event_requests
  before update on event_requests
  for each row execute procedure handle_updated_at();

-- Exclusion constraint: prevent overlapping events in the same hall (for specific statuses)
create table if not exists event_requests_check (
  id uuid primary key default gen_random_uuid(),
  hall_id uuid,
  event_date date,
  start_time time,
  end_time time,
  status event_request_status,
  exclude using gist (
    hall_id with =,
    event_date with =,
    tsrange(
      event_date::timestamp + start_time,
      event_date::timestamp + end_time
    ) with &&
  ) where (status in ('PENDING_DIRECTOR', 'APPROVED', 'CALENDARED'))
);

-- ============================================================================
-- STEP 4: Module D - Canteen Ordering
-- ============================================================================

create table if not exists canteens (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  location text not null,
  created_at timestamptz not null default now()
);

create table if not exists menu_items (
  id uuid primary key default gen_random_uuid(),
  canteen_id uuid not null references canteens(id) on delete cascade,
  name text not null,
  price numeric(8, 2) not null,
  category text not null,
  veg boolean not null,
  available boolean not null default true,
  prep_minutes integer,
  created_at timestamptz not null default now()
);

-- Canteen slots (15-minute increments)
create table if not exists canteen_slots (
  id uuid primary key default gen_random_uuid(),
  canteen_id uuid not null references canteens(id) on delete cascade,
  slot_date date not null,
  start_time time not null,
  end_time time not null,
  capacity integer not null default 50,
  created_at timestamptz not null default now(),
  unique(canteen_id, slot_date, start_time, end_time)
);

create type order_status as enum ('PLACED', 'PAID', 'COLLECTED', 'FORFEITED', 'LATE_WALKIN');

create sequence if not exists orders_seq start 1000;

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  token text not null,
  canteen_id uuid not null references canteens(id) on delete restrict,
  user_id uuid not null references profiles(id) on delete cascade,
  slot_id uuid not null references canteen_slots(id) on delete restrict,
  status order_status not null default 'PLACED',
  total numeric(12, 2) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  paid_at timestamptz,
  collected_at timestamptz
);

create trigger handle_updated_at_orders
  before update on orders
  for each row execute procedure handle_updated_at();

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  item_id uuid not null references menu_items(id) on delete restrict,
  quantity integer not null,
  unit_price numeric(8, 2) not null
);

-- ============================================================================
-- STEP 5: Update Entity Types and RLS
-- ============================================================================

-- Update entity_type_enum to include new entities
alter type entity_type_enum add value if not exists 'room_booking';
alter type entity_type_enum add value if not exists 'event_request';
alter type entity_type_enum add value if not exists 'canteen_order';

-- ============================================================================
-- STEP 6: Enable RLS on new tables
-- ============================================================================

alter table blocks enable row level security;
alter table floors enable row level security;
alter table periods enable row level security;
alter table rooms enable row level security;
alter table timetable_entries enable row level security;
alter table class_cancellations enable row level security;
alter table room_bookings enable row level security;
alter table clubs enable row level security;
alter table event_requests enable row level security;
alter table canteens enable row level security;
alter table menu_items enable row level security;
alter table canteen_slots enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

-- Basic RLS policies: students/faculty can read blocks, floors, periods, rooms, canteens, menu_items
create policy "Everyone can read blocks" on blocks for select to authenticated using (true);
create policy "Everyone can read floors" on floors for select to authenticated using (true);
create policy "Everyone can read periods" on periods for select to authenticated using (true);
create policy "Everyone can read canteens" on canteens for select to authenticated using (true);
create policy "Everyone can read menu items" on menu_items for select to authenticated using (true);
create policy "Everyone can read canteen slots" on canteen_slots for select to authenticated using (true);

-- CRs can view room bookings for their department
create policy "CRs see room bookings for their block" on room_bookings for select to authenticated using (
  exists (
    select 1 from rooms r
    join floors f on r.floor_id = f.id
    join blocks b on f.block_id = b.id
    join profiles p on p.id = auth.uid()
    where r.id = room_id and p.role = 'cr'
  )
);

-- Dept office can approve bookings
create policy "Dept office can update bookings for their block" on room_bookings for update to authenticated using (
  exists (
    select 1 from rooms r
    join floors f on r.floor_id = f.id
    join blocks b on f.block_id = b.id
    join profiles p on p.id = auth.uid()
    where r.id = room_id and p.role = 'dept_office' and b.owner_department_id = p.department_id
  )
);

-- Club presidents can view their event requests
create policy "Club presidents see their own event requests" on event_requests for select to authenticated using (
  requested_by = auth.uid() or exists (
    select 1 from profiles where id = auth.uid() and role = 'club_president'
  )
);

-- OSA, events_dept, campus_director, admin can see event requests
create policy "OSA and events_dept can view event requests" on event_requests for select to authenticated using (
  exists (select 1 from profiles where id = auth.uid() and role in ('osa', 'events_dept', 'campus_director', 'admin'))
);

-- Students can view canteen menu and place orders
create policy "Students can place orders" on orders for insert to authenticated with check (user_id = auth.uid());
create policy "Students can view their orders" on orders for select to authenticated using (user_id = auth.uid());
create policy "Canteen staff can view orders for their canteen" on orders for select to authenticated using (
  exists (
    select 1 from profiles p where p.id = auth.uid() and p.role in ('canteen_kitchen', 'canteen_counter', 'canteen_manager')
  )
);

-- ============================================================================
-- STEP 7: Indexes
-- ============================================================================

create index if not exists idx_blocks_department on blocks(owner_department_id);
create index if not exists idx_floors_block on floors(block_id);
create index if not exists idx_rooms_floor on rooms(floor_id);
create index if not exists idx_timetable_room on timetable_entries(room_id);
create index if not exists idx_class_cancel_date on class_cancellations(date);
create index if not exists idx_room_bookings_date on room_bookings(date);
create index if not exists idx_room_bookings_status on room_bookings(status);
create index if not exists idx_event_requests_date on event_requests(event_date);
create index if not exists idx_event_requests_status on event_requests(status);
create index if not exists idx_menu_items_canteen on menu_items(canteen_id);
create index if not exists idx_menu_items_available on menu_items(available);
create index if not exists idx_canteen_slots_date on canteen_slots(slot_date);
create index if not exists idx_orders_canteen on orders(canteen_id);
create index if not exists idx_orders_user on orders(user_id);
create index if not exists idx_orders_slot on orders(slot_id);
create index if not exists idx_orders_status on orders(status);
create index if not exists idx_order_items_order on order_items(order_id);
