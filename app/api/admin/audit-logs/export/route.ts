import { NextRequest, NextResponse } from "next/server";
import { guardAdmin } from "@/server/auth/admin-guard";
import { exportAdminAuditLogs } from "@/server/admin/audit-logs";

function escape(v: unknown): string {
  const s = v == null ? "" : typeof v === "object" ? JSON.stringify(v) : String(v);
  return s.includes(",") || s.includes('"') || s.includes("\n")
    ? `"${s.replace(/"/g, '""')}"`
    : s;
}

export async function GET(req: NextRequest) {
  if (!(await guardAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const sp = req.nextUrl.searchParams;
  const rows = await exportAdminAuditLogs({
    query: sp.get("q") || undefined,
    entityType: sp.get("entityType") || undefined,
    dateFrom: sp.get("dateFrom") || undefined,
    dateTo: sp.get("dateTo") || undefined,
  });

  const headers = [
    "createdAt",
    "action",
    "entityType",
    "entityId",
    "actorName",
    "actorEmail",
    "orgName",
    "ipAddress",
    "metadata",
  ];

  const lines = [
    headers.join(","),
    ...rows.map((r) =>
      [
        escape(r.createdAt.toISOString()),
        escape(r.action),
        escape(r.entityType),
        escape(r.entityId),
        escape(r.actorName),
        escape(r.actorEmail),
        escape(r.orgName),
        escape(r.ipAddress),
        escape(r.metadata),
      ].join(","),
    ),
  ];

  const csv = lines.join("\n");
  const filename = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
