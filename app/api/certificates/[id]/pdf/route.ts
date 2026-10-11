import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";
import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/server";

interface Row {
  code: string; type: "BONAFIDE" | "NOC"; purpose: string; status: string; decided_at: string | null;
  requester: { full_name: string; roll_no: string | null; department: { name: string } | null } | null;
}

function wrap(text: string, font: PDFFont, size: number, width: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) > width && line) { lines.push(line); line = word; } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

/** Approved certificates only. Row-level security decides who can read the request at all. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Sign in to download certificates.", { status: 401 });

  // The server client is typed against the generated Database; this select is shaped for the PDF only.
  const { data, error } = await (supabase as unknown as { from: (t: string) => { select: (c: string) => { eq: (k: string, v: string) => { maybeSingle: () => Promise<{ data: Row | null; error: { message: string } | null }> } } } })
    .from("admin_requests")
    .select("code, type, purpose, status, decided_at, requester:requester_id(full_name, roll_no, department:department_id(name))")
    .eq("id", id).maybeSingle();
  if (error) return new Response("The request could not be loaded.", { status: 500 });
  if (!data) return new Response("Request not found.", { status: 404 });
  if (data.status !== "APPROVED") return new Response("This certificate has not been approved yet.", { status: 409 });

  const holder = data.requester?.full_name ?? "the student";
  const department = data.requester?.department?.name ?? "the university";
  const roll = data.requester?.roll_no ? ` (Roll No. ${data.requester.roll_no})` : "";
  const issued = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" }).format(new Date(data.decided_at ?? Date.now()));
  const body = data.type === "BONAFIDE"
    ? `This is to certify that ${holder}${roll} is a bonafide student of the Department of ${department}. This certificate is issued on request for the purpose of: ${data.purpose}.`
    : `This is to certify that the university has no objection to ${holder}${roll}, a student of the Department of ${department}, for the purpose of: ${data.purpose}. This certificate is issued on request and carries no further obligation.`;

  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]);
  const serif = await pdf.embedFont(StandardFonts.TimesRoman);
  const bold = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const teal = rgb(0.059, 0.463, 0.431);
  const ink = rgb(0.06, 0.09, 0.16);

  page.drawRectangle({ x: 28, y: 28, width: 539, height: 786, borderColor: teal, borderWidth: 2 });
  page.drawText("CampusConnect University", { x: 60, y: 760, size: 22, font: bold, color: teal });
  page.drawText("Office of Student Affairs", { x: 60, y: 738, size: 12, font: serif, color: ink });
  const title = data.type === "BONAFIDE" ? "BONAFIDE CERTIFICATE" : "NO OBJECTION CERTIFICATE";
  page.drawText(title, { x: (595 - bold.widthOfTextAtSize(title, 20)) / 2, y: 670, size: 20, font: bold, color: ink });
  page.drawText(`Certificate No. ${data.code}`, { x: 60, y: 630, size: 11, font: serif, color: ink });
  page.drawText(`Date of issue: ${issued}`, { x: 595 - 60 - serif.widthOfTextAtSize(`Date of issue: ${issued}`, 11), y: 630, size: 11, font: serif, color: ink });

  let y = 580;
  for (const line of wrap(body, serif, 14, 475)) { page.drawText(line, { x: 60, y, size: 14, font: serif, color: ink }); y -= 24; }

  const verifyUrl = `${new URL(request.url).origin}/verify/${data.code}`;
  const qr = await pdf.embedPng(await QRCode.toBuffer(verifyUrl, { margin: 1, width: 240 }));
  page.drawImage(qr, { x: 60, y: 90, width: 100, height: 100 });
  page.drawText("Scan to verify this certificate", { x: 60, y: 76, size: 9, font: serif, color: ink });
  page.drawText(verifyUrl, { x: 60, y: 64, size: 8, font: serif, color: ink });
  page.drawLine({ start: { x: 380, y: 130 }, end: { x: 535, y: 130 }, thickness: 1, color: ink });
  page.drawText("Authorised signatory", { x: 395, y: 114, size: 11, font: serif, color: ink });
  page.drawText("Student Affairs Office", { x: 395, y: 100, size: 11, font: bold, color: ink });

  const bytes = await pdf.save();
  return new Response(new Uint8Array(bytes), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${data.code}.pdf"`, "Cache-Control": "private, no-store" },
  });
}
