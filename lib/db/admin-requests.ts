import {
  AdminRequest,
  EventLog,
  CreateAdminRequestInput,
  DecideAdminRequestInput,
} from '../types';
import { Role } from '../constants';

export async function createAdminRequest(_input: CreateAdminRequestInput): Promise<AdminRequest> {
  throw new Error('Not implemented');
}

export async function getAdminRequest(_id: string): Promise<AdminRequest | null> {
  throw new Error('Not implemented');
}

export async function listMyAdminRequests(): Promise<AdminRequest[]> {
  throw new Error('Not implemented');
}

export async function listReviewQueue(_role: Role): Promise<AdminRequest[]> {
  throw new Error('Not implemented');
}

export async function decideAdminRequest(_input: DecideAdminRequestInput): Promise<AdminRequest> {
  throw new Error('Not implemented');
}

export async function attachDocument(_requestId: string, _file: File): Promise<string> {
  throw new Error('Not implemented');
}

export async function getDocumentUrl(_path: string): Promise<string> {
  throw new Error('Not implemented');
}

export async function getAdminRequestEvents(_requestId: string): Promise<EventLog[]> {
  throw new Error('Not implemented');
}
