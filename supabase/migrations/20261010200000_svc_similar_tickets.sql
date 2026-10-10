-- Service requests: duplicate detection for the report form.
-- Owner: Dev 3. Adds a function and an index only; core tables belong to Dev 1.

create extension if not exists pg_trgm with schema extensions;

-- Narrows the scan to one building's recent tickets before scoring.
create index if not exists service_tickets_building_created_idx
  on public.service_tickets (building_id, created_at desc);

-- Top 3 open tickets in the same building from the last 14 days whose title or
-- description looks like p_text. Security definer because a student's RLS only
-- shows their own tickets, while duplicates come from anyone; it therefore
-- returns no requester or personal data, only what the form shows.
create or replace function public.find_similar_tickets(p_building_id uuid, p_text text)
returns table (
  id uuid,
  code text,
  title text,
  status text,
  created_at timestamptz,
  similarity real
)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select t.id, t.code, t.title, t.status::text, t.created_at, s.score
  from public.service_tickets t
  cross join lateral (
    select greatest(
      -- Overall overlap between the two complaints.
      extensions.similarity(t.title || ' ' || t.description, p_text),
      -- How closely the existing title appears somewhere in the new text.
      extensions.word_similarity(t.title, p_text)
    ) as score
  ) s
  where auth.uid() is not null
    and length(trim(coalesce(p_text, ''))) >= 10
    and t.building_id = p_building_id
    and t.status::text in ('OPEN', 'ASSIGNED', 'IN_PROGRESS', 'REOPENED')
    and t.created_at >= now() - interval '14 days'
    -- 0.4 keeps paraphrases (0.5 and up in testing) and drops tickets that only
    -- share filler such as "in the room" (up to 0.37).
    and s.score >= 0.4
  order by s.score desc, t.created_at desc
  limit 3;
$$;

revoke all on function public.find_similar_tickets(uuid, text) from public, anon;
grant execute on function public.find_similar_tickets(uuid, text) to authenticated;
