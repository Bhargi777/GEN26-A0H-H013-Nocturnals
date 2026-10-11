-- Web push: per-user subscriptions and a trigger that hands every new notification to the app's push route.
create extension if not exists pg_net;

create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_push_subscriptions_user on push_subscriptions(user_id);
alter table push_subscriptions enable row level security;
create policy "Own push subscriptions" on push_subscriptions for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Where to send pushes. Set per environment after deploy; the secret never lives in the repo.
create table if not exists app_settings (key text primary key, value text not null);
alter table app_settings enable row level security;   -- no policies: only the database owner and definer functions read it

create or replace function public.push_on_notification() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_url text;
  v_secret text;
  v_subs jsonb;
begin
  select value into v_url from app_settings where key = 'push_url';
  select value into v_secret from app_settings where key = 'push_secret';
  if v_url is null or v_secret is null then return new; end if;
  select coalesce(jsonb_agg(jsonb_build_object('endpoint', endpoint, 'p256dh', p256dh, 'auth', auth)), '[]'::jsonb)
    into v_subs from push_subscriptions where user_id = new.user_id;
  if jsonb_array_length(v_subs) = 0 then return new; end if;
  perform net.http_post(
    url := v_url,
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-push-secret', v_secret),
    body := jsonb_build_object('subscriptions', v_subs, 'title', new.title, 'body', new.body, 'link', new.link, 'tag', new.id::text)
  );
  return new;
exception when others then
  return new;   -- a failed push must never block the action that created the notification
end $$;
drop trigger if exists push_on_notification on notifications;
create trigger push_on_notification after insert on notifications for each row execute procedure push_on_notification();

-- Lets a signed-in user send themselves a test notification (used by the demo button)
create or replace function public.send_test_notification() returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Sign in first.'; end if;
  insert into notifications (user_id, title, body, link)
  values (auth.uid(), 'Test notification', 'If you can read this in your notification centre, push works.', '/notifications');
end $$;
grant execute on function public.send_test_notification() to authenticated;
