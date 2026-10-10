"use client";

import React, { useState } from "react";
import { AdminRequest } from "../../lib/db/admin-requests";
import { processDecision } from "../../app/(app)/office/actions";

export function ReviewList({ requests, role }: { requests: AdminRequest[], role: string }) {
  const [selectedRequest, setSelectedRequest] = useState<AdminRequest | null>(null);
  const [decision, setDecision] = useState<"APPROVED" | "REJECTED" | null>(null);
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openDialog = (request: AdminRequest, d: "APPROVED" | "REJECTED") => {
    setSelectedRequest(request);
    setDecision(d);
    setNote("");
    setError(null);
  };

  const closeDialog = () => {
    setSelectedRequest(null);
    setDecision(null);
    setNote("");
  };

  const handleConfirm = async () => {
    if (decision === "REJECTED" && !note.trim()) {
      setError("A note is required when rejecting a request.");
      return;
    }

    if (!selectedRequest || !decision) return;

    setIsSubmitting(true);
    setError(null);
    
    const result = await processDecision(selectedRequest.code, decision, note);
    setIsSubmitting(false);

    if (result.success) {
      // In a real app, we'd invalidate router cache or optimistic update here
      alert(`Request ${selectedRequest.code} ${decision.toLowerCase()}.`);
      closeDialog();
    } else {
      setError(result.error);
    }
  };

  return (
    <div>
      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
        <table className="min-w-full divide-y divide-slate-300">
          <thead className="bg-slate-50">
            <tr>
              <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-slate-900 sm:pl-6">Code</th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Type</th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Status</th>
              <th className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {requests.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-sm text-slate-500">
                  No requests to review.
                </td>
              </tr>
            ) : (
              requests.map((request) => (
                <tr key={request.id}>
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-slate-900 sm:pl-6">
                    {request.code}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">{request.type}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">{request.status}</td>
                  <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6 space-x-2">
                    <button
                      onClick={() => openDialog(request, "APPROVED")}
                      className="text-teal-600 hover:text-teal-900"
                    >
                      {role === "dept_admin" ? "Forward" : "Approve"}
                    </button>
                    <button
                      onClick={() => openDialog(request, "REJECTED")}
                      className="text-red-600 hover:text-red-900"
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedRequest && decision && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <div className="fixed inset-0 bg-slate-500 bg-opacity-75 transition-opacity" onClick={closeDialog} />
            <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
              <div>
                <h3 className="text-base font-semibold leading-6 text-slate-900">
                  Confirm {decision === "APPROVED" ? (role === "dept_admin" ? "Forward" : "Approval") : "Rejection"}
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-slate-500">
                    Are you sure you want to {decision === "APPROVED" ? (role === "dept_admin" ? "forward" : "approve") : "reject"} request {selectedRequest.code}?
                  </p>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-slate-900">Note {decision === "REJECTED" && "(Required)"}</label>
                    <textarea
                      rows={3}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm"
                      placeholder="Add a note..."
                    />
                  </div>
                  {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
                </div>
              </div>
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleConfirm}
                  className={`inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                    decision === "APPROVED" ? "bg-teal-600 hover:bg-teal-500 focus-visible:outline-teal-600" : "bg-red-600 hover:bg-red-500 focus-visible:outline-red-600"
                  } disabled:opacity-50 sm:col-start-2`}
                >
                  {isSubmitting ? "Processing..." : "Confirm"}
                </button>
                <button
                  type="button"
                  onClick={closeDialog}
                  disabled={isSubmitting}
                  className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 sm:col-start-1 sm:mt-0"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
