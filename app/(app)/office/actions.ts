"use server";

import { decideAdminRequest } from "../../../lib/db/admin-requests";

export async function processDecision(code: string, status: "APPROVED" | "REJECTED", note?: string) {
  try {
    await decideAdminRequest(code, status, note);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to process decision" };
  }
}
