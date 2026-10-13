import { parseAcademicCalendar } from "@/lib/academic-calendar";

export async function GET(request: Request) {
  const from = new URL(request.url).searchParams.get("from");
  const to = new URL(request.url).searchParams.get("to");
  const isDate = (value: string | null) => {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  };
  if (!from || !to || !isDate(from) || !isDate(to) || from > to) {
    return Response.json({ error: "Provide a valid from and to date." }, { status: 400 });
  }

  const feedUrl = process.env.ACADEMIC_CALENDAR_ICS_URL;
  if (!feedUrl) {
    return Response.json({ error: "Academic calendar feed is not configured." }, { status: 503 });
  }

  let url: URL;
  try {
    url = new URL(feedUrl);
  } catch {
    return Response.json({ error: "Academic calendar feed URL is invalid." }, { status: 500 });
  }
  if (url.protocol !== "https:") {
    return Response.json({ error: "Academic calendar feed URL must use HTTPS." }, { status: 500 });
  }

  let response: Response;
  try {
    response = await fetch(url, { next: { revalidate: 3600 }, signal: AbortSignal.timeout(10_000) });
  } catch {
    return Response.json({ error: "Academic calendar feed could not be loaded." }, { status: 502 });
  }
  if (!response.ok) {
    return Response.json({ error: "Academic calendar feed could not be fetched." }, { status: 502 });
  }

  let events: ReturnType<typeof parseAcademicCalendar>;
  try {
    events = parseAcademicCalendar(await response.text());
  } catch {
    return Response.json({ error: "Academic calendar feed contains invalid iCalendar data." }, { status: 502 });
  }
  if (events.length === 0) {
    return Response.json({ error: "Academic calendar feed contains no events." }, { status: 502 });
  }
  return Response.json(events.filter((event) => event.event_date >= from && event.event_date <= to));
}
