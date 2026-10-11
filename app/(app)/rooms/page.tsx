"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FloorPlan } from "@/components/rooms/floor-plan";
import { RoleGate } from "@/components/layout/role-gate";
import { useFrontend } from "@/components/layout/frontend-provider";
import { Button, Card, FieldError, FormField, Input, PageHeader, Select, Skeleton, Textarea, useToast } from "@/components/ui";
import { ROLES } from "@/lib/constants/roles";
import { getFloorAvailability, listBlocks, listFloorRooms, listFloors, listPeriods, requestRoomBooking } from "@/lib/db/rooms";
import { formatClock, istDate, istTime } from "@/lib/time";
import type { BlockRow, FloorRow, PeriodRow, PlanState, RoomRow } from "@/lib/types/campus";

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
  const [states, setStates] = useState<Record<string, PlanState>>({});
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
  const [busy, setBusy] = useState(false);
  const today = istDate(0);
  const floor = floors.find((item) => item.id === floorId);
  const room = rooms.find((item) => item.id === roomId);

  useEffect(() => {
    let cancelled = false;
    Promise.all([listBlocks(), listPeriods()])
      .then(([blockRows, periodRows]) => { if (!cancelled) { setBlocks(blockRows); setPeriods(periodRows); } })
      .catch(() => { if (!cancelled) setLoadError("Rooms could not be loaded. Refresh the page to try again."); });
    return () => { cancelled = true; };
  }, []);

  async function refreshPlan(nextFloor: string, nextDate: string, nextPeriod: string) {
    if (!nextFloor || !nextDate || !nextPeriod) { setStates({}); return; }
    try { setStates(await getFloorAvailability(nextFloor, nextDate, nextPeriod)); }
    catch { setFormError("Availability could not be checked. Try again."); }
  }
  async function pickBlock(id: string) {
    setBlockId(id); setFloorId(""); setRoomId(""); setFloors([]); setRooms([]); setStates({});
    if (id) { try { setFloors(await listFloors(id)); } catch { setFormError("Floors could not be loaded. Try again."); } }
  }
  async function pickFloor(id: string) {
    setFloorId(id); setRoomId(""); setRooms([]); setStates({});
    if (!id) return;
    try { setRooms(await listFloorRooms(id)); } catch { setFormError("The floor plan could not be loaded. Try again."); }
    void refreshPlan(id, date, periodId);
  }
  function pickDate(value: string) { setDate(value); setRoomId(""); void refreshPlan(floorId, value, periodId); }
  function pickPeriod(value: string) { setPeriodId(value); setRoomId(""); void refreshPlan(floorId, date, value); }

  const ended = (period: PeriodRow) => date === today && period.end_time <= istTime();

  function validate(): Errors {
    const found: Errors = {};
    if (!blockId) found.block = "Choose a block.";
    if (!floorId) found.floor = "Choose a floor.";
    if (!date) found.date = "Choose a date.";
    else if (date < today || date > istDate(14)) found.date = "Choose a date from today up to 14 days ahead.";
    if (!periodId) found.period = "Choose a period.";
    if (!roomId) found.room = "Choose a free room on the floor plan.";
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
      void refreshPlan(floorId, date, periodId);
    } finally { setBusy(false); }
  }

  if (loadError) return <Card><FieldError>{loadError}</FieldError></Card>;
  if (!blocks) return <Skeleton label="Loading rooms" />;

  return <div className="space-y-6">
    <PageHeader title="Book a room" context="Pick a floor, date and period, then choose a green room on the plan. The owning department approves each request." />
    <form ref={form} noValidate onSubmit={submit} className="max-w-3xl space-y-5 rounded-card border bg-surface p-4 md:p-6">
      <fieldset disabled={busy} className="space-y-5">
        <legend className="sr-only">Room request details</legend>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Block" required error={errors.block}>{(control) => <Select {...control} value={blockId} onChange={(event) => void pickBlock(event.target.value)}><option value="">Select a block</option>{blocks.map((block) => <option key={block.id} value={block.id}>{block.name}</option>)}</Select>}</FormField>
          <FormField label="Floor" required error={errors.floor}>{(control) => <Select {...control} value={floorId} disabled={!blockId} onChange={(event) => void pickFloor(event.target.value)}><option value="">Select a floor</option>{floors.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</Select>}</FormField>
          <FormField label="Date" required help="From today up to 14 days ahead (IST)." error={errors.date}>{(control) => <Input {...control} type="date" value={date} min={today} max={istDate(14)} onChange={(event) => pickDate(event.target.value)} />}</FormField>
          <FormField label="Period" required error={errors.period}>{(control) => <Select {...control} value={periodId} onChange={(event) => pickPeriod(event.target.value)}><option value="">Select a period</option>{periods.map((period) => <option key={period.id} value={period.id} disabled={ended(period)}>{period.label} · {formatClock(period.start_time)}–{formatClock(period.end_time)}{ended(period) ? " (ended)" : ""}</option>)}</Select>}</FormField>
        </div>

        <div className="space-y-2" aria-labelledby="plan-heading" role="group">
          <h2 id="plan-heading">Floor plan</h2>
          {!floor ? <p className="text-secondary">Choose a block and floor to see its rooms.</p>
            : !date || !periodId ? <p className="text-secondary">Choose a date and period to see which rooms are free.</p>
            : <FloorPlan rooms={rooms} cols={floor.grid_cols} rows={floor.grid_rows} states={states} selectedId={roomId} onSelect={(item) => { setRoomId(item.id); setErrors((current) => ({ ...current, room: undefined })); }} />}
          <p role="status" className={room ? "font-medium text-accent" : "text-secondary"}>{room ? `Selected: ${room.name}${room.capacity ? ` (seats ${room.capacity})` : ""}` : "No room selected."}</p>
          <FieldError>{errors.room}</FieldError>
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
