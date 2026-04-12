import { NextRequest, NextResponse } from "next/server";
import {
  getClientDetailForUser,
  updateClientForUser,
  deleteClientForUser,
} from "@/server/clients";
import { clientFormSchema } from "@/schemas/clients";
import { requireAuth, apiErrorResponse, ApiError } from "@/server/api/helpers";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const { userId } = await requireAuth();
    const { id } = await params;

    const result = await getClientDetailForUser(userId, id);

    if (!result.access) {
      throw new ApiError("No active organization found.", 403);
    }

    if (!result.client) {
      throw new ApiError("Client not found.", 404);
    }

    return NextResponse.json({
      client: result.client,
      linkedProjects: result.linkedProjects,
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const { userId } = await requireAuth();
    const { id } = await params;

    const body = await request.json();
    const parsed = clientFormSchema.safeParse(body);

    if (!parsed.success) {
      const firstError =
        parsed.error.issues[0]?.message ?? "Invalid request body.";
      throw new ApiError(firstError, 422);
    }

    const result = await updateClientForUser(userId, id, parsed.data);

    return NextResponse.json({ clientId: result.clientId });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    const { userId } = await requireAuth();
    const { id } = await params;

    await deleteClientForUser(userId, id);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
