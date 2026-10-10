import React from "react";

// Stub for Dev 3's overdue config
// import { OVERDUE_LIMITS } from "../../../../lib/config/overdue";
const OVERDUE_LIMITS = { LOW: 7, MEDIUM: 3, HIGH: 1, URGENT: 0 };

export default async function AdminReportsPage() {
  // Stubs for DB queries using the views created in migration
  
  const ticketStatusSummary = [
    { status: "OPEN", count: 12 },
    { status: "IN_PROGRESS", count: 5 },
    { status: "RESOLVED", count: 20 },
  ];
  
  const ticketCategorySummary = [
    { category: "NETWORK", count: 8 },
    { category: "ELECTRICAL", count: 4 },
  ];

  const overdueTickets = [
    { id: "t1", code: "SR-0001", priority: "HIGH", days_open: 2 },
  ];

  const repeatedIssues = [
    { room_id: "room_101", category: "NETWORK", issue_count: 4 },
  ];

  const requestSummary = [
    { type: "BONAFIDE", status: "PENDING_OFFICE", count: 3 },
    { type: "NOC", status: "APPROVED", count: 15 },
  ];

  const requestDuration = [
    { type: "BONAFIDE", median_days: 1.5 },
    { type: "NOC", median_days: 3.2 },
  ];

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900">Admin Reports</h1>
        <p className="mt-1 text-sm text-slate-500">System overview and statistics.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Service Tickets Summary */}
        <div className="bg-white overflow-hidden shadow rounded-lg border border-slate-200">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-slate-900 mb-4">Tickets by Status</h3>
            <ul className="space-y-3">
              {ticketStatusSummary.map(s => (
                <li key={s.status} className="flex justify-between text-sm">
                  <span className="text-slate-600">{s.status}</span>
                  <span className="font-semibold text-slate-900">{s.count}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg border border-slate-200">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-slate-900 mb-4">Tickets by Category</h3>
            <ul className="space-y-3">
              {ticketCategorySummary.map(c => (
                <li key={c.category} className="flex justify-between text-sm">
                  <span className="text-slate-600">{c.category}</span>
                  <span className="font-semibold text-slate-900">{c.count}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg border border-slate-200">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-slate-900 mb-4">Admin Requests Summary</h3>
            <ul className="space-y-3">
              {requestSummary.map(r => (
                <li key={`${r.type}-${r.status}`} className="flex justify-between text-sm">
                  <span className="text-slate-600">{r.type} ({r.status})</span>
                  <span className="font-semibold text-slate-900">{r.count}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg border border-slate-200">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-slate-900 mb-4">Admin Requests Duration</h3>
            <ul className="space-y-3">
              {requestDuration.map(r => (
                <li key={r.type} className="flex justify-between text-sm">
                  <span className="text-slate-600">{r.type}</span>
                  <span className="font-semibold text-slate-900">{r.median_days} days</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg border border-slate-200 sm:col-span-2 lg:col-span-1">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-slate-900 mb-4">Repeated Issues (Last 30 Days)</h3>
            <ul className="space-y-3">
              {repeatedIssues.map(i => (
                <li key={`${i.room_id}-${i.category}`} className="flex justify-between text-sm">
                  <span className="text-slate-600">Room {i.room_id} - {i.category}</span>
                  <span className="font-semibold text-slate-900">{i.issue_count} times</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      
      <div className="mt-8">
        <h3 className="text-lg font-medium text-slate-900 mb-4">Overdue Tickets</h3>
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
          <table className="min-w-full divide-y divide-slate-300">
            <thead className="bg-slate-50">
              <tr>
                <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-slate-900 sm:pl-6">Code</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Priority</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Days Open</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {overdueTickets.map((t) => (
                <tr key={t.id}>
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-slate-900 sm:pl-6">{t.code}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">{t.priority}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-red-600 font-semibold">{t.days_open} (limit: {OVERDUE_LIMITS[t.priority as keyof typeof OVERDUE_LIMITS] || 0})</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
