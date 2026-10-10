export const ADMIN_REQUEST_TYPES = {
  BONAFIDE: 'BONAFIDE',
  NOC: 'NOC',
} as const;

export type AdminRequestType = typeof ADMIN_REQUEST_TYPES[keyof typeof ADMIN_REQUEST_TYPES];

export const ADMIN_REQUEST_TYPE_CONFIG = {
  BONAFIDE: {
    startStatus: 'PENDING_OFFICE',
  },
  NOC: {
    startStatus: 'PENDING_DEPT',
  },
} as const;
