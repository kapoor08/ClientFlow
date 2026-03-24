import { NextResponse } from "next/server";
import { getServerSession } from "./get-session";
import { PlanLimitError } from "./plan-enforcement";

export type AuthenticatedContext = {
  userId: string;
};

export class ApiError extends Error {
  constructor(
    public override message: string,
    public status: number = 400,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Call at the top of any API route handler.
 * Throws ApiError(401) if no session exists, otherwise returns { userId }.
 */
export async function requireAuth(): Promise<AuthenticatedContext> {
  const session = await getServerSession();

  if (!session?.user) {
    throw new ApiError("Unauthorized.", 401);
  }

  return { userId: session.user.id };
}

/**
 * Wraps any thrown value into a properly typed NextResponse.
 * Use in every route handler's catch block.
 */
export function apiErrorResponse(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  if (error instanceof PlanLimitError) {
    return NextResponse.json(
      { error: error.message, upgrade: true },
      { status: 402 },
    );
  }

  console.error("[API Error]", error);

  return NextResponse.json(
    { error: "An unexpected error occurred." },
    { status: 500 },
  );
}
