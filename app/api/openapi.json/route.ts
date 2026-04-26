import { NextResponse } from "next/server";

/**
 * OpenAPI 3.1 specification for the public `/api/v1` surface.
 *
 * Hand-written rather than generated. The v1 surface is small (4 list
 * endpoints right now) and the value of a maintained spec - clients can
 * generate SDKs, Insomnia/Postman can import it, the api-docs page can
 * render it - outweighs the cost of a separate generator pipeline.
 *
 * Keep this in sync when adding/removing v1 routes. The CI bundle-size
 * gate doesn't catch drift here; reviewer-eyes do.
 */

const BASE_SCHEMAS = {
  Client: {
    type: "object",
    properties: {
      id: { type: "string" },
      name: { type: "string" },
      company: { type: "string", nullable: true },
      contactName: { type: "string", nullable: true },
      contactEmail: { type: "string", nullable: true },
      contactPhone: { type: "string", nullable: true },
      status: { type: "string" },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
    required: ["id", "name", "status", "createdAt", "updatedAt"],
  },
  Project: {
    type: "object",
    properties: {
      id: { type: "string" },
      clientId: { type: "string" },
      name: { type: "string" },
      description: { type: "string", nullable: true },
      status: { type: "string" },
      priority: { type: "string", nullable: true },
      startDate: { type: "string", format: "date-time", nullable: true },
      dueDate: { type: "string", format: "date-time", nullable: true },
      completedAt: { type: "string", format: "date-time", nullable: true },
      budgetType: { type: "string", nullable: true },
      budgetCents: { type: "integer", nullable: true },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
    required: ["id", "clientId", "name", "status", "createdAt", "updatedAt"],
  },
  Task: {
    type: "object",
    properties: {
      id: { type: "string" },
      projectId: { type: "string" },
      title: { type: "string" },
      description: { type: "string", nullable: true },
      status: { type: "string" },
      priority: { type: "string", nullable: true },
      assigneeUserId: { type: "string", nullable: true },
      dueDate: { type: "string", format: "date-time", nullable: true },
      completedAt: { type: "string", format: "date-time", nullable: true },
      estimateMinutes: { type: "integer", nullable: true },
      actualMinutes: { type: "integer", nullable: true },
      refNumber: { type: "string", nullable: true },
      tags: { type: "array", items: { type: "string" } },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
    required: ["id", "projectId", "title", "status", "tags", "createdAt", "updatedAt"],
  },
  Invoice: {
    type: "object",
    properties: {
      id: { type: "string" },
      clientId: { type: "string", nullable: true },
      number: { type: "string", nullable: true },
      title: { type: "string", nullable: true },
      status: { type: "string" },
      amountDueCents: { type: "integer", nullable: true },
      amountPaidCents: { type: "integer", nullable: true },
      amountRefundedCents: { type: "integer" },
      currencyCode: { type: "string", nullable: true },
      dueAt: { type: "string", format: "date-time", nullable: true },
      paidAt: { type: "string", format: "date-time", nullable: true },
      refundedAt: { type: "string", format: "date-time", nullable: true },
      invoiceUrl: { type: "string", nullable: true },
      sentAt: { type: "string", format: "date-time", nullable: true },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
    required: ["id", "status", "amountRefundedCents", "createdAt", "updatedAt"],
  },
  Error: {
    type: "object",
    properties: { error: { type: "string" } },
    required: ["error"],
  },
  CreateClientInput: {
    type: "object",
    properties: {
      name: { type: "string", maxLength: 255 },
      company: { type: "string", maxLength: 255, nullable: true },
      contactName: { type: "string", maxLength: 255, nullable: true },
      contactEmail: { type: "string", format: "email", nullable: true },
      contactPhone: { type: "string", maxLength: 64, nullable: true },
      status: { type: "string", enum: ["active", "inactive", "archived"] },
      notes: { type: "string", nullable: true },
    },
    required: ["name"],
  },
  CreateProjectInput: {
    type: "object",
    properties: {
      name: { type: "string", maxLength: 255 },
      clientId: { type: "string" },
      description: { type: "string", nullable: true },
      status: { type: "string" },
      priority: { type: "string", nullable: true },
      startDate: { type: "string", format: "date-time", nullable: true },
      dueDate: { type: "string", format: "date-time", nullable: true },
      budgetType: { type: "string", nullable: true },
      budgetCents: { type: "integer", minimum: 0, nullable: true },
    },
    required: ["name", "clientId"],
  },
  CreateTaskInput: {
    type: "object",
    properties: {
      title: { type: "string", maxLength: 500 },
      projectId: { type: "string" },
      description: { type: "string", nullable: true },
      status: { type: "string" },
      priority: { type: "string", nullable: true },
      assigneeUserId: { type: "string", nullable: true },
      dueDate: { type: "string", format: "date-time", nullable: true },
      estimateMinutes: { type: "integer", minimum: 0, nullable: true },
      tags: { type: "array", items: { type: "string" } },
    },
    required: ["title", "projectId"],
  },
};

function listResponse(itemRef: string) {
  return {
    type: "object",
    properties: {
      data: { type: "array", items: { $ref: `#/components/schemas/${itemRef}` } },
      limit: { type: "integer" },
      offset: { type: "integer" },
    },
    required: ["data", "limit", "offset"],
  };
}

const PAGINATION_PARAMS = [
  {
    name: "limit",
    in: "query",
    schema: { type: "integer", minimum: 1, maximum: 200, default: 50 },
  },
  {
    name: "offset",
    in: "query",
    schema: { type: "integer", minimum: 0, default: 0 },
  },
];

function listOperation(opts: {
  summary: string;
  itemRef: string;
  extraParams?: Array<Record<string, unknown>>;
}) {
  return {
    summary: opts.summary,
    parameters: [...PAGINATION_PARAMS, ...(opts.extraParams ?? [])],
    responses: {
      "200": {
        description: "OK",
        content: {
          "application/json": { schema: listResponse(opts.itemRef) },
        },
      },
      "401": {
        description: "Missing or invalid API key.",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" },
          },
        },
      },
      "429": {
        description: "Rate limit exceeded for this API key.",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" },
          },
        },
      },
    },
  };
}

