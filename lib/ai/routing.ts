import type {
  DepartmentCode,
  TicketCategory,
} from "@/app/(app)/service-requests/_stubs/constants";

/**
 * Which department handles each category. One config object, so moving a
 * category to another department is a data change.
 */
export const CATEGORY_DEPARTMENT: Record<TicketCategory, DepartmentCode> = {
  ELECTRICAL: "ELEC",
  NETWORK: "NET",
  AV_EQUIPMENT: "ELEC",
  PLUMBING: "CIVIL",
  FURNITURE: "CIVIL",
  CLEANLINESS: "CIVIL",
  HOSTEL: "HOSTEL",
  OTHER: "CIVIL",
};
