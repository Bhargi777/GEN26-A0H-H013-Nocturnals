import { z } from "zod";

export const REQUEST_TYPES = {
  BONAFIDE: {
    label: "Bonafide Certificate",
    description: "Request a bonafide certificate for official purposes.",
    fields: z.object({
      purpose: z.string().min(1, "Purpose is required"),
      addressedTo: z.string().optional(),
    }),
    uiFields: [
      { name: "purpose", label: "Purpose", type: "text", required: true },
      { name: "addressedTo", label: "Addressed To (Optional)", type: "text", required: false },
    ],
    approvalPath: ["OFFICE"],
    documentTemplate: "bonafide_v1",
  },
  NOC: {
    label: "No Objection Certificate (NOC)",
    description: "Request an NOC for internship, competition, or other events.",
    fields: z.object({
      purpose: z.enum(["internship", "competition", "other"], {
        required_error: "Purpose is required",
      }),
      organisationName: z.string().min(1, "Organisation Name is required"),
      startDate: z.string().min(1, "Start Date is required"),
      endDate: z.string().min(1, "End Date is required"),
    }),
    uiFields: [
      { 
        name: "purpose", 
        label: "Purpose", 
        type: "select", 
        required: true,
        options: [
          { value: "internship", label: "Internship" },
          { value: "competition", label: "Competition" },
          { value: "other", label: "Other" }
        ]
      },
      { name: "organisationName", label: "Organisation Name", type: "text", required: true },
      { name: "startDate", label: "Start Date", type: "date", required: true },
      { name: "endDate", label: "End Date", type: "date", required: true },
    ],
    approvalPath: ["DEPARTMENT", "OFFICE"],
    documentTemplate: "noc_v1",
  },
} as const;

export type RequestType = keyof typeof REQUEST_TYPES;
