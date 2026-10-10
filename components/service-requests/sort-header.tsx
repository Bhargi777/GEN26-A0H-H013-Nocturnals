import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import Link from "next/link";
import {
  listHref,
  type ListParams,
  type SortDir,
  type SortKey,
} from "@/app/(app)/service-requests/_lib/list-params";

/** A table header that sorts by its column; clicking again flips the direction. */
export function SortHeader({
  label,
  column,
  path,
  params,
  activeSort,
  activeDir,
}: {
  label: string;
  column: SortKey;
  path: string;
  params: ListParams;
  activeSort: SortKey;
  activeDir: SortDir;
}) {
  const active = activeSort === column;
  const nextDir: SortDir = active && activeDir === "asc" ? "desc" : "asc";
  const Icon = !active ? ArrowUpDown : activeDir === "asc" ? ArrowUp : ArrowDown;
  return (
    <th
      scope="col"
      aria-sort={active ? (activeDir === "asc" ? "ascending" : "descending") : "none"}
      className="px-3 py-2 text-left text-xs font-medium tracking-wide text-slate-600 uppercase"
    >
      <Link
        href={listHref(path, params, { sort: column, dir: nextDir })}
        className="inline-flex items-center gap-1 rounded-md hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-teal-700"
      >
        {label}
        <Icon size={14} aria-hidden className={active ? "text-slate-900" : "text-slate-400"} />
      </Link>
    </th>
  );
}
