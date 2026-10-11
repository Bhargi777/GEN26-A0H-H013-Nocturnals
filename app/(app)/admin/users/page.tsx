"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RoleGate } from "@/components/layout/role-gate";
import { useFrontend } from "@/components/layout/frontend-provider";
import { Button, Card, EmptyState, FieldError, FormField, Input, PageHeader, Select, Skeleton, useToast } from "@/components/ui";
import { ROLE_LABELS } from "@/app/(app)/ui/preview-contract";
import { ROLES, type Role } from "@/lib/constants/roles";
import { assignRole, listCanteenOptions, listClubOptions, listDepartmentOptions, listUsers, type Option, type UserRow } from "@/lib/db/admin-users";

export default function AdminUsersPage() {
  return <RoleGate roles={[ROLES.ADMIN]}><Users /></RoleGate>;
}

const PAGE = 8;
const NEEDS_CANTEEN: Role[] = [ROLES.CANTEEN_KITCHEN, ROLES.CANTEEN_COUNTER, ROLES.CANTEEN_MANAGER];
const NEEDS_DEPARTMENT: Role[] = [ROLES.TECHNICIAN, ROLES.DEPT_OFFICE, ROLES.DEPT_HEAD];
const OPTIONAL_DEPARTMENT: Role[] = [ROLES.STUDENT, ROLES.FACULTY, ROLES.CR];

interface Draft { role: Role; department: string; canteen: string; club: string }

