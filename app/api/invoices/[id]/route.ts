import { NextResponse } from "next/server";
import { requireAuth, apiErrorResponse } from "@/lib/api-helpers";
import {
  getInvoiceForUser,
  updateInvoiceForUser,
  markInvoicePaidForUser,
  markInvoiceSentForUser,
  deleteInvoiceForUser,
} from "@/lib/invoices";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  try {
    const { userId } = await requireAuth();
    const { id } = await params;
    const invoice = await getInvoiceForUser(userId, id);
    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
    }
    return NextResponse.json(invoice);
  } catch (err) {
    return apiErrorResponse(err);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { userId } = await requireAuth();
    const { id } = await params;
    const body = await request.json();

    // Special actions
    if (body.action === "mark_paid") {
      await markInvoicePaidForUser(userId, id);
      return NextResponse.json({ ok: true });
    }
    if (body.action === "mark_sent") {
      await markInvoiceSentForUser(userId, id);
      return NextResponse.json({ ok: true });
    }

    await updateInvoiceForUser(userId, id, body);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return apiErrorResponse(err);
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { userId } = await requireAuth();
    const { id } = await params;
    await deleteInvoiceForUser(userId, id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
