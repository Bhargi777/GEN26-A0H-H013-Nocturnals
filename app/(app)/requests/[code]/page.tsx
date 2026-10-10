import React from "react";
import Link from "next/link";
import { getAdminRequestByCode } from "../../../../lib/db/admin-requests";
import { REQUEST_TYPES } from "../../../../components/admin-requests/request-types";

export default async function RequestDetailsPage({ params }: { params: { code: string } }) {
  const request = await getAdminRequestByCode(params.code);

  if (!request) {
    return (
      <div className="max-w-3xl mx-auto py-8 px-4 text-center">
        <h2 className="text-xl font-semibold text-slate-900">Request not found</h2>
        <Link href="/requests" className="mt-4 text-teal-600 hover:text-teal-700">Back to requests</Link>
      </div>
    );
  }

  const config = REQUEST_TYPES[request.type];

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{request.code}</h1>
          <p className="mt-1 text-sm text-slate-500">{config?.label || request.type}</p>
        </div>
        <Link href="/requests" className="text-sm font-medium text-teal-600 hover:text-teal-700">
          &larr; Back to requests
        </Link>
      </div>

      <div className="bg-white shadow-sm ring-1 ring-slate-200 rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-base font-semibold leading-6 text-slate-900">Request Information</h3>
        </div>
        <div className="border-t border-slate-200 px-4 py-5 sm:p-0">
          <dl className="sm:divide-y sm:divide-slate-200">
            <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-slate-500">Status</dt>
              <dd className="mt-1 text-sm text-slate-900 sm:col-span-2 sm:mt-0 font-semibold">
                {request.status.replace("_", " ")}
              </dd>
            </div>
            {request.status.startsWith("PENDING") && (
              <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 bg-slate-50">
                <dt className="text-sm font-medium text-slate-500">Waiting on</dt>
                <dd className="mt-1 text-sm text-slate-900 sm:col-span-2 sm:mt-0">
                  {request.current_reviewer_role === "dept_admin" ? "Department Approval" : "Office Approval"}
                </dd>
              </div>
            )}
            <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-slate-500">Purpose</dt>
              <dd className="mt-1 text-sm text-slate-900 sm:col-span-2 sm:mt-0">{request.purpose}</dd>
            </div>
            {request.status === "REJECTED" && request.decision_note && (
              <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 bg-red-50">
                <dt className="text-sm font-medium text-red-800">Rejection Reason</dt>
                <dd className="mt-1 text-sm text-red-800 sm:col-span-2 sm:mt-0">{request.decision_note}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-medium text-slate-900 mb-4">Timeline</h3>
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-sm text-slate-600">
          Timeline stub (requires events table)
        </div>
      </div>

      {request.status === "APPROVED" && (
        <div className="mt-8 flex justify-end">
          <Link
            href={`/api/documents/${request.code}/download`}
            className="inline-flex justify-center rounded-md border border-transparent bg-teal-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
          >
            Download Document
          </Link>
        </div>
      )}
    </div>
  );
}
