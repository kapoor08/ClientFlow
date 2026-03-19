import { NextRequest, NextResponse } from "next/server";
import {
  listClientsForUser,
  createClientForUser,
} from "@/lib/clients";
import { clientFormSchema } from "@/lib/clients-shared";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import { requireAuth, apiErrorResponse, ApiError } from "@/lib/api-helpers";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const { searchParams } = request.nextUrl;

    const query = searchParams.get("q") ?? "";
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const pageSize = Math.max(
      1,
      Number(searchParams.get("pageSize")) || DEFAULT_PAGE_SIZE,
    );
    const sort = searchParams.get("sort") ?? "";
    const order =
      searchParams.get("order") === "asc" ? "asc" : ("desc" as const);

    const result = await listClientsForUser(userId, {
      query,
      page,
      pageSize,
      sort,
      order,
    });

    return NextResponse.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAuth();

    const body = await request.json();
    const parsed = clientFormSchema.safeParse(body);

    if (!parsed.success) {
      const firstError =
        parsed.error.issues[0]?.message ?? "Invalid request body.";
      throw new ApiError(firstError, 422);
    }

    const result = await createClientForUser(userId, parsed.data);

    return NextResponse.json(
      { clientId: result.clientId },
      { status: 201 },
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}
