import { REQUEST_STATUS as R, TICKET_STATUS as T, type AdminRequest, type AuditEvent, type Notification, type Ticket } from "./preview-contract";

export const PREVIEW_USER_ID = "preview-requester";
export const PREVIEW_DEPARTMENT_ID = "preview-network";
export const previewTickets: Ticket[] = [
  { id: "sr-101", code: "SR-000101", requester_id: PREVIEW_USER_ID, title: "Library Wi-Fi disconnects", category: "NETWORK", status: T.open, assigned_department_id: PREVIEW_DEPARTMENT_ID, created_at: "2026-10-01T08:00:00Z" },
  { id: "sr-102", code: "SR-000102", requester_id: PREVIEW_USER_ID, title: "Projector has no display", category: "AV_EQUIPMENT", status: T.assigned, assigned_department_id: "preview-av", created_at: "2026-10-02T09:00:00Z" },
  { id: "sr-103", code: "SR-000103", requester_id: PREVIEW_USER_ID, title: "Lab network port is inactive", category: "NETWORK", status: T.inProgress, assigned_department_id: PREVIEW_DEPARTMENT_ID, created_at: "2026-10-03T10:00:00Z" },
  { id: "sr-104", code: "SR-000104", requester_id: "preview-faculty", title: "Office network is unavailable", category: "NETWORK", status: T.reopened, assigned_department_id: PREVIEW_DEPARTMENT_ID, created_at: "2026-10-04T11:00:00Z" },
  { id: "sr-105", code: "SR-000105", requester_id: PREVIEW_USER_ID, title: "Reading room light flickers", category: "ELECTRICAL", status: T.resolved, assigned_department_id: "preview-electrical", created_at: "2026-10-05T08:00:00Z" },
  { id: "sr-106", code: "SR-000106", requester_id: PREVIEW_USER_ID, title: "Desk network cable replaced", category: "NETWORK", status: T.closed, assigned_department_id: PREVIEW_DEPARTMENT_ID, created_at: "2026-10-06T08:00:00Z" },
];
export const previewRequests: AdminRequest[] = [
  { id: "ar-201", code: "AR-000201", requester_id: PREVIEW_USER_ID, type: "BONAFIDE", purpose: "Scholarship application", status: R.pendingOffice, created_at: "2026-10-02T08:00:00Z" },
  { id: "ar-202", code: "AR-000202", requester_id: PREVIEW_USER_ID, type: "NOC", purpose: "Industry internship", status: R.pendingDept, created_at: "2026-10-04T08:00:00Z" },
  { id: "ar-203", code: "AR-000203", requester_id: "preview-faculty", type: "BONAFIDE", purpose: "Academic application", status: R.pendingOffice, created_at: "2026-10-01T08:00:00Z" },
  { id: "ar-204", code: "AR-000204", requester_id: PREVIEW_USER_ID, type: "BONAFIDE", purpose: "Education application", status: R.approved, created_at: "2026-10-07T08:00:00Z" },
  { id: "ar-205", code: "AR-000205", requester_id: PREVIEW_USER_ID, type: "NOC", purpose: "Workshop attendance", status: R.rejected, created_at: "2026-10-08T08:00:00Z" },
];
export const previewNotifications: Notification[] = [
  { id: "n-1", user_id: PREVIEW_USER_ID, title: "Network issue assigned", body: "The network team is reviewing SR-000101.", link: "/service-requests/sr-101", read_at: null, created_at: "2026-10-10T08:00:00Z" },
  { id: "n-2", user_id: PREVIEW_USER_ID, title: "Certificate approved", body: "Your bonafide certificate AR-000204 is ready.", link: "/requests/ar-204", read_at: null, created_at: "2026-10-09T08:00:00Z" },
  { id: "n-3", user_id: PREVIEW_USER_ID, title: "Light repair completed", body: "Verify the repair for SR-000105.", link: "/service-requests/sr-105", read_at: null, created_at: "2026-10-08T08:00:00Z" },
  { id: "n-4", user_id: PREVIEW_USER_ID, title: "NOC requires changes", body: "Review the decision note on AR-000205.", link: "/requests/ar-205", read_at: null, created_at: "2026-10-07T08:00:00Z" },
  { id: "n-5", user_id: PREVIEW_USER_ID, title: "Projector issue assigned", body: "The AV team is reviewing SR-000102.", link: "/service-requests/sr-102", read_at: "2026-10-06T12:00:00Z", created_at: "2026-10-06T08:00:00Z" },
  { id: "n-6", user_id: PREVIEW_USER_ID, title: "Service request closed", body: "SR-000106 is closed after verification.", link: "/service-requests/sr-106", read_at: "2026-10-05T12:00:00Z", created_at: "2026-10-05T08:00:00Z" },
];
export const previewEvents: AuditEvent[] = [
  { id: "e-1", actor_id: PREVIEW_USER_ID, actor_name: "Requester preview", action: "Reported issue", from_status: null, to_status: T.open, note: "Connection drops in the reading room.", created_at: "2026-10-01T08:00:00Z" },
  { id: "e-2", actor_id: "preview-coordinator", actor_name: "Facilities preview", action: "Assigned department", from_status: T.open, to_status: T.assigned, note: "Network team to inspect the access point.", created_at: "2026-10-02T08:00:00Z" },
];
