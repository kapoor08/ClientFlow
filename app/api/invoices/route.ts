import { NextResponse } from "next/server";
import { requireAuth, apiErrorResponse } from "@/lib/api-helpers";
import {
  listInvoicesForUser,
  createInvoiceForUser,
  type InvoiceFormValues,
} from "@/lib/invoices";

export async function GET() {
  try {
    const { userId } = await requireAuth();
    const data = await listInvoicesForUser(userId);
    return NextResponse.json(data ?? []);
  } catch (err) {
    return apiErrorResponse(err);
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await requireAuth();
    const body = (await request.json()) as InvoiceFormValues;

    if (!body.clientId) {
      return NextResponse.json({ error: "clientId is required." }, { status: 400 });
    }
    if (!body.title?.trim()) {
      return NextResponse.json({ error: "title is required." }, { status: 400 });
    }
    if (!Array.isArray(body.lineItems) || body.lineItems.length === 0) {
      return NextResponse.json({ error: "At least one line item is required." }, { status: 400 });
    }

    const result = await createInvoiceForUser(userId, body);
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
