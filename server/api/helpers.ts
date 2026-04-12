import { NextResponse } from "next/server";
import { getServerSession } from "@/server/auth/session";
import { PlanLimitError } from "@/server/subscription/plan-enforcement";
import { validateApiKey } from "@/server/auth/api-key-auth";

export type AuthenticatedContext = {
  userId: string;
};

/**
 * Context returned when a request is authenticated via either a user session
 * or a bearer API key.
 */
export type ApiAuthContext =
  | { type: "session"; userId: string }
  | { type: "apiKey"; organizationId: string };

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
 * Accepts either a session cookie OR an `X-API-Key` header.
 * Returns ApiAuthContext so the caller can branch on `.type`.
 *
 * Throws ApiError(401) if neither credential is valid.
 */
export async function requireSessionOrApiKeyAuth(
  request: Request,
): Promise<ApiAuthContext> {
  const apiKeyHeader = request.headers.get("x-api-key");

  if (apiKeyHeader) {
    const result = await validateApiKey(apiKeyHeader);
    if (!result) {
      throw new ApiError("Invalid or expired API key.", 401);
    }
    return { type: "apiKey", organizationId: result.organizationId };
  }

  const session = await getServerSession();
  if (!session?.user) {
    throw new ApiError("Unauthorized.", 401);
  }
  return { type: "session", userId: session.user.id };
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
