"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  Button,
  Card,
  FieldError,
  FileInput,
  FormField,
  Input,
  Select,
  Textarea,
  buttonStyles,
} from "@/components/ui";
import {
  createTicketAction,
  findSimilarAction,
  suggestTriageAction,
  type CreateTicketState,
  type TriageSuggestion,
} from "@/app/(app)/service-requests/actions";
import {
  CATEGORY_VALUES,
  PRIORITY_VALUES,
  TICKET_CATEGORY_LABELS,
  TICKET_PRIORITY_LABELS,
  type TicketCategory,
  type TicketPriority,
} from "@/app/(app)/service-requests/_lib/labels";
import type { SimilarTicket } from "@/app/(app)/service-requests/_lib/queries";
import { MAX_PHOTO_BYTES } from "@/app/(app)/service-requests/_lib/schema";
import type { Building, Room } from "@/lib/types";
import { SimilarTickets } from "./similar-tickets";

const TRIAGE_DEBOUNCE_MS = 800;
const MIN_TRIAGE_CHARS = 15;

type FieldName = keyof NonNullable<CreateTicketState["fieldErrors"]>;

function SuggestionHint({
  id,
  label,
  value,
  current,
  onAccept,
}: {
  id: string;
  label: string;
  value: string;
  current: string;
  onAccept: () => void;
}) {
  return (
    <p id={id} aria-live="polite" className="flex flex-wrap items-center gap-2 text-secondary">
      <span>
        Suggested {label}: <span className="font-medium text-primary">{value}</span>
      </span>
      {current !== value && (
        <Button variant="ghost" size="sm" onClick={onAccept}>
          Use suggestion
        </Button>
      )}
    </p>
  );
}

