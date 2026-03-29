import { NextRequest, NextResponse } from "next/server";
import { listActivityForUser } from "@/lib/activity";
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

    const entityType = searchParams.get("entityType") ?? undefined;
    const dateFrom = searchParams.get("dateFrom") ?? undefined;
    const dateTo = searchParams.get("dateTo") ?? undefined;

    const result = await listActivityForUser(userId, {
      entityType,
      dateFrom,
      dateTo,
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
      "Entity Name",
    ];

    const rows = result.entries.map((e) =>
      rowToCsv([
        e.createdAt,
        e.actorName ?? "",
        e.actorEmail ?? "",
        e.action,
        e.entityType,
        e.entityId ?? "",
        (e.metadata?.name as string) ?? "",
      ]),
    );

    const csv = [rowToCsv(headers), ...rows].join("\n");
    const filename = `activity-logs-${new Date().toISOString().slice(0, 10)}.csv`;

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
