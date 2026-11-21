import { NextResponse, type NextRequest } from "next/server";
import { getMember } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/data/query";
import { toCsv } from "@/lib/csv";
import type { ImportReportRow } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const member = await getMember();
  if (!member) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const { id } = await params;
  if (!isUuid(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const supabase = await createClient();
  const { data } = await supabase.from("imports").select("filename").eq("id", id).maybeSingle();
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const all = request.nextUrl.searchParams.get("all") === "1";
  let q = supabase.from("import_rows").select("row_number, outcome, message, values").eq("import_id", id).order("row_number").limit(5000);
  if (!all) q = q.in("outcome", ["skipped", "failed"]);
  const { data: rowData } = await q;
  const rows: ImportReportRow[] = ((rowData ?? []) as { row_number: number; outcome: ImportReportRow["outcome"]; message: string; values: Record<string, string> | null }[])
    .map((r) => ({ row: r.row_number, outcome: r.outcome, message: r.message, values: r.values ?? undefined }));
  const valueHeaders = [...new Set(rows.flatMap((r) => Object.keys(r.values ?? {})))];
  const csv = toCsv(["Row", "Outcome", "Message", ...valueHeaders], rows.map((r) => [r.row, r.outcome, r.message, ...valueHeaders.map((h) => r.values?.[h] ?? "")]));
  const base = String(data.filename).replace(/\.[^.]+$/, "").replace(/[^a-z0-9-_]+/gi, "_").slice(0, 60) || "import";
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${base}-${all ? "report" : "errors"}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
