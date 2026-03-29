export type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

export type ApiParam = {
  name: string;
  type: string;
  required?: boolean;
  description: string;
};

export type ApiEndpoint = {
  method: HttpMethod;
  path: string;
  summary: string;
  description?: string;
  params?: ApiParam[];
  body?: ApiParam[];
  responseExample?: string;
};

export type ApiSection = {
  id: string;
  title: string;
  description: string;
  endpoints: ApiEndpoint[];
};

// ─── API Sections Data ────────────────────────────────────────────────────────

export const API_SECTIONS: ApiSection[] = [
  {
    id: "authentication",
    title: "Authentication",
    description:
      "All API requests must include a valid API key in the Authorization header as a Bearer token. Keys can be created and managed in the Developer settings.",
    endpoints: [
      {
        method: "GET",
        path: "/api/api-keys",
        summary: "List API keys",
        description: "Returns all API keys for the authenticated user's organization.",
        responseExample: `{\n  "keys": [\n    {\n      "id": "key_01j...",\n      "name": "Production Key",\n      "prefix": "cf_abc",\n      "createdAt": "2025-01-01T00:00:00.000Z",\n      "lastUsedAt": "2025-06-01T12:00:00.000Z",\n      "expiresAt": null,\n      "revokedAt": null\n    }\n  ]\n}`,
      },
      {
        method: "POST",
        path: "/api/api-keys",
        summary: "Create API key",
        description: "Creates a new API key. The full key is only returned once at creation.",
        body: [
          { name: "name", type: "string", required: true, description: "Human-readable label for the key." },
          { name: "expiresAt", type: "string (ISO 8601)", required: false, description: "Optional expiry date for the key." },
        ],
        responseExample: `{\n  "key": "cf_live_xxxxxxxxxxxxxxxxxxxx",\n  "id": "key_01j..."\n}`,
      },
      {
        method: "PATCH",
        path: "/api/api-keys/{keyId}",
        summary: "Revoke API key",
        description: "Revokes an API key, preventing it from being used for further requests.",
        body: [
          { name: "action", type: '"revoke"', required: true, description: 'Must be "revoke".' },
        ],
        responseExample: `{ "ok": true }`,
      },
      {
        method: "DELETE",
        path: "/api/api-keys/{keyId}",
        summary: "Delete API key",
        description: "Permanently deletes an API key record.",
        responseExample: `{ "ok": true }`,
      },
    ],
  },
  {
    id: "clients",
    title: "Clients",
    description: "Manage clients (companies or individuals) within your organization.",
    endpoints: [
      {
        method: "GET",
        path: "/api/clients",
        summary: "List clients",
        description: "Returns a paginated list of clients for the authenticated organization.",
        params: [
          { name: "q", type: "string", required: false, description: "Search query to filter clients by name or email." },
          { name: "page", type: "number", required: false, description: "Page number (default: 1)." },
          { name: "pageSize", type: "number", required: false, description: "Results per page (default: 20)." },
        ],
        responseExample: `{\n  "clients": [...],\n  "total": 42,\n  "page": 1,\n  "pageSize": 20\n}`,
      },
      {
        method: "POST",
        path: "/api/clients",
        summary: "Create client",
        description: "Creates a new client record in the organization.",
        body: [
          { name: "name", type: "string", required: true, description: "Client's full name or company name." },
          { name: "email", type: "string", required: false, description: "Primary contact email." },
          { name: "phone", type: "string", required: false, description: "Contact phone number." },
          { name: "company", type: "string", required: false, description: "Company name (if different from name)." },
          { name: "notes", type: "string", required: false, description: "Internal notes about the client." },
        ],
        responseExample: `{\n  "client": {\n    "id": "cli_01j...",\n    "name": "Acme Corp",\n    "email": "contact@acme.com"\n  }\n}`,
      },
      {
        method: "GET",
        path: "/api/clients/{id}",
        summary: "Get client",
        description: "Retrieves detailed information about a specific client.",
        responseExample: `{\n  "id": "cli_01j...",\n  "name": "Acme Corp",\n  "email": "contact@acme.com",\n  "projects": [...]\n}`,
      },
      {
        method: "PATCH",
        path: "/api/clients/{id}",
        summary: "Update client",
        description: "Updates one or more fields on an existing client.",
        body: [
          { name: "name", type: "string", required: false, description: "Client's full name or company name." },
          { name: "email", type: "string", required: false, description: "Primary contact email." },
          { name: "phone", type: "string", required: false, description: "Contact phone number." },
          { name: "notes", type: "string", required: false, description: "Internal notes about the client." },
        ],
        responseExample: `{ "ok": true }`,
      },
      {
        method: "DELETE",
        path: "/api/clients/{id}",
        summary: "Delete client",
        description: "Permanently deletes a client and all associated data.",
        responseExample: `{ "ok": true }`,
      },
    ],
  },
  {
    id: "projects",
    title: "Projects",
    description: "Create and manage projects linked to clients within your organization.",
    endpoints: [
      {
        method: "GET",
        path: "/api/projects",
        summary: "List projects",
        description: "Returns a paginated, filterable list of projects.",
        params: [
          { name: "q", type: "string", required: false, description: "Search query." },
          { name: "page", type: "number", required: false, description: "Page number (default: 1)." },
          { name: "pageSize", type: "number", required: false, description: "Results per page (default: 20)." },
          { name: "sort", type: "string", required: false, description: "Sort field (e.g. createdAt, name)." },
          { name: "order", type: '"asc" | "desc"', required: false, description: "Sort direction (default: desc)." },
        ],
        responseExample: `{\n  "projects": [...],\n  "total": 15,\n  "page": 1,\n  "pageSize": 20\n}`,
      },
      {
        method: "POST",
        path: "/api/projects",
        summary: "Create project",
        description: "Creates a new project, optionally linked to a client.",
        body: [
          { name: "name", type: "string", required: true, description: "Project name." },
          { name: "clientId", type: "string", required: false, description: "ID of an existing client to associate." },
          { name: "status", type: "string", required: false, description: "Initial project status." },
          { name: "dueDate", type: "string (ISO 8601)", required: false, description: "Project deadline." },
          { name: "description", type: "string", required: false, description: "Project description." },
        ],
        responseExample: `{\n  "project": {\n    "id": "prj_01j...",\n    "name": "New Website"\n  }\n}`,
      },
      {
        method: "GET",
        path: "/api/projects/{id}",
        summary: "Get project",
        description: "Retrieves full details for a specific project including tasks.",
        responseExample: `{\n  "id": "prj_01j...",\n  "name": "New Website",\n  "tasks": [...]\n}`,
      },
      {
        method: "PATCH",
        path: "/api/projects/{id}",
        summary: "Update project",
        description: "Updates one or more fields on an existing project.",
        body: [
          { name: "name", type: "string", required: false, description: "Project name." },
          { name: "status", type: "string", required: false, description: "Project status." },
          { name: "dueDate", type: "string (ISO 8601)", required: false, description: "Project deadline." },
          { name: "description", type: "string", required: false, description: "Project description." },
        ],
        responseExample: `{ "ok": true }`,
      },
      {
        method: "DELETE",
        path: "/api/projects/{id}",
        summary: "Delete project",
        description: "Permanently deletes a project and all its tasks.",
        responseExample: `{ "ok": true }`,
      },
    ],
  },
  {
    id: "tasks",
    title: "Tasks",
    description: "Create, update, and manage tasks within projects.",
    endpoints: [
      {
        method: "GET",
        path: "/api/tasks",
        summary: "List tasks",
        description: "Returns a paginated list of tasks, with optional filters.",
        params: [
          { name: "q", type: "string", required: false, description: "Search query." },
          { name: "status", type: "string", required: false, description: "Filter by task status." },
          { name: "priority", type: "string", required: false, description: "Filter by priority level." },
          { name: "projectId", type: "string", required: false, description: "Filter tasks by project." },
          { name: "page", type: "number", required: false, description: "Page number (default: 1)." },
          { name: "pageSize", type: "number", required: false, description: "Results per page (default: 20)." },
        ],
        responseExample: `{\n  "tasks": [...],\n  "total": 100,\n  "page": 1,\n  "pageSize": 20\n}`,
      },
      {
        method: "POST",
        path: "/api/tasks",
        summary: "Create task",
        description: "Creates a new task, optionally assigned to a project.",
        body: [
          { name: "title", type: "string", required: true, description: "Task title." },
          { name: "projectId", type: "string", required: false, description: "ID of the project to associate." },
          { name: "status", type: "string", required: false, description: "Initial task status." },
          { name: "priority", type: "string", required: false, description: "Task priority." },
          { name: "dueDate", type: "string (ISO 8601)", required: false, description: "Task due date." },
          { name: "description", type: "string", required: false, description: "Task description." },
        ],
        responseExample: `{\n  "task": {\n    "id": "tsk_01j...",\n    "title": "Design mockup"\n  }\n}`,
      },
      {
        method: "GET",
        path: "/api/tasks/{id}",
        summary: "Get task",
        description: "Retrieves full details for a specific task.",
        responseExample: `{\n  "id": "tsk_01j...",\n  "title": "Design mockup",\n  "status": "in_progress"\n}`,
      },
      {
        method: "PATCH",
        path: "/api/tasks/{id}",
        summary: "Update task",
        description: "Updates one or more fields on an existing task.",
        body: [
          { name: "title", type: "string", required: false, description: "Task title." },
          { name: "status", type: "string", required: false, description: "Task status." },
          { name: "priority", type: "string", required: false, description: "Task priority." },
          { name: "dueDate", type: "string (ISO 8601)", required: false, description: "Task due date." },
          { name: "description", type: "string", required: false, description: "Task description." },
        ],
        responseExample: `{ "ok": true }`,
      },
      {
        method: "DELETE",
        path: "/api/tasks/{id}",
        summary: "Delete task",
        description: "Permanently deletes a task.",
        responseExample: `{ "ok": true }`,
      },
    ],
  },
  {
    id: "webhooks",
    title: "Webhooks",
    description: "Register and manage webhook endpoints to receive real-time event notifications.",
    endpoints: [
      {
        method: "GET",
        path: "/api/webhooks",
        summary: "List webhooks",
        description: "Returns all webhook subscriptions for the organization.",
        responseExample: `{\n  "webhooks": [\n    {\n      "id": "wh_01j...",\n      "name": "My Webhook",\n      "url": "https://example.com/hook",\n      "events": ["task.created"],\n      "isActive": true,\n      "createdAt": "2025-01-01T00:00:00.000Z"\n    }\n  ]\n}`,
      },
      {
        method: "POST",
        path: "/api/webhooks",
        summary: "Create webhook",
        description: "Registers a new webhook endpoint for one or more event types.",
        body: [
          { name: "name", type: "string", required: true, description: "Descriptive name for the webhook." },
          { name: "url", type: "string (URL)", required: true, description: "The HTTPS endpoint to send events to." },
          { name: "events", type: "string[]", required: true, description: "List of event types to subscribe to." },
          { name: "isActive", type: "boolean", required: false, description: "Whether the webhook is active (default: true)." },
        ],
        responseExample: `{\n  "webhook": {\n    "id": "wh_01j...",\n    "name": "My Webhook"\n  }\n}`,
      },
      {
        method: "PATCH",
        path: "/api/webhooks/{webhookId}",
        summary: "Update webhook",
        description: "Updates the configuration of an existing webhook.",
        body: [
          { name: "name", type: "string", required: false, description: "New name for the webhook." },
          { name: "url", type: "string (URL)", required: false, description: "New target URL." },
          { name: "events", type: "string[]", required: false, description: "Updated list of event types." },
          { name: "isActive", type: "boolean", required: false, description: "Enable or disable the webhook." },
        ],
        responseExample: `{ "ok": true }`,
      },
      {
        method: "DELETE",
        path: "/api/webhooks/{webhookId}",
        summary: "Delete webhook",
        description: "Permanently removes a webhook subscription.",
        responseExample: `{ "ok": true }`,
      },
    ],
  },
];
