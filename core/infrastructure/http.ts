/**
 * Thin fetch wrapper used by all client-side repository functions.
 * Throws HttpError on non-2xx responses so TanStack Query catches it
 * and surfaces it through mutation/query error states.
 */

export class HttpError extends Error {
  constructor(
    public override message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

type HttpOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
};

export async function http<TResponse>(
  url: string,
  options: HttpOptions = {},
): Promise<TResponse> {
  const { method = "GET", body, headers = {} } = options;

  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json", ...headers },
    body: body != null ? JSON.stringify(body) : undefined,
  });

  // 204 No Content — return undefined without trying to parse JSON
  if (response.status === 204) {
    return undefined as TResponse;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new HttpError(
      data.error ?? "An unexpected error occurred.",
      response.status,
    );
  }

  return data as TResponse;
}
