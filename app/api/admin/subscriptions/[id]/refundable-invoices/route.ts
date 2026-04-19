import { NextRequest, NextResponse } from "next/server";
import { guardAdmin } from "@/server/auth/admin-guard";
import { listRefundableInvoicesForSubscription } from "@/server/admin/billing";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await guardAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const rows = await listRefundableInvoicesForSubscription(id);

  return NextResponse.json({
    invoices: rows.map((r) => ({
      ...r,
      paidAt: r.paidAt?.toISOString() ?? null,
    })),
  });
}
