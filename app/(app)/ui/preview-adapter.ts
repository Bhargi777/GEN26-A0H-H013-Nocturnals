"use client";

import { z } from "zod";
import { PREVIEW_DEPARTMENT_ID, PREVIEW_USER_ID, previewNotifications } from "./fixtures";
import { ROLES, ROLE_LABELS, type Notification, type Profile, type Role } from "./preview-contract";

export interface AuthResult { error?: string; message?: string }
export interface FrontendAdapter {
  getSession: () => Promise<Profile | null>;
  signIn: (input: { email: string; password: string }) => Promise<AuthResult>;
  signUp: (input: { fullName: string; email: string; password: string }) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  getNotifications: (profile: Profile) => Promise<Notification[]>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  subscribeNotifications?: (profile: Profile, onChange: () => void) => () => void;
}

const SESSION_KEY = "campusconnect.preview.role";
const READ_KEY = "campusconnect.preview.read";
export const previewEnabled = process.env.NODE_ENV !== "production";
const roleSchema = z.enum(Object.values(ROLES) as [Role, ...Role[]]);
const readSchema = z.record(z.string(), z.string().datetime());

function readMarks(): Record<string, string> {
  const raw = sessionStorage.getItem(READ_KEY);
  if (!raw) return {};
  try { return readSchema.parse(JSON.parse(raw)); } catch { return {}; }
}

export async function startPreview(role: Role) {
  if (!previewEnabled) throw new Error("Role previews are available only in development.");
  sessionStorage.setItem(SESSION_KEY, roleSchema.parse(role));
}

export const previewAdapter: FrontendAdapter = {
  async getSession() {
    if (!previewEnabled) return null;
    const parsed = roleSchema.safeParse(sessionStorage.getItem(SESSION_KEY));
    if (!parsed.success) return null;
    return { id: PREVIEW_USER_ID, full_name: `${ROLE_LABELS[parsed.data]} preview`, email: "preview@example.invalid", role: parsed.data, department_id: PREVIEW_DEPARTMENT_ID };
  },
  async signIn() { return { error: "Sign-in is not connected yet. Contact campus support or try again after the service is connected." }; },
  async signUp() { return { error: "Account registration is not connected yet. Contact campus support or try again after the service is connected." }; },
  async signOut() { sessionStorage.removeItem(SESSION_KEY); sessionStorage.removeItem(READ_KEY); },
  async getNotifications(profile) {
    if (!previewEnabled) return [];
    const read = readMarks();
    return previewNotifications.filter((item) => item.user_id === profile.id).map((item) => ({ ...item, read_at: read[item.id] ?? item.read_at }));
  },
  async markNotificationRead(id) {
    if (!previewEnabled) throw new Error("Notifications are not connected yet. Try again later.");
    const session = await previewAdapter.getSession();
    if (!session || !previewNotifications.some((item) => item.id === id && item.user_id === session.id)) throw new Error("This notification is unavailable. Refresh the page.");
    sessionStorage.setItem(READ_KEY, JSON.stringify({ ...readMarks(), [id]: new Date().toISOString() }));
  },
  async markAllNotificationsRead() {
    const session = await previewAdapter.getSession();
    if (!session) throw new Error("Sign in to update notifications.");
    const read = readMarks();
    for (const item of previewNotifications.filter((item) => item.user_id === session.id)) read[item.id] ??= new Date().toISOString();
    sessionStorage.setItem(READ_KEY, JSON.stringify(read));
  },
};

