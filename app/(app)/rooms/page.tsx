"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { RoleGate } from "@/components/layout/role-gate";
import { useFrontend } from "@/components/layout/frontend-provider";
import { Button, Card, FieldError, FormField, Input, PageHeader, Select, Skeleton, Textarea, useToast } from "@/components/ui";
import { ROLES } from "@/lib/constants/roles";
import { getSlotStatus, listBlocks, listBookableRooms, listFloors, listPeriods, requestRoomBooking } from "@/lib/db/rooms";
import { formatClock, istDate, istTime } from "@/lib/time";
import type { BlockRow, FloorRow, PeriodRow, RoomRow, SlotState } from "@/lib/types/campus";

const STATE_LABEL: Record<SlotState, string> = { FREE: "Free", PENDING: "Request pending", BOOKED: "Booked", CLASS: "Class scheduled" };
type Errors = Partial<Record<"block" | "floor" | "room" | "date" | "period" | "attendees" | "faculty" | "reason", string>>;

export default function RoomBookingPage() {
  return <RoleGate roles={[ROLES.FACULTY, ROLES.CR, ROLES.ADMIN]}><BookingForm /></RoleGate>;
}

function BookingForm() {
  const router = useRouter();
  const toast = useToast();
  const { profile } = useFrontend();
  const form = useRef<HTMLFormElement>(null);
  const [blocks, setBlocks] = useState<BlockRow[]>();
  const [floors, setFloors] = useState<FloorRow[]>([]);
  const [rooms, setRooms] = useState<RoomRow[]>([]);
  const [periods, setPeriods] = useState<PeriodRow[]>([]);
  const [states, setStates] = useState<Record<string, SlotState>>({});
  const [blockId, setBlockId] = useState("");
  const [floorId, setFloorId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [date, setDate] = useState("");
  const [periodId, setPeriodId] = useState("");
  const [attendees, setAttendees] = useState("");
  const [facultyName, setFacultyName] = useState(profile?.role === ROLES.FACULTY ? profile.full_name : "");
  const [reason, setReason] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string>();
  const [loadError, setLoadError] = useState<string>();
  const [checking, setChecking] = useState(false);
  const [busy, setBusy] = useState(false);
  const today = istDate(0);
  const room = rooms.find((item) => item.id === roomId);

  useEffect(() => {
    let cancelled = false;
    Promise.all([listBlocks(), listPeriods()])
      .then(([blockRows, periodRows]) => { if (!cancelled) { setBlocks(blockRows); setPeriods(periodRows); } })
      .catch(() => { if (!cancelled) setLoadError("Rooms could not be loaded. Refresh the page to try again."); });
    return () => { cancelled = true; };
  }, []);

  async function refreshStates(nextRoom: string, nextDate: string) {
    if (!nextRoom || !nextDate) { setStates({}); return; }
    setChecking(true);
    try {
      const rows = await getSlotStatus(nextRoom, nextDate);
      setStates(Object.fromEntries(rows.map((row) => [row.period_id, row.state])));
    } catch { setFormError("Availability could not be checked. Try again."); }
    finally { setChecking(false); }
  }
  async function pickBlock(id: string) {
    setBlockId(id); setFloorId(""); setRoomId(""); setFloors([]); setRooms([]); setPeriodId(""); setStates({});
    if (id) { try { setFloors(await listFloors(id)); } catch { setFormError("Floors could not be loaded. Try again."); } }
  }
  async function pickFloor(id: string) {
    setFloorId(id); setRoomId(""); setRooms([]); setPeriodId(""); setStates({});
    if (id) { try { setRooms(await listBookableRooms(id)); } catch { setFormError("Rooms could not be loaded. Try again."); } }
  }
  function pickRoom(id: string) { setRoomId(id); setPeriodId(""); void refreshStates(id, date); }
  function pickDate(value: string) { setDate(value); setPeriodId(""); void refreshStates(roomId, value); }

  const ended = (period: PeriodRow) => date === today && period.end_time <= istTime();
  const unavailable = (period: PeriodRow) => ended(period) || states[period.id] === "CLASS" || states[period.id] === "BOOKED";

  function validate(): Errors {
    const found: Errors = {};
    if (!blockId) found.block = "Choose a block.";
    if (!floorId) found.floor = "Choose a floor.";
    if (!roomId) found.room = "Choose a room.";
    if (!date) found.date = "Choose a date.";
    else if (date < today || date > istDate(14)) found.date = "Choose a date from today up to 14 days ahead.";
    if (!periodId) found.period = "Choose an available period.";
    const count = Number(attendees);
    if (!attendees || !Number.isInteger(count) || count < 1) found.attendees = "Enter the number of attendees.";
    else if (room?.capacity && count > room.capacity) found.attendees = `This room seats ${room.capacity}.`;
    if (facultyName.trim().length < 2) found.faculty = "Enter the faculty name.";
    if (reason.trim().length < 5) found.reason = "Describe the reason in at least 5 characters.";
    else if (reason.length > 500) found.reason = "Keep the reason under 500 characters.";
    return found;
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setFormError(undefined);
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length) {
      requestAnimationFrame(() => form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }
    setBusy(true);
    try {
      const booking = await requestRoomBooking({ roomId, date, periodId, reason: reason.trim(), facultyName: facultyName.trim(), attendees: Number(attendees) });
      toast({ message: `Request ${booking.code} sent for approval.` });
      router.push("/rooms/my-requests");
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : "The request could not be sent. Try again.");
      void refreshStates(roomId, date);
    } finally { setBusy(false); }
  }

  if (loadError) return <Card><FieldError>{loadError}</FieldError></Card>;
  if (!blocks) return <Skeleton label="Loading rooms" />;

  return <div className="space-y-6">
    <PageHeader title="Book a room" context="Choose a room and period. The owning department approves each request." />
    <form ref={form} noValidate onSubmit={submit} className="max-w-2xl space-y-5 rounded-card border bg-surface p-4 md:p-6">
      <fieldset disabled={busy} className="space-y-5">
        <legend className="sr-only">Room request details</legend>
        <div className="grid gap-4 md:grid-cols-3">
          <FormField label="Block" required error={errors.block}>{(control) => <Select {...control} value={blockId} onChange={(event) => void pickBlock(event.target.value)}><option value="">Select a block</option>{blocks.map((block) => <option key={block.id} value={block.id}>{block.name}</option>)}</Select>}</FormField>
          <FormField label="Floor" required error={errors.floor}>{(control) => <Select {...control} value={floorId} disabled={!blockId} onChange={(event) => void pickFloor(event.target.value)}><option value="">Select a floor</option>{floors.map((floor) => <option key={floor.id} value={floor.id}>{floor.label}</option>)}</Select>}</FormField>
          <FormField label="Room" required error={errors.room}>{(control) => <Select {...control} value={roomId} disabled={!floorId} onChange={(event) => pickRoom(event.target.value)}><option value="">Select a room</option>{rooms.map((item) => <option key={item.id} value={item.id}>{item.name}{item.capacity ? ` · seats ${item.capacity}` : ""}</option>)}</Select>}</FormField>
        </div>
        {floorId && rooms.length === 0 && <p className="text-secondary">No bookable rooms on this floor.</p>}
        <FormField label="Date" required help="From today up to 14 days ahead (IST)." error={errors.date}>{(control) => <Input {...control} type="date" value={date} min={today} max={istDate(14)} onChange={(event) => pickDate(event.target.value)} />}</FormField>

        <div role="group" aria-labelledby="period-label" className="space-y-2">
          <p id="period-label" className="font-medium">Period (required)</p>
          {!roomId || !date ? <p className="text-secondary">Choose a room and date to see availability.</p> : <div role="radiogroup" aria-labelledby="period-label" aria-describedby={errors.period ? "period-error" : undefined} className="grid gap-2 sm:grid-cols-2">
            {periods.map((period) => {
              const state = states[period.id] ?? "FREE";
              const off = unavailable(period);
              const selected = periodId === period.id;
              return <button key={period.id} type="button" role="radio" aria-checked={selected} disabled={off || checking} onClick={() => setPeriodId(period.id)}
                className={`flex min-h-11 items-center justify-between gap-3 rounded-control border px-3 py-2 text-left disabled:opacity-60 ${selected ? "border-accent bg-accent-light text-accent" : "bg-surface hover:bg-background"}`}>
                <span>{period.label} · {formatClock(period.start_time)}–{formatClock(period.end_time)}</span>
                <span className={state === "FREE" ? "text-status-green-dark" : state === "PENDING" ? "text-status-amber-dark" : "text-status-red-dark"}>{ended(period) ? "Ended" : STATE_LABEL[state]}</span>
              </button>;
            })}
          </div>}
          <FieldError id="period-error">{errors.period}</FieldError>
          {Object.values(states).includes("PENDING") && <p className="text-secondary">Periods marked “Request pending” already have a request. The department decides which one is approved.</p>}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Expected attendees" required help={room?.capacity ? `This room seats ${room.capacity}.` : undefined} error={errors.attendees}>{(control) => <Input {...control} type="number" inputMode="numeric" min={1} max={room?.capacity ?? undefined} value={attendees} onChange={(event) => setAttendees(event.target.value)} />}</FormField>
          <FormField label="Faculty name" required error={errors.faculty}>{(control) => <Input {...control} value={facultyName} maxLength={100} onChange={(event) => setFacultyName(event.target.value)} placeholder="e.g. Dr. Venkatesh Rao" />}</FormField>
        </div>
        <FormField label="Reason" required help="For example: extra class, guest lecture, department meeting." error={errors.reason}>{(control) => <Textarea {...control} value={reason} maxLength={500} onChange={(event) => setReason(event.target.value)} />}</FormField>
      </fieldset>
      <div aria-live="polite"><FieldError>{formError}</FieldError></div>
      <Button type="submit" loading={busy} className="w-full sm:w-auto">Send request</Button>
    </form>
  </div>;
}
