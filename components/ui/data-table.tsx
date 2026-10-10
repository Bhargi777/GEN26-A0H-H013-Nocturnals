"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { Button } from "./button";

export interface Column<T> {
  id: string;
  header: string;
  cell: (row: T) => ReactNode;
  sortValue?: (row: T) => string | number | null;
}
export interface DataTableProps<T> {
  caption: string;
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  rowHref?: (row: T) => string;
  emptyMessage?: string;
  emptyAction?: ReactNode;
  pageSize?: number;
}

export function DataTable<T>({ caption, columns, rows, rowKey, rowHref, emptyMessage = "No items match these filters.", emptyAction, pageSize = 10 }: DataTableProps<T>) {
  const [sort, setSort] = useState<{ id: string; direction: "ascending" | "descending" }>();
  const [page, setPage] = useState(1);
  const size = Math.max(1, Math.floor(pageSize) || 10);
  const pages = Math.max(1, Math.ceil(rows.length / size));
  const currentPage = Math.min(page, pages);
  const sortedRows = [...rows];
  const column = columns.find((item) => item.id === sort?.id);
  if (column?.sortValue && sort) {
    const value = column.sortValue;
    sortedRows.sort((a, b) => {
      const left = value(a), right = value(b);
      const result = typeof left === "number" && typeof right === "number" ? left - right : String(left ?? "").localeCompare(String(right ?? ""), undefined, { numeric: true });
      return sort.direction === "ascending" ? result : -result;
    });
  }
  const start = (currentPage - 1) * size;
  return <div className="min-w-0 rounded-card border bg-surface">
    <div role="region" aria-label={caption} tabIndex={0} className="overflow-x-auto rounded-card">
      <table className="w-full min-w-[560px] border-collapse text-left">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-background"><tr>{columns.map((item) => <th key={item.id} scope="col" aria-sort={item.sortValue ? (sort?.id === item.id ? sort.direction : "none") : undefined} className="border-b px-4 py-3 font-semibold">
          {item.sortValue ? <button type="button" className="flex items-center gap-2 rounded-control py-1 text-left" onClick={() => {
            setSort({ id: item.id, direction: sort?.id === item.id && sort.direction === "ascending" ? "descending" : "ascending" });
            setPage(1);
          }}>{item.header}{sort?.id !== item.id ? <ArrowUpDown size={16} aria-hidden="true" /> : sort.direction === "ascending" ? <ArrowUp size={16} aria-hidden="true" /> : <ArrowDown size={16} aria-hidden="true" />}</button> : item.header}
        </th>)}</tr></thead>
        <tbody>{sortedRows.slice(start, start + size).map((row) => <tr key={rowKey(row)} className="hover:bg-background">{columns.map((item, index) => <td key={item.id} className="border-b px-4 py-3 align-top">
          {index === 0 && rowHref ? <Link className="text-link" href={rowHref(row)}>{item.cell(row)}</Link> : item.cell(row)}
        </td>)}</tr>)}</tbody>
      </table>
    </div>
    {!rows.length ? <div className="space-y-3 p-4"><p>{emptyMessage}</p>{emptyAction}</div> : <div className="flex flex-wrap items-center justify-between gap-3 p-4">
      <p role="status" className="text-secondary">{start + 1}–{Math.min(start + size, rows.length)} of {rows.length}</p>
      <div className="flex items-center gap-2" aria-label="Pagination">
        <Button variant="secondary" size="sm" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Previous</Button>
        <span className="sr-only">Page {currentPage} of {pages}</span>
        <Button variant="secondary" size="sm" disabled={currentPage === pages} onClick={() => setPage(currentPage + 1)}>Next</Button>
      </div>
    </div>}
  </div>;
}
