export const ROLES = {
  STUDENT: 'student',
  FACULTY: 'faculty',
  CR: 'cr',
  CLUB_PRESIDENT: 'club_president',
  TECHNICIAN: 'technician',
  DEPT_OFFICE: 'dept_office',
  DEPT_HEAD: 'dept_head',
  EVENTS_DEPT: 'events_dept',
  OSA: 'osa',
  CAMPUS_DIRECTOR: 'campus_director',
  CANTEEN_KITCHEN: 'canteen_kitchen',
  CANTEEN_COUNTER: 'canteen_counter',
  CANTEEN_MANAGER: 'canteen_manager',
  ADMIN: 'admin',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

/**
 * Navigation links by role (MASTER-SPEC section 6)
 */
export const NAVIGATION_BY_ROLE: Record<Role, string[]> = {
  [ROLES.STUDENT]: ['/service-requests', '/canteen'],
  [ROLES.CR]: ['/service-requests', '/canteen', '/rooms/book', '/rooms/my-requests'],
  [ROLES.CLUB_PRESIDENT]: ['/service-requests', '/canteen', '/events/new', '/events/mine'],
  [ROLES.FACULTY]: ['/service-requests', '/canteen'],
  [ROLES.TECHNICIAN]: ['/service-requests/queue'],
  [ROLES.DEPT_OFFICE]: ['/rooms/dept', '/service-requests/queue'],
  [ROLES.DEPT_HEAD]: ['/service-requests/queue'],
  [ROLES.EVENTS_DEPT]: ['/events/inbox', '/events/approved'],
  [ROLES.OSA]: ['/events/review'],
  [ROLES.CAMPUS_DIRECTOR]: ['/events/director'],
  [ROLES.CANTEEN_MANAGER]: ['/canteen/manage'],
  [ROLES.CANTEEN_KITCHEN]: ['/canteen/kitchen'],
  [ROLES.CANTEEN_COUNTER]: ['/canteen/counter'],
  [ROLES.ADMIN]: [
    '/service-requests',
    '/canteen',
    '/rooms/book',
    '/events/new',
    '/admin/reports',
  ],
};
