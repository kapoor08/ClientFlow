import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { createElement, type ReactElement, type JSXElementConstructor } from "react";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { requireAuth, apiErrorResponse } from "@/server/api/helpers";
import { getInvoicePDFDataForUser } from "@/server/invoices";
import { InvoicePDFDocument } from "@/components/invoices/InvoicePDFDocument";

type Params = { params: Promise<{ id: string }> };

async function loadAppLogo(): Promise<{ data: Buffer; format: "png" } | undefined> {
  try {
    const buffer = await readFile(path.join(process.cwd(), "public", "app-logo.png"));
    return { data: buffer, format: "png" };
  } catch {
    return undefined;
  }
}

export async function GET(req: Request, { params }: Params) {
  try {
    const { userId } = await requireAuth();
    const { id } = await params;

    const [data, appLogo] = await Promise.all([
      getInvoicePDFDataForUser(userId, id),
      loadAppLogo(),
    ]);

    if (!data) {
      return new Response("Invoice not found.", { status: 404 });
    }

    const element = createElement(InvoicePDFDocument, { data, appLogo }) as ReactElement<
      DocumentProps,
      string | JSXElementConstructor<unknown>
    >;

    const buffer = await renderToBuffer(element);
    const bytes = new Uint8Array(buffer);

    const filename = `Invoice-${data.invoice.number ?? id.slice(0, 8)}.pdf`;
    const url = new URL(req.url);
    const isDownload = url.searchParams.get("download") === "1";

    return new Response(bytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": isDownload
          ? `attachment; filename="${filename}"`
          : `inline; filename="${filename}"`,
        "Content-Length": String(bytes.byteLength),
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
