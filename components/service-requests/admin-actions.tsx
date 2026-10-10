"use client";

import { useState, useTransition } from "react";
import { Button, Card, FormField, Select, Textarea } from "@/components/ui";
import {
  assignTicketAction,
  moveToDepartmentAction,
  type ActionResult,
} from "@/app/(app)/service-requests/actions";
import type { Person } from "@/app/(app)/service-requests/_lib/queries";
import type { Department } from "@/lib/types";

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
    <Card aria-labelledby="manage-heading" role="region" className="space-y-6">
      <h2 id="manage-heading">Manage ticket</h2>

      {canAssign && (
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            run(() => assignTicketAction({ ticketId, code, technicianId }));
          }}
        >
          <FormField
            id="technician"
            label={currentAssigneeId ? "Reassign to technician" : "Assign to technician"}
            help={technicians.length === 0 ? "No technicians are listed in your department." : undefined}
          >
            {(control) => (
              <Select {...control} value={technicianId} onChange={(event) => setTechnicianId(event.target.value)}>
                <option value="">Choose a technician</option>
                {technicians.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.full_name}
                  </option>
                ))}
              </Select>
            )}
          </FormField>
          <Button
            type="submit"
            loading={pending}
            disabled={!technicianId || technicianId === currentAssigneeId}
          >
            Assign technician
          </Button>
        </form>
      )}

      <form
        className="space-y-3 border-t pt-4"
        onSubmit={(event) => {
          event.preventDefault();
          run(() => moveToDepartmentAction({ ticketId, code, departmentId, note }));
        }}
      >
        <h3>Send to another department</h3>
        <FormField id="department" label="Department" required>
          {(control) => (
            <Select {...control} value={departmentId} onChange={(event) => setDepartmentId(event.target.value)}>
              <option value="">Choose a department</option>
              {otherDepartments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </Select>
          )}
        </FormField>
        <FormField id="move-note" label="Note for the other department" required>
          {(control) => (
            <Textarea
              {...control}
              rows={3}
              maxLength={1000}
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          )}
        </FormField>
        <Button type="submit" variant="secondary" loading={pending}>
          Send to department
        </Button>
      </form>

      {error && (
        <p role="alert" className="rounded-card border border-status-red-dark bg-status-red-light p-3 text-status-red-dark">
          {error}
        </p>
      )}
    </Card>
  );
}