const IDEMPOTENCY_HEADER_PARAM = {
  name: "Idempotency-Key",
  in: "header",
  required: false,
  description:
    "Client-supplied unique key (max 200 chars). Reusing the same key with the same body returns the cached response; reusing with a different body returns 409. Cached for 24 hours.",
  schema: { type: "string", maxLength: 200 },
};

function createOperation(opts: {
  summary: string;
  requestSchemaRef: string;
  responseProperty: string; // e.g. "clientId" / "projectId" / "taskId"
}) {
  return {
    summary: opts.summary,
    parameters: [IDEMPOTENCY_HEADER_PARAM],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: { $ref: `#/components/schemas/${opts.requestSchemaRef}` },
        },
      },
    },
    responses: {
      "201": {
        description: "Created",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: { [opts.responseProperty]: { type: "string" } },
              required: [opts.responseProperty],
            },
          },
        },
      },
      "401": {
        description: "Missing or invalid API key.",
        content: {
          "application/json": { schema: { $ref: "#/components/schemas/Error" } },
        },
      },
      "404": {
        description: "Referenced parent entity not found.",
        content: {
          "application/json": { schema: { $ref: "#/components/schemas/Error" } },
        },
      },
      "409": {
        description: "Idempotency-Key conflict (different body, or in-flight).",
        content: {
          "application/json": { schema: { $ref: "#/components/schemas/Error" } },
        },
      },
      "422": {
        description: "Request body failed validation.",
        content: {
          "application/json": { schema: { $ref: "#/components/schemas/Error" } },
        },
      },
      "429": {
        description: "Rate limit exceeded for this API key.",
        content: {
          "application/json": { schema: { $ref: "#/components/schemas/Error" } },
        },
      },
    },
  };
}

export function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const spec = {
    openapi: "3.1.0",
    info: {
      title: "ClientFlow API",
      version: "1.0.0",
      description:
        "Public REST API for ClientFlow. All endpoints require an `X-API-Key` header issued from organization settings.",
    },
    servers: [{ url: `${baseUrl}/api/v1` }],
    components: {
      securitySchemes: {
        ApiKeyAuth: { type: "apiKey", in: "header", name: "X-API-Key" },
      },
      schemas: BASE_SCHEMAS,
    },
    security: [{ ApiKeyAuth: [] }],
    paths: {
      "/clients": {
        get: listOperation({
          summary: "List clients in the organization.",
          itemRef: "Client",
        }),
        post: createOperation({
          summary: "Create a client.",
          requestSchemaRef: "CreateClientInput",
          responseProperty: "clientId",
        }),
      },
      "/projects": {
        get: listOperation({
          summary: "List projects in the organization.",
          itemRef: "Project",
        }),
        post: createOperation({
          summary: "Create a project.",
          requestSchemaRef: "CreateProjectInput",
          responseProperty: "projectId",
        }),
      },
      "/tasks": {
        get: listOperation({
          summary: "List tasks in the organization.",
          itemRef: "Task",
          extraParams: [
            { name: "projectId", in: "query", schema: { type: "string" } },
            { name: "status", in: "query", schema: { type: "string" } },
          ],
        }),
        post: createOperation({
          summary: "Create a task.",
          requestSchemaRef: "CreateTaskInput",
          responseProperty: "taskId",
        }),
      },
      "/invoices": {
        get: listOperation({
          summary: "List invoices in the organization.",
          itemRef: "Invoice",
          extraParams: [{ name: "status", in: "query", schema: { type: "string" } }],
        }),
      },
    },
  };

  return NextResponse.json(spec);
}
