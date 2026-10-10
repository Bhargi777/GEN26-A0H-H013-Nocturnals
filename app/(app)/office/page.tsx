import React from "react";
import { ReviewList } from "../../../components/admin-requests/ReviewList";

export default async function OfficePage({ searchParams }: { searchParams: { role?: string } }) {
  // We're stubbing the role and data retrieval. 
  // In a real app we'd get the role from auth context and fetch from DB.
  
  const role = searchParams.role || "office_staff"; // default stub role

  // Stub data
  const requests = [
    {
      id: "req_1",
      code: "AR-000100",
      requester_id: "user_1",
      type: "NOC",
      purpose: "internship",
      details: {},
      status: role === "dept_admin" ? "PENDING_DEPT" : "PENDING_OFFICE",
      current_reviewer_role: role,
      decided_by: null,
      decision_note: null,
      document_path: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      decided_at: null,
    } as any
  ];

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900">Office Inbox</h1>
        <p className="mt-1 text-sm text-slate-500">
          Review administrative requests. Viewing as {role.replace("_", " ")}.
        </p>
      </div>

      <ReviewList requests={requests} role={role} />
    </div>
  );
}
