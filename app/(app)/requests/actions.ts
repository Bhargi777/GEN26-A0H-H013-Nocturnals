"use server";

import { createAdminRequest } from "../../../lib/db/admin-requests";
import { RequestType } from "../../../components/admin-requests/request-types";

export async function submitRequest(type: RequestType, formData: any) {
  const status = type === "BONAFIDE" ? "PENDING_OFFICE" : "PENDING_DEPT";
  const current_reviewer_role = type === "BONAFIDE" ? "office_staff" : "dept_admin";
  
  const req = await createAdminRequest({
    requester_id: "stub_user_id",
    type,
    purpose: formData.purpose,
    details: formData,
    status,
    current_reviewer_role,
  });
  
  return { success: true, code: req.code };
}
