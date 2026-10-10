import {
  ServiceTicket,
  EventLog,
  CreateTicketInput,
  TransitionTicketInput,
  RateTicketInput,
} from '../types';

export async function createTicket(_input: CreateTicketInput): Promise<ServiceTicket> {
  throw new Error('Not implemented');
}

export async function getTicket(_id: string): Promise<ServiceTicket | null> {
  throw new Error('Not implemented');
}

export async function listMyTickets(): Promise<ServiceTicket[]> {
  throw new Error('Not implemented');
}

export async function listDepartmentTickets(_filters?: Record<string, unknown>): Promise<ServiceTicket[]> {
  throw new Error('Not implemented');
}

export async function assignTicket(_ticketId: string, _assigneeId: string): Promise<ServiceTicket> {
  throw new Error('Not implemented');
}

export async function transitionTicket(_input: TransitionTicketInput): Promise<ServiceTicket> {
  throw new Error('Not implemented');
}

export async function followTicket(_ticketId: string): Promise<void> {
  throw new Error('Not implemented');
}

export async function rateTicket(_input: RateTicketInput): Promise<ServiceTicket> {
  throw new Error('Not implemented');
}

export async function getTicketEvents(_ticketId: string): Promise<EventLog[]> {
  throw new Error('Not implemented');
}

export async function uploadTicketPhoto(_ticketId: string, _file: File): Promise<string> {
  throw new Error('Not implemented');
}

export async function getPhotoUrl(_path: string): Promise<string> {
  throw new Error('Not implemented');
}
