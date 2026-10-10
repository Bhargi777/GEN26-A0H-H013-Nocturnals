"use client";

import { z } from "zod";
import { FormField, Input, Select } from "./form-field";
import { Button } from "./button";

const date = z.string().refine((value) => !value || /^\d{4}-\d{2}-\d{2}$/.test(value), "Choose a valid date.");
export const filterSchema = z.object({ search: z.string().max(200), status: z.string(), category: z.string(), from: date, to: date })
  .refine((value) => !value.from || !value.to || value.from <= value.to, { message: "End date must be on or after start date.", path: ["to"] });
export type FilterValues = z.infer<typeof filterSchema>;
export const emptyFilters: FilterValues = { search: "", status: "", category: "", from: "", to: "" };
export interface FilterOption { value: string; label: string }

export function FilterBar({ value, onChange, statuses, categories }: {
  value: FilterValues;
  onChange: (value: FilterValues) => void;
  statuses: FilterOption[];
  categories: FilterOption[];
}) {
  const parsed = filterSchema.safeParse(value);
  const dateError = parsed.success ? undefined : parsed.error.issues.find((issue) => issue.path[0] === "to")?.message;
  const change = (key: keyof FilterValues, next: string) => onChange({ ...value, [key]: next });
  return <form role="search" aria-label="Filter items" className="flex flex-wrap items-end gap-3 rounded-card border bg-surface p-4" onSubmit={(event) => event.preventDefault()}>
    <div className="min-w-0 flex-[2_1_180px]"><FormField label="Search">{(control) => <Input {...control} type="search" maxLength={200} value={value.search} onChange={(event) => change("search", event.target.value)} />}</FormField></div>
    <div className="min-w-0 flex-[1_1_160px]"><FormField label="Status">{(control) => <Select {...control} value={value.status} onChange={(event) => change("status", event.target.value)}><option value="">All statuses</option>{statuses.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</Select>}</FormField></div>
    <div className="min-w-0 flex-[1_1_160px]"><FormField label="Category">{(control) => <Select {...control} value={value.category} onChange={(event) => change("category", event.target.value)}><option value="">All categories</option>{categories.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</Select>}</FormField></div>
    <div className="min-w-0 flex-[1_1_160px]"><FormField label="From date">{(control) => <Input {...control} type="date" value={value.from} max={value.to || undefined} onChange={(event) => change("from", event.target.value)} />}</FormField></div>
    <div className="min-w-0 flex-[1_1_160px]"><FormField label="To date" error={dateError}>{(control) => <Input {...control} type="date" value={value.to} min={value.from || undefined} onChange={(event) => change("to", event.target.value)} />}</FormField></div>
    <Button variant="ghost" onClick={() => onChange({ ...emptyFilters })}>Clear filters</Button>
  </form>;


}

