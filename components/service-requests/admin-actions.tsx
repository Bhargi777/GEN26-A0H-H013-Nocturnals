"use client";

import { useState, useTransition } from "react";
import {
  assignTicketAction,
  moveToDepartmentAction,
  type ActionResult,
} from "@/app/(app)/service-requests/actions";
import type { Person } from "@/app/(app)/service-requests/_lib/queries";
import type { Department } from "@/lib/types";
import { Button } from "./button";
import { Field, inputClass } from "./form-field";

export function AdminActions({
  ticketId,
  code,
  currentAssigneeId,
  currentDepartmentId,
  canAssign,
  technicians,
  departments,
}: {
  ticketId: string;
  code: string;
  currentAssigneeId: string | null;
  currentDepartmentId: string | null;
  canAssign: boolean;
  technicians: Person[];
  departments: Department[];
}) {
  const [technicianId, setTechnicianId] = useState(currentAssigneeId ?? "");
  const [departmentId, setDepartmentId] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const otherDepartments = departments.filter((d) => d.id !== currentDepartmentId);

  const run = (action: () => Promise<ActionResult>) => {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result && !result.ok) setError(result.error);
    });
  };

  return (
    <section
      aria-labelledby="manage-heading"
      className="space-y-6 rounded-lg border border-slate-200 bg-white p-4 sm:p-6"
    >
      <h2 id="manage-heading" className="text-base font-semibold text-slate-900">
        Manage ticket
      </h2>

      {canAssign && (
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            run(() => assignTicketAction({ ticketId, code, technicianId }));
          }}
        >
          <Field
            id="technician"
            label={currentAssigneeId ? "Reassign to technician" : "Assign to technician"}
            hint={technicians.length === 0 ? "No technicians are listed in your department." : undefined}
          >
            <select
              id="technician"
              required
              value={technicianId}
              onChange={(event) => setTechnicianId(event.target.value)}
              className={inputClass}
            >
              <option value="">Choose a technician</option>
              {technicians.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.full_name}
                </option>
              ))}
            </select>
          </Field>
          <Button
            type="submit"
            disabled={pending || !technicianId || technicianId === currentAssigneeId}
          >
            {pending ? "Saving..." : "Assign technician"}
          </Button>
        </form>
      )}

      <form
        className="space-y-3 border-t border-slate-200 pt-4"
        onSubmit={(event) => {
          event.preventDefault();
          run(() => moveToDepartmentAction({ ticketId, code, departmentId, note }));
        }}
      >
        <h3 className="text-sm font-semibold text-slate-900">Send to another department</h3>
        <Field id="department" label="Department">
          <select
            id="department"
            required
            value={departmentId}
            onChange={(event) => setDepartmentId(event.target.value)}
            className={inputClass}
          >
            <option value="">Choose a department</option>
            {otherDepartments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </select>
        </Field>
        <Field id="move-note" label="Note for the other department">
          <textarea
            id="move-note"
            required
            minLength={5}
            maxLength={1000}
            rows={3}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            className={inputClass}
          />
        </Field>
        <Button type="submit" variant="secondary" disabled={pending}>
          {pending ? "Sending..." : "Send to department"}
        </Button>
      </form>

      {error && (
        <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </p>
      )}
    </section>
  );
}
