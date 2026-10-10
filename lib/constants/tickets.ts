export const TICKET_CATEGORIES = {
  ELECTRICAL: 'ELECTRICAL',
  NETWORK: 'NETWORK',
  AV_EQUIPMENT: 'AV_EQUIPMENT',
  PLUMBING: 'PLUMBING',
  FURNITURE: 'FURNITURE',
  CLEANLINESS: 'CLEANLINESS',
  HOSTEL: 'HOSTEL',
  OTHER: 'OTHER',
} as const;

export type TicketCategory = typeof TICKET_CATEGORIES[keyof typeof TICKET_CATEGORIES];

export const TICKET_PRIORITIES = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
} as const;

export type TicketPriority = typeof TICKET_PRIORITIES[keyof typeof TICKET_PRIORITIES];

import { TicketStatus } from './statuses';

// Allowed transitions mapping could be defined here or in the database. 
// We define them to share with frontend.
export const ALLOWED_TICKET_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  OPEN: ['ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'],
  ASSIGNED: ['IN_PROGRESS', 'RESOLVED'],
  IN_PROGRESS: ['RESOLVED'],
  RESOLVED: ['CLOSED', 'REOPENED'],
  CLOSED: ['REOPENED'],
  REOPENED: ['ASSIGNED', 'IN_PROGRESS', 'RESOLVED'],
};
