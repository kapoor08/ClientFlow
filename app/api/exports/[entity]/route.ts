import { NextRequest, NextResponse } from "next/server";
import { requireAuth, apiErrorResponse, ApiError } from "@/lib/api-helpers";
import { getOrganizationSettingsContextForUser } from "@/lib/organization-settings";
import { db } from "@/lib/db";
import { clients, projects, tasks, invoices, organizationMemberships, roles } from "@/db/schema";
import { user } from "@/db/auth-schema";
import { and, desc, eq, isNull } from "drizzle-orm";

type Params = { params: Promise<{ entity: string }> };

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };
  const lines = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(",")),
  ];
  return lines.join("\n");
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { userId } = await requireAuth();
    const { entity } = await params;

    const ctx = await getOrganizationSettingsContextForUser(userId);
    if (!ctx) throw new ApiError("No active organization found.", 403);

    const orgId = ctx.organizationId;
    let csv = "";
    let filename = `${entity}.csv`;

    if (entity === "clients") {
      const rows = await db
        .select({
          id: clients.id,
          name: clients.name,
          company: clients.company,
          contactName: clients.contactName,
          contactEmail: clients.contactEmail,
          contactPhone: clients.contactPhone,
          status: clients.status,
          createdAt: clients.createdAt,
        })
        .from(clients)
        .where(and(eq(clients.organizationId, orgId), isNull(clients.deletedAt)))
        .orderBy(desc(clients.createdAt));
      csv = toCsv(rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })));
      filename = "clients.csv";
    } else if (entity === "projects") {
      const rows = await db
        .select({
          id: projects.id,
          name: projects.name,
          status: projects.status,
          priority: projects.priority,
          startDate: projects.startDate,
          dueDate: projects.dueDate,
          clientId: projects.clientId,
          createdAt: projects.createdAt,
        })
        .from(projects)
        .where(and(eq(projects.organizationId, orgId), isNull(projects.deletedAt)))
        .orderBy(desc(projects.createdAt));
      csv = toCsv(
        rows.map((r) => ({
          ...r,
          startDate: r.startDate?.toISOString() ?? "",
          dueDate: r.dueDate?.toISOString() ?? "",
          createdAt: r.createdAt.toISOString(),
        })),
      );
      filename = "projects.csv";
    } else if (entity === "tasks") {
      const rows = await db
        .select({
          id: tasks.id,
          title: tasks.title,
          status: tasks.status,
          priority: tasks.priority,
          projectId: tasks.projectId,
          dueDate: tasks.dueDate,
          createdAt: tasks.createdAt,
        })
        .from(tasks)
        .where(and(eq(tasks.organizationId, orgId), isNull(tasks.deletedAt)))
        .orderBy(desc(tasks.createdAt));
      csv = toCsv(
        rows.map((r) => ({
          ...r,
          dueDate: r.dueDate?.toISOString() ?? "",
          createdAt: r.createdAt.toISOString(),
        })),
      );
      filename = "tasks.csv";
    } else if (entity === "invoices") {
      const rows = await db
        .select({
          id: invoices.id,
          status: invoices.status,
          amountDueCents: invoices.amountDueCents,
          amountPaidCents: invoices.amountPaidCents,
          currencyCode: invoices.currencyCode,
          dueAt: invoices.dueAt,
          paidAt: invoices.paidAt,
          createdAt: invoices.createdAt,
        })
        .from(invoices)
        .where(eq(invoices.organizationId, orgId))
        .orderBy(desc(invoices.createdAt));
      csv = toCsv(
        rows.map((r) => ({
          ...r,
          dueAt: r.dueAt?.toISOString() ?? "",
          paidAt: r.paidAt?.toISOString() ?? "",
          createdAt: r.createdAt.toISOString(),
        })),
      );
      filename = "invoices.csv";
    } else if (entity === "team") {
      const rows = await db
        .select({
          userId: organizationMemberships.userId,
          name: user.name,
          email: user.email,
          roleId: organizationMemberships.roleId,
          roleName: roles.name,
          joinedAt: organizationMemberships.createdAt,
        })
        .from(organizationMemberships)
        .innerJoin(user, eq(organizationMemberships.userId, user.id))
        .leftJoin(roles, eq(organizationMemberships.roleId, roles.id))
        .where(eq(organizationMemberships.organizationId, orgId))
        .orderBy(organizationMemberships.createdAt);
      csv = toCsv(
        rows.map((r) => ({
          userId: r.userId,
          name: r.name,
          email: r.email,
          role: r.roleName ?? "",
          joinedAt: r.joinedAt.toISOString(),
        })),
      );
      filename = "team.csv";
    } else {
      throw new ApiError("Unknown export type.", 400);
    }

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
