import { Profile, Notification } from '../types';

export async function getCurrentProfile(): Promise<Profile | null> {
  throw new Error('Not implemented');
}

export async function listNotifications(): Promise<Notification[]> {
  throw new Error('Not implemented');
}

export async function markNotificationRead(_id: string): Promise<void> {
  throw new Error('Not implemented');
}

export async function markAllNotificationsRead(): Promise<void> {
  throw new Error('Not implemented');
}

export async function unreadNotificationCount(): Promise<number> {
  throw new Error('Not implemented');
}
