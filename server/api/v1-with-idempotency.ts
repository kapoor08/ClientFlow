import "server-only";

import { NextResponse } from "next/server";
import { lookupIdempotencyKey, recordIdempotentResponse } from "@/server/api/idempotency";
import { ApiError } from "@/server/api/helpers";

const MAX_KEY_LENGTH = 200;

/**
 * Wraps a v1 mutating handler with Idempotency-Key support. Reads the header,
 * looks up the cached response if present, otherwise runs the handler and
 * records its response so the next request with the same key short-circuits.
 *
 * Sends `Idempotency-Replayed: true` on cached responses so clients can tell
 * a replay from a fresh execution.
 *
 * Use:
 *   return withIdempotency(request, organizationId, async () => {
 *     const result = await createClientV1(...);
 *     return { status: 201, body: result };
 *   });
 */
export async function withIdempotency<T>(
  request: Request,
  organizationId: string,
  rawBody: string,
  handler: () => Promise<{ status: number; body: T }>,
): Promise<NextResponse> {
  const key = request.headers.get("idempotency-key");

  if (!key) {
    // No key supplied - run the handler unprotected. Mutating without an
    // idempotency key is allowed but the client takes the risk of duplicate
    // creates on retry.
    const { status, body } = await handler();
    return NextResponse.json(body, { status });
  }

  if (key.length > MAX_KEY_LENGTH) {
    throw new ApiError(`Idempotency-Key must be ${MAX_KEY_LENGTH} characters or fewer.`, 400);
  }

  const cached = await lookupIdempotencyKey<T>(organizationId, key, rawBody);
  if (cached.kind === "cached") {
    return NextResponse.json(cached.body, {
      status: cached.status,
      headers: { "idempotency-replayed": "true" },
    });
  }

  const { status, body } = await handler();
  await recordIdempotentResponse(organizationId, key, rawBody, status, body);
  return NextResponse.json(body, { status });
}