function UserCard({ user, me, departments, canteens, clubs, onSaved }: { user: UserRow; me: boolean; departments: Option[]; canteens: Option[]; clubs: Option[]; onSaved: () => Promise<void> }) {
  const toast = useToast();
  const [draft, setDraft] = useState<Draft>({ role: user.role, department: user.department_id ?? "", canteen: user.canteen_id ?? "", club: user.club_id ?? "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const dirty = draft.role !== user.role || draft.department !== (user.department_id ?? "") || draft.canteen !== (user.canteen_id ?? "") || draft.club !== (user.club_id ?? "");
  const showCanteen = NEEDS_CANTEEN.includes(draft.role);
  const showClub = draft.role === ROLES.CLUB_PRESIDENT;
  const showDepartment = NEEDS_DEPARTMENT.includes(draft.role) || OPTIONAL_DEPARTMENT.includes(draft.role);

  async function save() {
    if (busy) return;
    if (showCanteen && !draft.canteen) { setError("Choose a canteen for this role."); return; }
    if (showClub && !draft.club) { setError("Choose a club for a club president."); return; }
    if (NEEDS_DEPARTMENT.includes(draft.role) && !draft.department) { setError("Choose a department for this role."); return; }
    setBusy(true); setError(undefined);
    try {
      await assignRole(user.id, draft.role, draft.department || null, showCanteen ? draft.canteen : null, showClub ? draft.club : null);
      toast({ message: `${user.full_name} is now ${ROLE_LABELS[draft.role]}.` });
      await onSaved();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "The role could not be changed. Try again."); }
    finally { setBusy(false); }
  }

  return <Card className="space-y-3">
    <div className="min-w-0"><p className="break-words font-medium">{user.full_name}{me ? " (you)" : ""}</p><p className="break-all text-secondary">{user.email}</p></div>
    <div className="grid gap-3 sm:grid-cols-2">
      <FormField label="Role">{(c) => <Select {...c} value={draft.role} onChange={(event) => { setDraft({ ...draft, role: event.target.value as Role }); setError(undefined); }}>{Object.values(ROLES).map((role) => <option key={role} value={role}>{ROLE_LABELS[role]}</option>)}</Select>}</FormField>
      {showDepartment && <FormField label="Department">{(c) => <Select {...c} value={draft.department} onChange={(event) => setDraft({ ...draft, department: event.target.value })}><option value="">{NEEDS_DEPARTMENT.includes(draft.role) ? "Choose a department" : "None"}</option>{departments.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select>}</FormField>}
      {showCanteen && <FormField label="Canteen" required>{(c) => <Select {...c} value={draft.canteen} onChange={(event) => setDraft({ ...draft, canteen: event.target.value })}><option value="">Choose a canteen</option>{canteens.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select>}</FormField>}
      {showClub && <FormField label="Club" required>{(c) => <Select {...c} value={draft.club} onChange={(event) => setDraft({ ...draft, club: event.target.value })}><option value="">Choose a club</option>{clubs.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select>}</FormField>}
    </div>
    <div aria-live="polite"><FieldError>{error}</FieldError></div>
    <Button disabled={!dirty} loading={busy} onClick={() => void save()} aria-label={`Save role for ${user.full_name}`}>Save</Button>
  </Card>;
}

function Users() {
  const { profile } = useFrontend();
  const [users, setUsers] = useState<UserRow[]>();
  const [departments, setDepartments] = useState<Option[]>([]);
  const [canteens, setCanteens] = useState<Option[]>([]);
  const [clubs, setClubs] = useState<Option[]>([]);
  const [error, setError] = useState<string>();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    try {
      const [people, depts, cans, cls] = await Promise.all([listUsers(), listDepartmentOptions(), listCanteenOptions(), listClubOptions()]);
      setUsers(people); setDepartments(depts); setCanteens(cans); setClubs(cls); setError(undefined);
    } catch { setError("People could not be loaded. Try again."); }
  }, []);
  useEffect(() => { const first = setTimeout(() => void load(), 0); return () => clearTimeout(first); }, [load]);

  const shown = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (users ?? []).filter((user) => (!roleFilter || user.role === roleFilter) && (!term || user.full_name.toLowerCase().includes(term) || user.email.toLowerCase().includes(term)));
  }, [users, search, roleFilter]);
  const pages = Math.max(1, Math.ceil(shown.length / PAGE));
  const current = Math.min(page, pages);
  const visible = shown.slice((current - 1) * PAGE, current * PAGE);

  if (error && !users) return <EmptyState message={error} action={<Button onClick={() => void load()}>Try again</Button>} />;
  if (!users) return <Skeleton label="Loading people" rows={4} />;

  return <div className="space-y-6">
    <PageHeader title="Assign roles" context="Choose what each person can do. Canteen staff need a canteen, department staff a department and club presidents a club. The person is told when their role changes." />
    <div className="grid gap-3 sm:grid-cols-2">
      <FormField label="Search by name or email">{(c) => <Input {...c} type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} />}</FormField>
      <FormField label="Filter by role">{(c) => <Select {...c} value={roleFilter} onChange={(event) => { setRoleFilter(event.target.value); setPage(1); }}><option value="">All roles</option>{Object.values(ROLES).map((role) => <option key={role} value={role}>{ROLE_LABELS[role]}</option>)}</Select>}</FormField>
    </div>
    <FieldError>{error}</FieldError>
    <p role="status" className="text-secondary">{shown.length} {shown.length === 1 ? "person" : "people"}</p>
    {visible.length === 0 ? <p className="text-secondary">Nobody matches those filters.</p> :
      <ul className="grid gap-4 lg:grid-cols-2">{visible.map((user) => <li key={`${user.id}-${user.role}-${user.canteen_id}-${user.club_id}-${user.department_id}`}><UserCard user={user} me={user.id === profile?.id} departments={departments} canteens={canteens} clubs={clubs} onSaved={load} /></li>)}</ul>}
    <div className="flex items-center justify-between gap-3">
      <Button variant="secondary" size="sm" disabled={current === 1} onClick={() => setPage(current - 1)}>Previous</Button>
      <span className="text-secondary">Page {current} of {pages}</span>
      <Button variant="secondary" size="sm" disabled={current === pages} onClick={() => setPage(current + 1)}>Next</Button>
    </div>
  </div>;
}
