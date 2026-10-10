import { z } from 'zod';
import { TICKET_CATEGORIES, TICKET_PRIORITIES, ADMIN_REQUEST_TYPES } from '../constants';

const ticketCategories = Object.values(TICKET_CATEGORIES) as [string, ...string[]];
const ticketPriorities = Object.values(TICKET_PRIORITIES) as [string, ...string[]];
const adminRequestTypes = Object.values(ADMIN_REQUEST_TYPES) as [string, ...string[]];

export const CreateTicketSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title is too long'),
  description: z.string().min(10, 'Description is too short'),
  category: z.enum(ticketCategories),
  priority: z.enum(ticketPriorities),
  building_id: z.string().uuid('Invalid building'),
  room_id: z.string().uuid('Invalid room').nullable().optional(),
  location_note: z.string().default(''),
});
export type CreateTicketInput = z.infer<typeof CreateTicketSchema>;

export const CreateAdminRequestSchema = z.object({
  type: z.enum(adminRequestTypes),
  purpose: z.string().min(1, 'Purpose is required'),
  details: z.record(z.string(), z.unknown()).default({}),
});
export type CreateAdminRequestInput = z.infer<typeof CreateAdminRequestSchema>;

export const TransitionTicketSchema = z.object({
  ticket_id: z.string().uuid(),
  to_status: z.string(),
  note: z.string().nullable().optional(),
  assigned_to: z.string().uuid().nullable().optional(),
});
export type TransitionTicketInput = z.infer<typeof TransitionTicketSchema>;

export const DecideAdminRequestSchema = z.object({
  request_id: z.string().uuid(),
  decision: z.enum(['APPROVE', 'REJECT', 'FORWARD']),
  note: z.string().nullable().optional(),
});
export type DecideAdminRequestInput = z.infer<typeof DecideAdminRequestSchema>;

export const RateTicketSchema = z.object({
  ticket_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  feedback: z.string().nullable().optional(),
});
export type RateTicketInput = z.infer<typeof RateTicketSchema>;
