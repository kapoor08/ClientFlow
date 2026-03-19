import type { ClientFormValues, ClientStatus } from "@/lib/clients-shared";
import type { PaginationMeta } from "@/lib/pagination";

export type { ClientFormValues, ClientStatus };

// ─── API Response Types ───────────────────────────────────────────────────────

export type ClientListItem = {
  id: string;
  name: string;
  company: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  status: ClientStatus;
  projectCount: number;
  createdAt: string;
  updatedAt: string;
};

export type ClientListResponse = {
  clients: ClientListItem[];
  pagination: PaginationMeta;
};

export type ClientMutationResponse = {
  clientId: string;
};

// ─── Request Types ────────────────────────────────────────────────────────────

export type ListClientsParams = {
  q?: string;
  page?: number;
  sort?: string;
  order?: "asc" | "desc";
};

export type CreateClientData = ClientFormValues;
export type UpdateClientData = ClientFormValues;
