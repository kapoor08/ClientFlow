import { and, desc, eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { clientNotes } from "@/db/schema";
import { ClientNote } from "./client-notes";
import { writeAuditLog } from "@/server/security/audit";
export {
  CLIENT_NOTE_TYPES,
  type ClientNoteTypeValue,
  type ClientNote,
} from "@/schemas/client-notes";

function createId() {
  return crypto.randomUUID();
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getClientNotes(
  clientId: string,
  organizationId: string,
): Promise<ClientNote[]> {
  return db
    .select()
    .from(clientNotes)
    .where(
      and(
        eq(clientNotes.clientId, clientId),
        eq(clientNotes.organizationId, organizationId),
      ),
    )
    .orderBy(desc(clientNotes.createdAt));
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export async function createClientNote(params: {
  clientId: string;
  organizationId: string;
  type: string;
  content: string;
  createdByUserId: string;
}): Promise<ClientNote> {
  const id = createId();
  const [note] = await db
    .insert(clientNotes)
    .values({ id, ...params })
    .returning();

  writeAuditLog({
    organizationId: params.organizationId,
    actorUserId: params.createdByUserId,
    action: "client_note.created",
    entityType: "client_note",
    entityId: id,
    metadata: { clientId: params.clientId, type: params.type },
  }).catch(console.error);

  return note;
}

export async function updateClientNote(params: {
  noteId: string;
  organizationId: string;
  type: string;
  content: string;
  actorUserId: string;
}): Promise<ClientNote> {
  const [note] = await db
    .update(clientNotes)
    .set({ type: params.type, content: params.content })
    .where(
      and(
        eq(clientNotes.id, params.noteId),
        eq(clientNotes.organizationId, params.organizationId),
      ),
    )
    .returning();

  writeAuditLog({
    organizationId: params.organizationId,
    actorUserId: params.actorUserId,
    action: "client_note.updated",
    entityType: "client_note",
    entityId: params.noteId,
    metadata: { type: params.type },
  }).catch(console.error);

  return note;
}

export async function deleteClientNote(params: {
  noteId: string;
  organizationId: string;
  actorUserId: string;
}): Promise<void> {
  await db
    .delete(clientNotes)
    .where(
      and(
        eq(clientNotes.id, params.noteId),
        eq(clientNotes.organizationId, params.organizationId),
      ),
    );

  writeAuditLog({
    organizationId: params.organizationId,
    actorUserId: params.actorUserId,
    action: "client_note.deleted",
    entityType: "client_note",
    entityId: params.noteId,
  }).catch(console.error);
}
