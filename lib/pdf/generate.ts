// @ts-ignore
import { PDFDocument, rgb } from "pdf-lib";
import { AdminRequest } from "../db/admin-requests";
import { REQUEST_TYPES } from "../../components/admin-requests/request-types";

export async function generateDocumentPDF(request: AdminRequest, user: any) {
  // Stub for PDF generation using pdf-lib
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 800]);
  const { width, height } = page.getSize();
  const fontSize = 12;

  const config = REQUEST_TYPES[request.type];

  const textLines = [
    "CampusConnect Institution",
    "Prototype document, not an official certificate",
    "--------------------------------------------------",
    `Document: ${config.label}`,
    `Request Code: ${request.code}`,
    `Name: ${user?.full_name || "Stub Name"}`,
    `Roll Number: ${user?.roll_no || "Stub Roll No"}`,
    `Department: ${user?.department_id || "Stub Dept"}`,
    `Purpose: ${request.purpose}`,
    `Issue Date: ${new Date().toLocaleDateString()}`,
    "--------------------------------------------------",
    `Verify at: https://campusconnect.local/verify/${request.code}`
  ];

  let y = height - 50;
  for (const line of textLines) {
    page.drawText(line, {
      x: 50,
      y,
      size: fontSize,
      color: rgb(0, 0, 0),
    });
    y -= 20;
  }

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}

export async function uploadToStorage(requestCode: string, pdfBytes: Uint8Array) {
  // Stub: upload to Supabase storage in `admin-documents` bucket
  return `admin-documents/${requestCode}.pdf`;
}

export async function getSignedDownloadUrl(documentPath: string) {
  // Stub: get signed URL
  return `https://storage.local/${documentPath}?signed=stub`;
}
