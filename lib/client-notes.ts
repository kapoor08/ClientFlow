import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { clientNotes } from "@/db/schema";
import { ClientNote } from "./client-notes";
export {
  CLIENT_NOTE_TYPES,
  type ClientNoteTypeValue,
  type ClientNote,
} from "@/lib/client-notes-shared";

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
  return note;
}

export async function updateClientNote(params: {
  noteId: string;
  organizationId: string;
  type: string;
  content: string;
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
  return note;
}

export async function deleteClientNote(params: {
  noteId: string;
  organizationId: string;
}): Promise<void> {
  await db
    .delete(clientNotes)
    .where(
      and(
        eq(clientNotes.id, params.noteId),
        eq(clientNotes.organizationId, params.organizationId),
      ),
    );
}
