-- Service requests: followers ("I have this issue too") get the same
-- notifications as the requester. Owner: Dev 3.
--
-- transition_ticket and reassign_ticket_department (Dev 1) write the requester's
-- notification with the link /service-requests/<ticket id>. This trigger copies
-- each such notification to the ticket's followers in the same transaction,
-- without changing Dev 1's functions. Links by code are matched too.

create or replace function public.copy_ticket_notification_to_followers()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Copies are inserted into the same table; never copy a copy.
  if pg_trigger_depth() > 1 then
    return new;
  end if;

  insert into public.notifications (user_id, title, body, link)
  select f.user_id, new.title, new.body, new.link
  from public.service_tickets t
  join public.ticket_followers f on f.ticket_id = t.id
  where t.requester_id = new.user_id
    and split_part(coalesce(new.link, ''), '?', 1)
        in ('/service-requests/' || t.id::text, '/service-requests/' || t.code)
    and f.user_id <> t.requester_id;

  return new;
end;
$$;

revoke all on function public.copy_ticket_notification_to_followers() from public, anon, authenticated;

drop trigger if exists notifications_copy_to_ticket_followers on public.notifications;
create trigger notifications_copy_to_ticket_followers
  after insert on public.notifications
  for each row execute function public.copy_ticket_notification_to_followers();
