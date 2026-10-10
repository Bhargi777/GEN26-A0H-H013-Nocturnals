"use client";

import React, { useState } from "react";
import { REQUEST_TYPES, RequestType } from "../../../components/admin-requests/request-types";
import { RequestForm } from "../../../components/admin-requests/RequestForm";
import Link from "next/link";

export default function NewRequestPage() {
  const [selectedType, setSelectedType] = useState<RequestType | null>(null);

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">New Request</h1>
          <p className="mt-1 text-sm text-slate-500">Submit a new administrative request.</p>
        </div>
        <Link
          href="/requests"
          className="text-sm font-medium text-teal-600 hover:text-teal-700"
        >
          Cancel
        </Link>
      </div>

      <div className="bg-white shadow-sm ring-1 ring-slate-200 rounded-lg p-6">
        {!selectedType ? (
          <div>
            <h2 className="text-lg font-medium text-slate-900 mb-4">Select Request Type</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {(Object.keys(REQUEST_TYPES) as RequestType[]).map((key) => {
                const config = REQUEST_TYPES[key];
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedType(key)}
                    className="relative flex items-center space-x-3 rounded-lg border border-slate-300 bg-white px-6 py-5 shadow-sm hover:border-teal-400 focus-within:ring-2 focus-within:ring-teal-500 focus-within:ring-offset-2"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="absolute inset-0" aria-hidden="true" />
                      <p className="text-sm font-medium text-slate-900 text-left">{config.label}</p>
                      <p className="truncate text-sm text-slate-500 text-left">{config.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div>
            <button
              onClick={() => setSelectedType(null)}
              className="text-sm font-medium text-teal-600 hover:text-teal-700 mb-6 flex items-center"
            >
              &larr; Back to types
            </button>
            <RequestForm type={selectedType} />
          </div>
        )}
      </div>
    </div>
  );
}
