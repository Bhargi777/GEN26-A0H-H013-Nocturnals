"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  findSimilarAction,
  suggestTriageAction,
  type TriageSuggestion,
} from "@/app/(app)/service-requests/actions";
import {
  TICKET_CATEGORIES,
  TICKET_CATEGORY_LABELS,
  TICKET_PRIORITIES,
  TICKET_PRIORITY_LABELS,
  type TicketCategory,
  type TicketPriority,
} from "@/app/(app)/service-requests/_stubs/constants";
import type { Building, Room, SimilarTicket } from "@/app/(app)/service-requests/_stubs/db";
import { Button, ButtonLink } from "./button";
import { Field, inputClass } from "./form-field";
import { SimilarTickets } from "./similar-tickets";

const TRIAGE_DEBOUNCE_MS = 800;
const MIN_TRIAGE_CHARS = 15;

function SuggestionHint({
  label,
  value,
  current,
  onAccept,
}: {
  label: string;
  value: string;
  current: string;
  onAccept: () => void;
}) {
  return (
    <span className="flex flex-wrap items-center gap-x-2">
      <span>
        Suggested {label}: <span className="font-medium text-slate-900">{value}</span>
      </span>
      {current !== value && (
        <button
          type="button"
          onClick={onAccept}
          className="rounded-md font-medium text-teal-700 underline-offset-2 hover:text-teal-800 hover:underline focus-visible:outline-2 focus-visible:outline-teal-700"
        >
          Use suggestion
        </button>
      )}
    </span>
  );
}

