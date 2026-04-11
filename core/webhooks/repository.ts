import { http } from "@/core/infrastructure";
import type {
  CreateWebhookInput,
  UpdateWebhookInput,
  WebhookItem,
  WebhookListResponse,
} from "./entity";

export async function listWebhooks(): Promise<WebhookListResponse> {
  return http<WebhookListResponse>("/api/webhooks");
}

export async function createWebhook(
  data: CreateWebhookInput,
): Promise<{ webhook: WebhookItem }> {
  return http<{ webhook: WebhookItem }>("/api/webhooks", {
    method: "POST",
    body: data,
  });
}

export async function updateWebhook(
  id: string,
  data: UpdateWebhookInput,
): Promise<void> {
  return http<void>(`/api/webhooks/${id}`, {
    method: "PATCH",
    body: data,
  });
}

export async function deleteWebhook(id: string): Promise<void> {
  return http<void>(`/api/webhooks/${id}`, { method: "DELETE" });
}
