import React from "react";
import { getAdminRequestByCode } from "../../../lib/db/admin-requests";
import { REQUEST_TYPES } from "../../../components/admin-requests/request-types";
import Link from "next/link";

export default async function VerifyPage({ params }: { params: { code: string } }) {
  const request = await getAdminRequestByCode(params.code);

  if (!request || request.status !== "APPROVED") {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="mt-4 text-xl font-bold tracking-tight text-slate-900">Document Not Found</h2>
            <p className="mt-2 text-sm text-slate-500">
              The document code <span className="font-mono bg-slate-100 px-1 rounded">{params.code}</span> could not be verified. It may be invalid or not yet approved.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const config = REQUEST_TYPES[request.type];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h2 className="mt-4 text-xl font-bold tracking-tight text-slate-900">Valid Document</h2>
          <p className="mt-2 text-sm text-slate-500 mb-6">
            This code corresponds to a valid, approved document issued by the institution.
          </p>
          
          <div className="bg-slate-50 rounded border border-slate-200 p-4 text-left">
            <dl className="space-y-4">
              <div>
                <dt className="text-xs font-medium text-slate-500 uppercase">Document Code</dt>
                <dd className="mt-1 text-sm font-semibold text-slate-900">{request.code}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-500 uppercase">Document Type</dt>
                <dd className="mt-1 text-sm font-semibold text-slate-900">{config?.label || request.type}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-500 uppercase">Issue Date</dt>
                <dd className="mt-1 text-sm font-semibold text-slate-900">
                  {request.decided_at ? new Date(request.decided_at).toLocaleDateString() : new Date().toLocaleDateString()}
                </dd>
              </div>
            </dl>
          </div>

          <div className="mt-6 text-xs text-slate-400">
            No personal information is displayed to protect privacy.
          </div>
        </div>
      </div>
    </div>
  );
}
