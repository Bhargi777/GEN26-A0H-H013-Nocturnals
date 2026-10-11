"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { RoleGate } from "@/components/layout/role-gate";
import { useFrontend } from "@/components/layout/frontend-provider";
import { findOverlaps, minutesOf } from "@/lib/algo/intervals";
import { listCalendar } from "@/lib/db/calendar";
import { Button, Card, FieldError, FormField, Input, PageHeader, Select, Skeleton, Textarea, buttonStyles } from "@/components/ui";
import { ROLES } from "@/lib/constants/roles";
import { createEventRequest, listClubs, listHalls } from "@/lib/db/events";
import { istDate } from "@/lib/time";
import type { ClubRow, EventRow, HallRow } from "@/lib/types/campus";

const TYPES = ["cultural", "technical", "sports", "workshop", "talk", "other"];
type Field = "club" | "title" | "type" | "description" | "date" | "start" | "end" | "hall" | "coordinator" | "phone" | "attendance" | "budget";

export default function NewEventPage() {
  return <RoleGate roles={[ROLES.CLUB_PRESIDENT, ROLES.ADMIN]}><NewEvent /></RoleGate>;
}

const blank = { club: "", title: "", type: "cultural", description: "", date: "", start: "", end: "", hall: "", coordinator: "", phone: "", attendance: "", budget: "" };
const minutes = minutesOf;

