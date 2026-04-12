"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "@/server/auth/session";
import { getClientModuleAccessForUser } from "@/server/clients";
import {
  createClientNote,
  updateClientNote,
  deleteClientNote,
} from "@/server/client-notes";

async function getAccess(clientId: string) {
  const session = await getServerSession();
  if (!session) throw new Error("Unauthorized");
  const access = await getClientModuleAccessForUser(session.user.id);
  if (!access?.canWrite) throw new Error("Forbidden");
  return { userId: session.user.id, organizationId: access.organizationId, clientId };
}

export async function addClientNoteAction(
  clientId: string,
  type: string,
  content: string,
) {
  const { userId, organizationId } = await getAccess(clientId);
  const trimmed = content.trim();
  if (!trimmed) throw new Error("Note content is required.");
  await createClientNote({ clientId, organizationId, type, content: trimmed, createdByUserId: userId });
  revalidatePath(`/clients/${clientId}`);
}

export async function editClientNoteAction(
  noteId: string,
  clientId: string,
  type: string,
  content: string,
) {
  const { organizationId } = await getAccess(clientId);
  const trimmed = content.trim();
  if (!trimmed) throw new Error("Note content is required.");
  await updateClientNote({ noteId, organizationId, type, content: trimmed });
  revalidatePath(`/clients/${clientId}`);
}

export async function removeClientNoteAction(
  noteId: string,
  clientId: string,
) {
  const { organizationId } = await getAccess(clientId);
  await deleteClientNote({ noteId, organizationId });
  revalidatePath(`/clients/${clientId}`);
}
