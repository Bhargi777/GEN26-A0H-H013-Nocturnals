"use client";

import { useState } from "react";
import { Badge, Button, Card, DataTable, Dialog, EmptyState, FileInput, FilterBar, FormField, Input, PageHeader, Select, Skeleton, StatusBadge, Textarea, Timeline, emptyFilters, filterSchema, useToast } from "@/components/ui";
import { CATEGORIES, STATUS_LABELS, TICKET_STATUS, type Status } from "./preview-contract";
import { previewEvents, previewTickets } from "./fixtures";
import { ROLES, ROLE_LABELS, type Role } from "./preview-contract";
import { previewEnabled, startPreview } from "./preview-adapter";
import { useFrontend } from "@/components/layout/frontend-provider";

function Gallery() {
  const [filters, setFilters] = useState(emptyFilters);
  const [dialog, setDialog] = useState(false);
  const [imageName, setImageName] = useState<string>();
  const toast = useToast();
  const { refresh } = useFrontend();
  const [role, setRole] = useState<Role>(ROLES.STUDENT);
  const parsed = filterSchema.safeParse(filters);
  const rows = parsed.success ? previewTickets.filter((ticket) => (!filters.search || `${ticket.code} ${ticket.title}`.toLowerCase().includes(filters.search.toLowerCase())) && (!filters.status || ticket.status === filters.status) && (!filters.category || ticket.category === filters.category) && (!filters.from || ticket.created_at.slice(0, 10) >= filters.from) && (!filters.to || ticket.created_at.slice(0, 10) <= filters.to)) : [];
  return <div className="space-y-6">
    <PageHeader title="UI reference" context="Shared components and sample data for frontend integration." />
    <Card><p>This gallery uses sample records. It does not submit campus requests.</p></Card>
    {previewEnabled && <Card className="space-y-3"><h2>Role preview</h2><FormField label="Preview role">{(control) => <Select {...control} value={role} onChange={(event) => setRole(event.target.value as Role)}>{Object.values(ROLES).map((item) => <option key={item} value={item}>{ROLE_LABELS[item]}</option>)}</Select>}</FormField><Button onClick={async () => { try { await startPreview(role); await refresh(); toast({ message: "Sample role selected. Open Dashboard to inspect it." }); } catch { toast({ tone: "error", message: "Preview could not start. Allow session storage and try again." }); } }}>Use preview role</Button></Card>}
    <Card className="space-y-4"><h2>Buttons</h2>
      {(["sm", "md"] as const).map((size) => <div key={size} className="flex flex-wrap gap-3">{(["primary", "secondary", "ghost", "danger"] as const).map((variant) => <Button key={variant} size={size} variant={variant} onClick={() => toast({ message: `${variant} button selected.` })}>{variant} · {size}</Button>)}</div>)}
      <div className="flex flex-wrap gap-3"><Button loading>Save changes</Button><Button disabled>Unavailable</Button></div>
      <pre tabIndex={0} className="overflow-x-auto rounded-control bg-background p-3"><code>{'<Button variant="secondary" size="sm" onClick={save}>Save</Button>'}</code></pre>
    </Card>
    <Card className="space-y-4"><h2>Form controls</h2><div className="grid gap-4 md:grid-cols-2">
      <FormField label="Issue title" help="Describe the equipment or facility.">{(control) => <Input {...control} defaultValue="Library Wi-Fi disconnects" />}</FormField>
      <FormField label="Building" required error="Choose a building to continue.">{(control) => <Select {...control} defaultValue=""><option value="">Choose a building</option><option>Central library</option></Select>}</FormField>
      <FormField label="Description">{(control) => <Textarea {...control} />}</FormField>
      <FileInput label="Issue image" onChange={(file) => setImageName(file?.name)} />
    </div>{imageName && <p role="status">Selected: {imageName}</p>}
      <pre tabIndex={0} className="overflow-x-auto rounded-control bg-background p-3"><code>{'<FormField label="Title" error={error}>\n  {(control) => <Input {...control} name="title" />}\n</FormField>'}</code></pre>
    </Card>
    <Card className="space-y-4"><h2>Status badges</h2><div className="flex flex-wrap gap-2">{(Object.keys(STATUS_LABELS) as Status[]).map((status) => <StatusBadge key={status} status={status} />)}<Badge>General label</Badge></div></Card>
    <section className="space-y-4" aria-labelledby="table-heading"><h2 id="table-heading">Filters and table</h2>
      <FilterBar value={filters} onChange={setFilters} statuses={Object.values(TICKET_STATUS).map((value) => ({ value, label: STATUS_LABELS[value] }))} categories={CATEGORIES.map((value) => ({ value, label: value.toLowerCase().replaceAll("_", " ") }))} />
      <DataTable caption="Sample service requests" rows={rows} rowKey={(row) => row.id} rowHref={(row) => `/service-requests/${row.id}`} pageSize={3} columns={[
        { id: "code", header: "Request", cell: (row) => row.code, sortValue: (row) => row.code },
        { id: "title", header: "Issue", cell: (row) => row.title, sortValue: (row) => row.title },
        { id: "status", header: "Status", cell: (row) => <StatusBadge status={row.status} />, sortValue: (row) => row.status },
      ]} emptyAction={<Button variant="secondary" onClick={() => setFilters({ ...emptyFilters })}>Clear filters</Button>} />
    </section>
    <Card className="space-y-4"><h2>Activity timeline</h2><Timeline events={previewEvents} now={Date.parse("2026-10-11T08:00:00Z")} /></Card>
    <Card className="space-y-4"><h2>Confirmations and feedback</h2><div className="flex flex-wrap gap-3">
      <Button variant="secondary" onClick={() => setDialog(true)}>Open confirmation</Button>
      <Button variant="secondary" onClick={() => toast({ message: "Changes saved." })}>Show success</Button>
      <Button variant="secondary" onClick={() => toast({ tone: "error", message: "Changes could not be saved. Try again." })}>Show error</Button>
    </div><Dialog open={dialog} title="Confirm sample change" description="This changes only the gallery preview." confirmLabel="Confirm change" onClose={() => setDialog(false)} onConfirm={() => toast({ message: "Sample change confirmed." })} /></Card>
    <section className="space-y-4"><h2>Empty and loading states</h2><EmptyState message="No requests match these filters." action={<Button variant="secondary" onClick={() => setFilters({ ...emptyFilters })}>Clear filters</Button>} /><Skeleton /></section>
    <Card className="space-y-3"><h2>Component imports</h2><p>Import from <code>components/ui</code>. This page contains working examples for every component.</p><pre tabIndex={0} className="overflow-x-auto bg-background p-3"><code>{'import { Button, DataTable, FormField, StatusBadge } from "@/components/ui";'}</code></pre></Card>
  </div>;
}

export default function UIPage() { return <Gallery />; }
