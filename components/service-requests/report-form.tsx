"use client";

import { useMemo, useState } from "react";
import {
  TICKET_CATEGORIES,
  TICKET_CATEGORY_LABELS,
  TICKET_PRIORITIES,
  TICKET_PRIORITY_LABELS,
} from "@/app/(app)/service-requests/_stubs/constants";
import type { Building, Room } from "@/app/(app)/service-requests/_stubs/db";
import { Button, ButtonLink } from "./button";
import { Field, inputClass } from "./form-field";

export function ReportForm({ buildings, rooms }: { buildings: Building[]; rooms: Room[] }) {
  const [buildingId, setBuildingId] = useState("");
  const [roomId, setRoomId] = useState("");

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
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="category" label="Category">
            <select id="category" name="category" required defaultValue="" className={inputClass}>
              <option value="">Choose a category</option>
              {TICKET_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {TICKET_CATEGORY_LABELS[category]}
                </option>
              ))}
            </select>
          </Field>
          <Field id="priority" label="Priority">
            <select id="priority" name="priority" required defaultValue="" className={inputClass}>
              <option value="">Choose a priority</option>
              {TICKET_PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>
                  {TICKET_PRIORITY_LABELS[priority]}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </section>

      <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
        <ButtonLink href="/service-requests" variant="secondary">
          Cancel
        </ButtonLink>
        <Button type="submit">Submit report</Button>
      </div>
    </form>
  );
}
