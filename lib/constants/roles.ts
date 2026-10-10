export const ROLES = {
  STUDENT: 'student',
  FACULTY: 'faculty',
  TECHNICIAN: 'technician',
  DEPT_ADMIN: 'dept_admin',
  OFFICE_STAFF: 'office_staff',
  ADMIN: 'admin',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];
