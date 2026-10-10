import { NextResponse } from "next/server";
import { getAdminRequestByCode } from "../../../../../lib/db/admin-requests";
import { getSignedDownloadUrl } from "../../../../../lib/pdf/generate";

export async function GET(request: Request, { params }: { params: { code: string } }) {
  const adminRequest = await getAdminRequestByCode(params.code);

  if (!adminRequest || adminRequest.status !== "APPROVED") {
    return new NextResponse("Not Found or Not Approved", { status: 404 });
  }

  // Check auth and RLS here in real implementation

  const docPath = adminRequest.document_path || `admin-documents/${params.code}.pdf`;
  const url = await getSignedDownloadUrl(docPath);

  // Redirect to signed URL
  return NextResponse.redirect(url);
}
