import { NextRequest, NextResponse } from "next/server";
import { listAuditLogsForUser } from "@/lib/audit";
import { requireAuth, apiErrorResponse } from "@/lib/api-helpers";

function escapeCsv(value: unknown): string {
  const str = value == null ? "" : String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function rowToCsv(cols: unknown[]): string {
  return cols.map(escapeCsv).join(",");
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const { searchParams } = request.nextUrl;
    const query = searchParams.get("q") ?? "";

    const result = await listAuditLogsForUser(userId, {
      query,
      page: 1,
      pageSize: 5000,
    });

    if (!result) {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }

    const headers = [
      "Timestamp",
      "Actor",
      "Actor Email",
      "Action",
      "Entity Type",
      "Entity ID",
      "IP Address",
      "User Agent",
    ];

    const rows = result.logs.map((l) =>
      rowToCsv([
        l.createdAt.toISOString(),
        l.actorName ?? "",
        l.actorEmail ?? "",
        l.action,
        l.entityType ?? "",
        l.entityId ?? "",
        l.ipAddress ?? "",
        l.userAgent ?? "",
      ]),
    );

    const csv = [rowToCsv(headers), ...rows].join("\n");
    const filename = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
