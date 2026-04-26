import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { invoices } from "@/db/schema";
import { apiErrorResponse } from "@/server/api/helpers";
import { parseV1Pagination, requireV1Auth } from "@/server/api/v1";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { organizationId } = await requireV1Auth(request);
    const { limit, offset } = parseV1Pagination(request.nextUrl.searchParams);
    const status = request.nextUrl.searchParams.get("status");

    const rows = await db
      .select({
        id: invoices.id,
        clientId: invoices.clientId,
        number: invoices.number,
        title: invoices.title,
        status: invoices.status,
        amountDueCents: invoices.amountDueCents,
        amountPaidCents: invoices.amountPaidCents,
        amountRefundedCents: invoices.amountRefundedCents,
        currencyCode: invoices.currencyCode,
        dueAt: invoices.dueAt,
        paidAt: invoices.paidAt,
        refundedAt: invoices.refundedAt,
        invoiceUrl: invoices.invoiceUrl,
        sentAt: invoices.sentAt,
        createdAt: invoices.createdAt,
        updatedAt: invoices.updatedAt,
      })
      .from(invoices)
      .where(
        and(
          eq(invoices.organizationId, organizationId),
          status ? eq(invoices.status, status) : undefined,
        ),
      )
      .orderBy(desc(invoices.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({ data: rows, limit, offset });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
