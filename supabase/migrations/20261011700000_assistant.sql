-- Campus assistant: a searchable knowledge base (full text + trigram) and a per-user rate limit.

create table if not exists kb_chunks (
  id serial primary key,
  source text not null,
  title text not null,
  body text not null,
  tsv tsvector generated always as (to_tsvector('english', title || ' ' || body)) stored
);
create index if not exists kb_chunks_tsv on kb_chunks using gin (tsv);
create index if not exists kb_chunks_trgm on kb_chunks using gin ((title || ' ' || body) gin_trgm_ops);
alter table kb_chunks enable row level security;
create policy "Everyone signed in reads the help" on kb_chunks for select to authenticated using (true);
grant select on kb_chunks to authenticated;

-- Hybrid ranking: full-text rank plus trigram similarity, so both exact words and loose phrasing match.
create or replace function public.search_kb(q text, k int default 3)
returns table (id int, source text, title text, body text, score real)
language sql stable security definer set search_path = public, extensions as $$
  select c.id, c.source, c.title, c.body,
    (coalesce(ts_rank(c.tsv, websearch_to_tsquery('english', q)), 0) * 2
      + similarity(c.title || ' ' || c.body, q))::real as score
  from kb_chunks c
  where c.tsv @@ websearch_to_tsquery('english', q) or similarity(c.title || ' ' || c.body, q) > 0.05
  order by score desc
  limit greatest(1, least(k, 8))
$$;
grant execute on function public.search_kb(text, int) to authenticated;

-- 20 assistant messages per user per minute (fixed window)
create table if not exists assistant_usage (
  user_id uuid primary key references profiles(id) on delete cascade,
  window_start timestamptz not null default now(),
  hits int not null default 0
);
alter table assistant_usage enable row level security;   -- only the definer function touches it

create or replace function public.assistant_hit() returns boolean
language plpgsql security definer set search_path = public as $$
declare v_row assistant_usage;
begin
  if auth.uid() is null then return false; end if;
  insert into assistant_usage (user_id) values (auth.uid()) on conflict (user_id) do nothing;
  select * into v_row from assistant_usage where user_id = auth.uid() for update;
  if v_row.window_start < now() - interval '1 minute' then
    update assistant_usage set window_start = now(), hits = 1 where user_id = auth.uid();
    return true;
  end if;
  if v_row.hits >= 20 then return false; end if;
  update assistant_usage set hits = hits + 1 where user_id = auth.uid();
  return true;
end $$;
grant execute on function public.assistant_hit() to authenticated;

insert into kb_chunks (source, title, body) values
('rooms', 'Who can book a room', 'Faculty and class representatives can request rooms. Open Book a room, pick the block, floor, date and period, then choose a green room on the floor plan. The department that owns the block approves or rejects the request, and you are notified either way.'),
('rooms', 'How far ahead can I book a room', 'Room requests can be made for today up to 14 days ahead, in Indian Standard Time. A period that has already ended today cannot be booked.'),
('rooms', 'Room availability colours', 'On the floor plan green means free for that date and period, amber means someone has already requested it and the department will choose, red means booked or a scheduled class is using it, and grey rooms such as stairs cannot be booked.'),
('rooms', 'Double booking and competing requests', 'A room can only have one approved booking per date and period. Several people may request the same slot; when the department approves one, the others are rejected automatically with the note Slot allocated to another request.'),
('rooms', 'Find me a room', 'The Find me a room button uses the date, period and number of attendees to suggest the smallest free rooms that fit your group across all blocks. Picking a suggestion selects it on the floor plan.'),
('rooms', 'Cancelling a class frees the room', 'Faculty can open My classes and cancel one class for one date. The room becomes free for that date only and the class representative of that section is notified.'),
('canteen', 'How canteen ordering works', 'Choose a canteen, add items to your cart, pick a 15 minute pickup slot and place the order. You get a token such as MAIN-004. Pay at the counter, the kitchen prepares it, and you collect it when your token shows as ready.'),
('canteen', 'Which pickup slots can I choose', 'A pickup slot must start at least 15 minutes from now and end within the next 60 minutes, in Indian Standard Time. Full slots cannot be chosen.'),
('canteen', 'Forfeited orders', 'If an order is not paid at the counter before its pickup slot ends, it is forfeited automatically and you are notified.'),
('canteen', 'Collecting an order', 'When your order is ready you get a notification. At handover the staff tick each item as given; the bill only closes once every item is ticked.'),
('canteen', 'Canteen staff screens', 'Each kitchen, counter and manager works for one canteen only and can never see or change another canteen''s orders. Kitchen marks paid orders ready, the counter takes payment and hands over, and the manager edits that canteen''s menu and pickup slots.'),
('events', 'How to request an event', 'Club presidents request events for their own club from Request an event. Events must be at least 7 days ahead, between 7:00 AM and 11:00 PM, at most 8 hours long, and fit the hall''s capacity.'),
('events', 'Event approval steps', 'Student affairs (OSA) reviews each request and can approve it, ask for changes or reject it. Approved requests go to the campus director for final approval, and the events department then adds them to the campus calendar. The club is notified at every step.'),
('events', 'Campus calendar', 'Every event the campus director has approved appears on the campus calendar for everyone. Overlapping events on the same day are shown side by side on the day timeline.'),
('events', 'Hall clashes', 'Two approved events cannot use the same hall at overlapping times. The event form warns you while you type if the hall is already booked then.'),
('service', 'Reporting an issue', 'Use Report an issue to describe a broken projector, network problem, leak or similar. The app suggests a category and routes it to the right department. You can follow similar existing tickets instead of filing duplicates.'),
('service', 'Service request response targets', 'Targets by priority: urgent within 4 hours, high within 24 hours, medium within 72 hours, low within 7 days. Tickets past their target are marked overdue for the department.'),
('service', 'Service request steps', 'A ticket moves from open to assigned to a technician, then in progress, then resolved. You confirm the fix and rate it to close the ticket, or say it is still broken to reopen it. You can also close an open or reopened request yourself if you no longer need it.'),
('account', 'Accounts and roles', 'Accounts are created by the campus administrator; there is no public sign-up. The administrator assigns roles such as student, faculty, class representative, club president, department office, canteen staff and others.'),
('account', 'Phone notifications and the app', 'Install the app from the banner on your phone or download the Android app from the sign-in page. Turn on phone notifications on the Notifications page to get alerts in your notification centre even when the app is closed. On iPhone, add the app to the Home Screen first.');
