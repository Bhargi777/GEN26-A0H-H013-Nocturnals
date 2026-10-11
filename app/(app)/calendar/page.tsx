"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Badge, Button, Card, EmptyState, FieldError, PageHeader, Skeleton } from "@/components/ui";
import { assignLanes, minutesOf } from "@/lib/algo/intervals";
import { groupByDate, monthGrid, shiftMonth } from "@/lib/calendar-grid";
import { listCalendar } from "@/lib/db/calendar";
import { formatClock, formatDay, istDate } from "@/lib/time";
import type { CalendarEvent } from "@/lib/types/campus";
import { useLiveRefresh } from "@/components/layout/live-sync";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAY_START = 7 * 60;
const DAY_END = 23 * 60;

/** One day as a timeline. Overlapping events share the width: each gets a lane from interval partitioning. */
function DayTimeline({ events }: { events: CalendarEvent[] }) {
  const { placed, laneCount } = useMemo(() => assignLanes(events.map((event) => ({ event, start: minutesOf(event.start_time), end: minutesOf(event.end_time) }))), [events]);
  const hours = Array.from({ length: (DAY_END - DAY_START) / 60 + 1 }, (_, index) => DAY_START / 60 + index);
  const height = 48 * (hours.length - 1);
  return <div className="relative ml-14 overflow-hidden rounded-control border bg-surface" style={{ height }} role="list" aria-label="Events of the day by time">
    {hours.map((hour, index) => <div key={hour} aria-hidden="true" className="absolute left-0 right-0 border-t text-secondary" style={{ top: index * 48 }}><span className="absolute -left-14 -top-3 w-12 text-right">{formatClock(`${String(hour).padStart(2, "0")}:00`)}</span></div>)}
    {placed.map(({ item, lane }) => {
      const top = ((Math.max(item.start, DAY_START) - DAY_START) / 60) * 48;
      const blockHeight = Math.max(28, ((Math.min(item.end, DAY_END) - Math.max(item.start, DAY_START)) / 60) * 48);
      return <div key={item.event.id} role="listitem" className="absolute overflow-hidden rounded-control border border-accent bg-accent-light p-2 text-accent" style={{ top, height: blockHeight, left: `${(lane / laneCount) * 100}%`, width: `${100 / laneCount}%` }}>
        <p className="truncate font-medium">{item.event.title}</p>
        <p className="truncate">{formatClock(item.event.start_time)}–{formatClock(item.event.end_time)} · {item.event.hall_name ?? "Hall tbc"}</p>
      </div>;
    })}
  </div>;
}

export default function CampusCalendarPage() {
  const today = istDate(0);
  const [year, setYear] = useState(Number(today.slice(0, 4)));
  const [month, setMonth] = useState(Number(today.slice(5, 7)));
  const [selected, setSelected] = useState(today);
  const [events, setEvents] = useState<CalendarEvent[]>();
  const [error, setError] = useState<string>();

  const grid = useMemo(() => monthGrid(year, month), [year, month]);
  const from = grid[0].date;
  const to = grid[grid.length - 1].date;

  const load = useCallback(async () => {
    try { setEvents(await listCalendar(from, to)); setError(undefined); }
    catch { setError("The calendar could not be loaded. Try again."); }
  }, [from, to]);

  // Reload on a slow timer and whenever the tab regains focus, so a newly approved event shows up for everyone.
  useLiveRefresh(load);
  useEffect(() => {
    const first = setTimeout(() => void load(), 0);
    const poll = setInterval(() => void load(), 60_000);
    const onFocus = () => { if (document.visibilityState === "visible") void load(); };
    document.addEventListener("visibilitychange", onFocus);
    return () => { clearTimeout(first); clearInterval(poll); document.removeEventListener("visibilitychange", onFocus); };
  }, [load]);

  const byDay = useMemo(() => groupByDate(events ?? []), [events]);
  const move = (by: number) => { const next = shiftMonth(year, month, by); setYear(next.year); setMonth(next.month); };

  if (error && !events) return <EmptyState message={error} action={<Button onClick={() => void load()}>Try again</Button>} />;
  if (!events) return <Skeleton label="Loading calendar" rows={5} />;
  const dayEvents = byDay.get(selected) ?? [];

  return <div className="space-y-6">
    <PageHeader title="Campus calendar" context="Every event the campus director has approved. It updates for everyone as soon as an event is approved." />
    <FieldError>{error}</FieldError>
    <Card className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 aria-live="polite">{MONTHS[month - 1]} {year}</h2>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" aria-label="Previous month" onClick={() => move(-1)}><ChevronLeft size={16} aria-hidden="true" /></Button>
          <Button variant="secondary" size="sm" onClick={() => { setYear(Number(today.slice(0, 4))); setMonth(Number(today.slice(5, 7))); setSelected(today); }}>Today</Button>
          <Button variant="secondary" size="sm" aria-label="Next month" onClick={() => move(1)}><ChevronRight size={16} aria-hidden="true" /></Button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <div className="grid min-w-[640px] grid-cols-7 gap-px rounded-control border bg-border" role="grid" aria-label={`${MONTHS[month - 1]} ${year}`}>
          {WEEKDAYS.map((day) => <div key={day} role="columnheader" className="bg-background p-2 text-center font-medium">{day}</div>)}
          {grid.map((day) => {
            const list = byDay.get(day.date) ?? [];
            const isSelected = day.date === selected;
            return <button key={day.date} type="button" role="gridcell" aria-selected={isSelected} aria-label={`${formatDay(day.date)}, ${list.length} events`} onClick={() => setSelected(day.date)}
              className={`min-h-24 space-y-1 bg-surface p-2 text-left align-top hover:bg-background ${day.inMonth ? "" : "text-secondary"} ${isSelected ? "outline outline-2 -outline-offset-2 outline-accent" : ""}`}>
              <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full ${day.date === today ? "bg-accent text-surface" : ""}`}>{Number(day.date.slice(8))}</span>
              {list.slice(0, 2).map((event) => <span key={event.id} className="block truncate rounded-control bg-accent-light px-1 text-accent">{event.title}</span>)}
              {list.length > 2 && <span className="block text-secondary">+{list.length - 2} more</span>}
            </button>;
          })}
        </div>
      </div>
    </Card>

    <section aria-labelledby="day-heading" className="space-y-3">
      <h2 id="day-heading">{formatDay(selected)}</h2>
      {dayEvents.length === 0 ? <p className="text-secondary">No approved events on this day.</p> : <>
        <ul className="space-y-2">{dayEvents.map((event) => <li key={event.id}><Card className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0"><p className="font-medium">{event.title}</p><p className="text-secondary">{event.club_name} · {event.hall_name ?? "Hall to be confirmed"} · {formatClock(event.start_time)}–{formatClock(event.end_time)}</p></div>
          <Badge tone={event.status === "CALENDARED" ? "green" : "blue"}>{event.status === "CALENDARED" ? "On the calendar" : "Approved"}</Badge>
        </Card></li>)}</ul>
        <DayTimeline events={dayEvents} />
      </>}
    </section>
  </div>;
}