export function ReportForm({ buildings, rooms }: { buildings: Building[]; rooms: Room[] }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [buildingId, setBuildingId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [category, setCategory] = useState<TicketCategory | "">("");
  const [priority, setPriority] = useState<TicketPriority | "">("");
  const [photo, setPhoto] = useState<File | null>(null);
  // Set once the user picks a value themselves; suggestions then stop overwriting it.
  const categoryChosen = useRef(false);
  const priorityChosen = useRef(false);
  const [suggestion, setSuggestion] = useState<TriageSuggestion | null>(null);
  const [triaging, setTriaging] = useState(false);
  const latestRequest = useRef(0);
  const [similar, setSimilar] = useState<SimilarTicket[]>([]);
  const latestSimilarRequest = useRef(0);
  const [submitState, setSubmitState] = useState<CreateTicketState>({});
  const [submitting, startSubmit] = useTransition();
  const fieldError = (name: FieldName) => submitState.fieldErrors?.[name];

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
  const similarReady =
    Boolean(buildingId) && `${title} ${description}`.trim().length >= MIN_TRIAGE_CHARS;
  useEffect(() => {
    const requestId = ++latestSimilarRequest.current;
    if (!similarReady) return;
    const timer = setTimeout(async () => {
      try {
        const matches = await findSimilarAction({ buildingId, title, description });
        if (requestId === latestSimilarRequest.current) setSimilar(matches);
      } catch {
        // Duplicate checks are a convenience; reporting still works without them.
      }
    }, TRIAGE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [title, description, buildingId, similarReady]);

  const buildingRooms = useMemo(
    () => rooms.filter((room) => room.building_id === buildingId),
    [rooms, buildingId],
  );

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        if (photo) formData.set("photo", photo);
        setSubmitState({});
        // Submitted by hand so a failed attempt keeps the photo and notes.
        startSubmit(async () => {
          const result = await createTicketAction(formData);
          if (result) setSubmitState(result);
        });
      }}
      className="space-y-6"
    >
      {submitState.error && (
        <p role="alert" className="rounded-card border border-status-red-dark bg-status-red-light p-3 text-status-red-dark">
          {submitState.error}
        </p>
      )}

      <Card className="space-y-4">
        <h2>What is wrong?</h2>
        <FormField
          id="title"
          label="Title"
          required
          help="For example: Projector not turning on in Lab 101."
          error={fieldError("title")}
        >
          {(control) => (
            <Input
              {...control}
              name="title"
              maxLength={100}
              autoComplete="off"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          )}
        </FormField>
        <FormField id="description" label="Description" required error={fieldError("description")}>
          {(control) => (
            <Textarea
              {...control}
              name="description"
              maxLength={2000}
              rows={5}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          )}
        </FormField>
      </Card>

      <Card className="space-y-4">
        <h2>Where is it?</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="buildingId" label="Building" required error={fieldError("buildingId")}>
            {(control) => (
              <Select
                {...control}
                name="buildingId"
                value={buildingId}
                onChange={(event) => {
                  setBuildingId(event.target.value);
                  setRoomId("");
                }}
              >
                <option value="">Choose a building</option>
                {buildings.map((building) => (
                  <option key={building.id} value={building.id}>
                    {building.name}
                  </option>
                ))}
              </Select>
            )}
          </FormField>
          <FormField
            id="roomId"
            label="Room (optional)"
            help={buildingId ? undefined : "Choose a building first."}
          >
            {(control) => (
              <Select
                {...control}
                name="roomId"
                value={roomId}
                onChange={(event) => setRoomId(event.target.value)}
                disabled={!buildingId || buildingRooms.length === 0}
              >
                <option value="">
                  {buildingId && buildingRooms.length === 0 ? "No rooms listed" : "Not in a specific room"}
                </option>
                {buildingRooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name}
                  </option>
                ))}
              </Select>
            )}
          </FormField>
        </div>
        <FormField
          id="locationNote"
          label="Location note (optional)"
          help="For example: near the back window, second floor corridor."
        >
          {(control) => <Input {...control} name="locationNote" maxLength={200} />}
        </FormField>
        <FileInput label="Photo (optional)" maxBytes={MAX_PHOTO_BYTES} onChange={setPhoto} />
        <FieldError id="photo-error">{fieldError("photo")}</FieldError>
      </Card>

      <Card className="space-y-4">
        <h2>Category and priority</h2>
        <p id="triage-status" aria-live="polite" className="text-secondary">
          {triaging
            ? "Checking the description for a suggested category and priority..."
            : suggestion
              ? "Suggestions are based on your description. You can change them."
              : "A category and priority will be suggested once you describe the problem."}
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <FormField id="category" label="Category" required error={fieldError("category")}>
              {(control) => (
                <Select
                  {...control}
                  name="category"
                  value={category}
                  onChange={(event) => {
                    setCategory(event.target.value as TicketCategory | "");
                    categoryChosen.current = true;
                  }}
                >
                  <option value="">Choose a category</option>
                  {CATEGORY_VALUES.map((value) => (
                    <option key={value} value={value}>
                      {TICKET_CATEGORY_LABELS[value]}
                    </option>
                  ))}
                </Select>
              )}
            </FormField>
            {suggestion && (
              <SuggestionHint
                id="category-suggestion"
                label="category"
                value={TICKET_CATEGORY_LABELS[suggestion.category]}
                current={category ? TICKET_CATEGORY_LABELS[category] : ""}
                onAccept={() => setCategory(suggestion.category)}
              />
            )}
          </div>
          <div className="space-y-2">
            <FormField id="priority" label="Priority" required error={fieldError("priority")}>
              {(control) => (
                <Select
                  {...control}
                  name="priority"
                  value={priority}
                  onChange={(event) => {
                    setPriority(event.target.value as TicketPriority | "");
                    priorityChosen.current = true;
                  }}
                >
                  <option value="">Choose a priority</option>
                  {PRIORITY_VALUES.map((value) => (
                    <option key={value} value={value}>
                      {TICKET_PRIORITY_LABELS[value]}
                    </option>
                  ))}
                </Select>
              )}
            </FormField>
            {suggestion && (
              <SuggestionHint
                id="priority-suggestion"
                label="priority"
                value={TICKET_PRIORITY_LABELS[suggestion.priority]}
                current={priority ? TICKET_PRIORITY_LABELS[priority] : ""}
                onAccept={() => setPriority(suggestion.priority)}
              />
            )}
          </div>
        </div>
        {/* The suggestion is saved next to the final choice. */}
        <input type="hidden" name="aiSuggestedCategory" value={suggestion?.category ?? ""} />
        <input type="hidden" name="aiSuggestedPriority" value={suggestion?.priority ?? ""} />
        <input type="hidden" name="aiConfidence" value={suggestion?.confidence ?? ""} />
      </Card>

      <SimilarTickets matches={similarReady ? similar : []} />

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link href="/service-requests" className={buttonStyles("secondary")}>
          Cancel
        </Link>
        <Button type="submit" loading={submitting}>
          Submit report
        </Button>
      </div>
    </form>
  );
}
