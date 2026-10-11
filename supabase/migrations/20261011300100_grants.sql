-- Supabase no longer grants table privileges to API roles by default.
-- RLS policies decide what each signed-in user can actually touch.
grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;

alter default privileges in schema public grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public grant usage, select on sequences to authenticated;