function NewEvent() {
  const { profile } = useFrontend();
  const form = useRef<HTMLFormElement>(null);
  const [clubs, setClubs] = useState<ClubRow[]>();
  const [halls, setHalls] = useState<HallRow[]>([]);
  const [values, setValues] = useState(blank);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [formError, setFormError] = useState<string>();
  const [loadError, setLoadError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<EventRow>();
  const [clashes, setClashes] = useState<string[]>([]);
  // A club president can only act for their own club; admins may choose.
  const locked = profile?.role === ROLES.CLUB_PRESIDENT;
  const clubId = locked ? profile?.club_id ?? "" : values.club;
  const ownClub = clubs?.find((club) => club.id === clubId);

  useEffect(() => {
    let cancelled = false;
    Promise.all([listClubs(), listHalls()])
      .then(([clubRows, hallRows]) => { if (!cancelled) { setClubs(clubRows); setHalls(hallRows); } })
      .catch(() => { if (!cancelled) setLoadError("The form could not be loaded. Refresh the page to try again."); });
    return () => { cancelled = true; };
  }, []);

  // Warn before sending: other approved events in the same hall that overlap this time (binary search over sorted spans).
  const hallName = halls.find((hall) => hall.id === values.hall)?.name;
  useEffect(() => {
    if (!hallName || !values.date || !values.start || !values.end || values.end <= values.start) return;
    let cancelled = false;
    listCalendar(values.date, values.date).then((events) => {
      if (cancelled) return;
      const sameHall = events.filter((event) => event.hall_name === hallName).map((event) => ({ title: event.title, start: minutes(event.start_time), end: minutes(event.end_time) })).sort((a, b) => a.start - b.start);
      setClashes(findOverlaps({ start: minutes(values.start), end: minutes(values.end) }, sameHall).map((event) => event.title));
    }).catch(() => { if (!cancelled) setClashes([]); });
    return () => { cancelled = true; };
  }, [hallName, values.date, values.start, values.end]);

  const set = (key: keyof typeof blank) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setValues((current) => ({ ...current, [key]: event.target.value }));

  function validate() {
    const found: Partial<Record<Field, string>> = {};
    const hall = halls.find((item) => item.id === values.hall);
    const attendance = Number(values.attendance);
    const budget = values.budget === "" ? 0 : Number(values.budget);
    if (!clubId) found.club = locked ? "Your account has no club yet. Ask an administrator to assign one." : "Choose your club.";
    if (values.title.trim().length < 3) found.title = "Enter the event name (at least 3 characters).";
    if (values.description.trim().length < 10) found.description = "Describe the event in at least 10 characters.";
    if (!values.date) found.date = "Choose a date.";
    else if (values.date < istDate(7)) found.date = "Events must be requested at least 7 days ahead.";
    if (!values.start) found.start = "Choose a start time.";
    else if (values.start < "07:00") found.start = "Events cannot start before 7:00 AM.";
    if (!values.end) found.end = "Choose an end time.";
    else if (values.end > "23:00") found.end = "Events must end by 11:00 PM.";
    else if (values.start && values.end <= values.start) found.end = "End time must be after the start time.";
    else if (values.start && minutes(values.end) - minutes(values.start) > 480) found.end = "Events can run for at most 8 hours.";
    if (!values.hall) found.hall = "Choose a hall.";
    else if (clashes.length) found.hall = `This hall is already booked then (${clashes.join(", ")}).`;
    if (values.coordinator.trim().length < 2) found.coordinator = "Enter the faculty coordinator.";
    if (!/^[0-9+ ]{7,15}$/.test(values.phone.trim())) found.phone = "Enter a phone number of 7 to 15 digits.";
    if (!Number.isInteger(attendance) || attendance < 1) found.attendance = "Enter the expected attendance.";
    else if (hall?.capacity && attendance > hall.capacity) found.attendance = `${hall.name} seats ${hall.capacity}.`;
    if (!Number.isFinite(budget) || budget < 0) found.budget = "Enter a budget of 0 or more.";
    return found;
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setFormError(undefined);
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length) { requestAnimationFrame(() => form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()); return; }
    setBusy(true);
    try {
      setCreated(await createEventRequest({
        club_id: clubId, title: values.title.trim(), event_type: values.type, description: values.description.trim(),
        event_date: values.date, start_time: values.start, end_time: values.end, hall_id: values.hall,
        expected_attendance: Number(values.attendance), budget_estimate: values.budget === "" ? 0 : Number(values.budget),
        faculty_coordinator: values.coordinator.trim(), contact_phone: values.phone.trim(),
      }));
    } catch (cause) { setFormError(cause instanceof Error ? cause.message : "The request could not be sent. Try again."); }
    finally { setBusy(false); }
  }

  if (loadError) return <Card><FieldError>{loadError}</FieldError></Card>;
  if (!clubs) return <Skeleton label="Loading event form" />;

  if (created) return <Card role="status" className="max-w-md space-y-3 border-status-green-dark bg-status-green-light">
    <p className="text-status-green-dark">Request submitted</p>
    <p className="text-title tabular-nums">{created.code}</p>
    <p>Student affairs will review it. You will be notified at every step.</p>
    <div className="flex flex-wrap gap-3"><Link href="/events/mine" className={buttonStyles()}>View my events</Link><Button variant="secondary" onClick={() => { setCreated(undefined); setValues(blank); }}>Request another</Button></div>
  </Card>;

  return <div className="space-y-6">
    <PageHeader title="Request an event" context="Student affairs reviews first, then the campus director. Plan at least 7 days ahead." />
    <form ref={form} noValidate onSubmit={submit} className="max-w-3xl space-y-5 rounded-card border bg-surface p-4 md:p-6">
      <fieldset disabled={busy} className="space-y-5">
        <legend className="sr-only">Event details</legend>
        <div className="grid gap-4 md:grid-cols-2">
          {locked
            ? <FormField label="Club" help="You can only request events for the club you lead." error={errors.club}>{(c) => <Input {...c} readOnly value={ownClub?.name ?? "No club assigned"} />}</FormField>
            : <FormField label="Club" required error={errors.club}>{(c) => <Select {...c} value={values.club} onChange={set("club")}><option value="">Select a club</option>{clubs.map((club) => <option key={club.id} value={club.id}>{club.name}</option>)}</Select>}</FormField>}
          <FormField label="Event type" required>{(c) => <Select {...c} value={values.type} onChange={set("type")}>{TYPES.map((type) => <option key={type} value={type}>{type[0].toUpperCase() + type.slice(1)}</option>)}</Select>}</FormField>
        </div>
        <FormField label="Event name" required error={errors.title}>{(c) => <Input {...c} value={values.title} maxLength={100} onChange={set("title")} placeholder="e.g. Annual Fest 2026" />}</FormField>
        <FormField label="Description" required help="What will happen, who it is for, and what you need." error={errors.description}>{(c) => <Textarea {...c} value={values.description} maxLength={1000} onChange={set("description")} />}</FormField>
        <div className="grid gap-4 md:grid-cols-3">
          <FormField label="Date" required help="At least 7 days ahead." error={errors.date}>{(c) => <Input {...c} type="date" min={istDate(7)} value={values.date} onChange={set("date")} />}</FormField>
          <FormField label="Start time" required error={errors.start}>{(c) => <Input {...c} type="time" min="07:00" value={values.start} onChange={set("start")} />}</FormField>
          <FormField label="End time" required help="By 11:00 PM, up to 8 hours." error={errors.end}>{(c) => <Input {...c} type="time" max="23:00" value={values.end} onChange={set("end")} />}</FormField>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Hall" required error={errors.hall} help={clashes.length ? `Already booked then: ${clashes.join(", ")}. Pick another hall or time.` : undefined}>{(c) => <Select {...c} value={values.hall} onChange={set("hall")}><option value="">Select a hall</option>{halls.map((hall) => <option key={hall.id} value={hall.id}>{hall.name}{hall.capacity ? ` (seats ${hall.capacity})` : ""}</option>)}</Select>}</FormField>
          <FormField label="Expected attendance" required error={errors.attendance}>{(c) => <Input {...c} type="number" inputMode="numeric" min={1} value={values.attendance} onChange={set("attendance")} />}</FormField>
          <FormField label="Faculty coordinator" required error={errors.coordinator}>{(c) => <Input {...c} value={values.coordinator} maxLength={100} onChange={set("coordinator")} />}</FormField>
          <FormField label="Contact phone" required error={errors.phone}>{(c) => <Input {...c} type="tel" value={values.phone} onChange={set("phone")} />}</FormField>
          <FormField label="Budget estimate (₹)" help="Optional." error={errors.budget}>{(c) => <Input {...c} type="number" inputMode="decimal" min={0} value={values.budget} onChange={set("budget")} />}</FormField>
        </div>
      </fieldset>
      <div aria-live="polite"><FieldError>{formError}</FieldError></div>
      <Button type="submit" loading={busy} className="w-full sm:w-auto">Submit request</Button>
    </form>
  </div>;
}
