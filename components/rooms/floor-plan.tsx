"use client";

import type { PlanState, RoomRow } from "@/lib/types/campus";

const LABEL: Record<PlanState, string> = { FREE: "Free", PENDING: "Request pending", BOOKED: "Booked", CLASS: "In use", CLOSED: "Not bookable" };
const STYLE: Record<PlanState, string> = {
  FREE: "border-status-green-dark bg-status-green-light text-status-green-dark",
  PENDING: "border-status-amber-dark bg-status-amber-light text-status-amber-dark",
  BOOKED: "border-status-red-dark bg-status-red-light text-status-red-dark",
  CLASS: "border-status-red-dark bg-status-red-light text-status-red-dark",
  CLOSED: "border-border bg-status-slate-light text-secondary",
};

/** Top-down floor layout. Green rooms are free for the chosen date and period, red are taken. */
export function FloorPlan({ rooms, cols, rows, states, selectedId, onSelect }: {
  rooms: RoomRow[];
  cols: number;
  rows: number;
  states: Record<string, PlanState>;
  selectedId: string;
  onSelect: (room: RoomRow) => void;
}) {
  return <div className="space-y-3">
    <div role="group" aria-label="Floor plan" className="overflow-x-auto rounded-card border bg-surface p-3">
      <div className="grid min-w-[560px] gap-2" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${rows}, minmax(56px, auto))` }}>
        {rooms.map((room) => {
          const state = states[room.id] ?? "CLOSED";
          const pickable = state === "FREE" || state === "PENDING";
          const selected = room.id === selectedId;
          const position = { gridColumn: `${(room.grid_x ?? 0) + 1} / span ${room.grid_w ?? 1}`, gridRow: `${(room.grid_y ?? 0) + 1} / span ${room.grid_h ?? 1}` };
          const label = `${room.name}${room.capacity ? `, seats ${room.capacity}` : ""}: ${LABEL[state]}`;
          return room.kind === "stairs"
            ? <div key={room.id} style={position} className="flex items-center justify-center rounded-control border border-border bg-background text-secondary" aria-label={room.name}>Stairs</div>
            : <button key={room.id} type="button" style={position} disabled={!pickable} aria-pressed={selected} aria-label={label} onClick={() => onSelect(room)}
                className={`flex flex-col items-center justify-center rounded-control border-2 px-1 py-2 text-center font-semibold disabled:cursor-not-allowed ${STYLE[state]} ${selected ? "ring-2 ring-accent ring-offset-2" : ""}`}>
                <span>{room.code.replace(/^[A-Z]+-/, "")}</span>
                <span className="font-normal">{LABEL[state]}</span>
              </button>;
        })}
      </div>
    </div>
    <ul className="flex flex-wrap gap-4 text-secondary" aria-label="Legend">
      {(["FREE", "PENDING", "CLASS", "CLOSED"] as PlanState[]).map((state) => <li key={state} className="flex items-center gap-2"><span aria-hidden="true" className={`inline-block h-4 w-6 rounded-control border-2 ${STYLE[state]}`} />{state === "CLASS" ? "Booked or in use" : LABEL[state]}</li>)}
    </ul>
  </div>;
}
