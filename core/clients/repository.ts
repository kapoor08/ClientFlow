import { http } from "@/core/infrastructure";
import type {
  ClientListResponse,
  ClientMutationResponse,
  CreateClientData,
  ListClientsParams,
  UpdateClientData,
} from "./entity";

export async function listClients(
  params: ListClientsParams = {},
): Promise<ClientListResponse> {
  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  if (params.page && params.page > 1) query.set("page", String(params.page));
  if (params.sort) query.set("sort", params.sort);
  if (params.order) query.set("order", params.order);
  const qs = query.toString();
  return http<ClientListResponse>(`/api/clients${qs ? `?${qs}` : ""}`);
}

export async function createClient(
  data: CreateClientData,
): Promise<ClientMutationResponse> {
  return http<ClientMutationResponse>("/api/clients", {
    method: "POST",
    body: data,
  });
}

export async function updateClient(
  clientId: string,
  data: UpdateClientData,
): Promise<ClientMutationResponse> {
  return http<ClientMutationResponse>(`/api/clients/${clientId}`, {
    method: "PATCH",
    body: data,
  });
}

export async function deleteClient(clientId: string): Promise<void> {
  return http<void>(`/api/clients/${clientId}`, { method: "DELETE" });
}
