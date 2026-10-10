import { RequestType } from "../../components/admin-requests/request-types";

export type AdminRequest = {
  id: string;
  code: string;
  requester_id: string;
  type: RequestType;
  purpose: string;
  details: Record<string, any>;
  status: "PENDING_DEPT" | "PENDING_OFFICE" | "APPROVED" | "REJECTED";
  current_reviewer_role: string;
  decided_by: string | null;
  decision_note: string | null;
  document_path: string | null;
  created_at: string;
  updated_at: string;
  decided_at: string | null;
};

// Stub implementations
export async function createAdminRequest(data: Omit<AdminRequest, "id" | "code" | "created_at" | "updated_at" | "decided_at" | "decided_by" | "decision_note" | "document_path">): Promise<AdminRequest> {
  const code = `AR-${Math.floor(Math.random() * 10000).toString().padStart(6, '0')}`;
  return {
    ...data,
    id: `req_${Math.random()}`,
    code,
    decided_by: null,
    decision_note: null,
    document_path: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    decided_at: null,
  };
}

export async function getUserRequests(userId: string): Promise<AdminRequest[]> {
  return [];
}

export async function getAdminRequestByCode(code: string): Promise<AdminRequest | null> {
  return null;
}

export async function decideAdminRequest(code: string, status: "APPROVED" | "REJECTED", note?: string): Promise<void> {
  // Stub
}
