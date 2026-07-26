import { NextResponse } from "next/server";
import { requireAuth, apiErrorResponse } from "@/server/api/helpers";
import {
  getInvoiceForUser,
  updateInvoiceForUser,
  markInvoicePaidForUser,
  markInvoiceSentForUser,
  deleteInvoiceForUser,
} from "@/server/invoices";
import { invoiceUpdateSchema } from "@/schemas/invoices";

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

    const parsed = invoiceUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input." },
        { status: 400 },
      );
    }

    await updateInvoiceForUser(userId, id, parsed.data);
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