export function ReportForm({ buildings, rooms }: { buildings: Building[]; rooms: Room[] }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [buildingId, setBuildingId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [category, setCategory] = useState<TicketCategory | "">("");
  const [priority, setPriority] = useState<TicketPriority | "">("");
  // Set once the user picks a value themselves; suggestions then stop overwriting it.
  const categoryChosen = useRef(false);
  const priorityChosen = useRef(false);
  const [suggestion, setSuggestion] = useState<TriageSuggestion | null>(null);
  const [triaging, setTriaging] = useState(false);
  const latestRequest = useRef(0);
  const [similar, setSimilar] = useState<SimilarTicket[]>([]);
  const latestSimilarRequest = useRef(0);

  // Triage runs on the server, debounced while the user types the description.
  useEffect(() => {
    if (description.trim().length < MIN_TRIAGE_CHARS) return;
    const requestId = ++latestRequest.current;
    const timer = setTimeout(async () => {
      setTriaging(true);
      try {
        const result = await suggestTriageAction({ title, description, buildingId });
        if (requestId !== latestRequest.current || !result) return;
        setSuggestion(result);
        if (!categoryChosen.current) setCategory(result.category);
        if (!priorityChosen.current) setPriority(result.priority);
      } catch {
        // A failed suggestion never blocks the report; the fields stay editable.
      } finally {
        if (requestId === latestRequest.current) setTriaging(false);
      }
    }, TRIAGE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [title, description, buildingId]);

  // Possible duplicates in the chosen building, checked before the user submits.
  useEffect(() => {
    const requestId = ++latestSimilarRequest.current;
    if (!buildingId || `${title} ${description}`.trim().length < MIN_TRIAGE_CHARS) {
      setSimilar([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const matches = await findSimilarAction({ buildingId, title, description });
        if (requestId === latestSimilarRequest.current) setSimilar(matches);
      } catch {
        // Duplicate checks are a convenience; reporting still works without them.
      }
    }, TRIAGE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [title, description, buildingId]);

  const buildingRooms = useMemo(
    () => rooms.filter((room) => room.building_id === buildingId),
    [rooms, buildingId],
  );

  return (
    <form className="space-y-6 rounded-lg border border-slate-200 bg-white p-4 sm:p-6">
      <section className="space-y-4">
        <h2 className="text-base font-semibold text-slate-900">What is wrong?</h2>
        <Field id="title" label="Title" hint="For example: Projector not turning on in room 204.">
          <input
            id="title"
            name="title"
            required
            minLength={5}
            maxLength={120}
            autoComplete="off"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className={inputClass}
          />
        </Field>
        <Field id="description" label="Description">
          <textarea
            id="description"
            name="description"
            required
            minLength={10}
            maxLength={2000}
            rows={5}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            aria-describedby="triage-status"
            className={inputClass}
          />
        </Field>
      </section>

      <section className="space-y-4">
        <h2 className="text-base font-semibold text-slate-900">Where is it?</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="buildingId" label="Building">
            <select
              id="buildingId"
              name="buildingId"
              required
              value={buildingId}
              onChange={(event) => {
                setBuildingId(event.target.value);
                setRoomId("");
              }}
              className={inputClass}
            >
              <option value="">Choose a building</option>
              {buildings.map((building) => (
                <option key={building.id} value={building.id}>
                  {building.name}
                </option>
              ))}
            </select>
          </Field>
          <Field
            id="roomId"
            label="Room"
            optional
            hint={buildingId ? undefined : "Choose a building first."}
          >
            <select
              id="roomId"
              name="roomId"
              value={roomId}
              onChange={(event) => setRoomId(event.target.value)}
              disabled={!buildingId || buildingRooms.length === 0}
              className={inputClass}
            >
              <option value="">
                {buildingId && buildingRooms.length === 0 ? "No rooms listed" : "Not in a specific room"}
              </option>
              {buildingRooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field
          id="locationNote"
          label="Location note"
          optional
          hint="For example: near the back window, second floor corridor."
        >
          <input id="locationNote" name="locationNote" maxLength={200} className={inputClass} />
        </Field>
        <Field id="photo" label="Photo" optional hint="JPG, PNG or WebP, up to 5 MB.">
          <input
            id="photo"
            name="photo"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="block w-full text-sm text-slate-900 file:mr-3 file:rounded-md file:border file:border-slate-200 file:bg-white file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-900 hover:file:bg-slate-50"
          />
        </Field>
      </section>

      <section className="space-y-4">
        <h2 className="text-base font-semibold text-slate-900">Category and priority</h2>
        <p id="triage-status" aria-live="polite" className="text-sm text-slate-600">
          {triaging
            ? "Checking the description for a suggested category and priority..."
            : suggestion
              ? "Suggestions are based on your description. You can change them."
              : "A category and priority will be suggested once you describe the problem."}
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id="category"
            label="Category"
            hint={
              suggestion && (
                <SuggestionHint
                  label="category"
                  value={TICKET_CATEGORY_LABELS[suggestion.category]}
                  current={category ? TICKET_CATEGORY_LABELS[category] : ""}
                  onAccept={() => setCategory(suggestion.category)}
                />
              )
            }
          >
            <select
              id="category"
              name="category"
              required
              value={category}
              onChange={(event) => {
                setCategory(event.target.value as TicketCategory | "");
                categoryChosen.current = true;
              }}
              className={inputClass}
            >
              <option value="">Choose a category</option>
              {TICKET_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {TICKET_CATEGORY_LABELS[category]}
                </option>
              ))}
            </select>
          </Field>
          <Field
            id="priority"
            label="Priority"
            hint={
              suggestion && (
                <SuggestionHint
                  label="priority"
                  value={TICKET_PRIORITY_LABELS[suggestion.priority]}
                  current={priority ? TICKET_PRIORITY_LABELS[priority] : ""}
                  onAccept={() => setPriority(suggestion.priority)}
                />
              )
            }
          >
            <select
              id="priority"
              name="priority"
              required
              value={priority}
              onChange={(event) => {
                setPriority(event.target.value as TicketPriority | "");
                priorityChosen.current = true;
              }}
              className={inputClass}
            >
              <option value="">Choose a priority</option>
              {TICKET_PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>
                  {TICKET_PRIORITY_LABELS[priority]}
                </option>
              ))}
            </select>
          </Field>
        </div>
        {/* The suggestion is saved next to the final choice. */}
        <input type="hidden" name="aiSuggestedCategory" value={suggestion?.category ?? ""} />
        <input type="hidden" name="aiSuggestedPriority" value={suggestion?.priority ?? ""} />
        <input type="hidden" name="aiConfidence" value={suggestion?.confidence ?? ""} />
      </section>

      <SimilarTickets matches={similar} />

      <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
        <ButtonLink href="/service-requests" variant="secondary">
          Cancel
        </ButtonLink>
        <Button type="submit">Submit report</Button>
      </div>
    </form>
  );
}
