"use client";

import { useState, useTransition } from "react";
import { Edit2, Plus, StickyNote, Trash2, X, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CLIENT_NOTE_TYPES, type ClientNote } from "@/lib/client-notes-shared";
import {
  addClientNoteAction,
  editClientNoteAction,
  removeClientNoteAction,
} from "@/app/(protected)/clients/[id]/notes-actions";

// ─── Type badge ───────────────────────────────────────────────────────────────

const TYPE_STYLES: Record<string, string> = {
  general: "bg-secondary text-muted-foreground",
  meeting: "bg-info/10 text-info",
  follow_up: "bg-warning/10 text-warning",
  internal: "bg-primary/10 text-primary",
  requirement: "bg-success/10 text-success",
};

function TypeBadge({ type }: { type: string }) {
  const label = CLIENT_NOTE_TYPES.find((t) => t.value === type)?.label ?? type;
  return (
    <span
      className={`inline-flex items-center rounded-pill px-2 py-0.5 text-[11px] font-medium capitalize ${TYPE_STYLES[type] ?? TYPE_STYLES.general}`}
    >
      {label}
    </span>
  );
}

// ─── Note form (add / edit inline) ───────────────────────────────────────────

function NoteForm({
  defaultType = "general",
  defaultContent = "",
  submitLabel,
  onSubmit,
  onCancel,
  isPending,
}: {
  defaultType?: string;
  defaultContent?: string;
  submitLabel: string;
  onSubmit: (type: string, content: string) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [type, setType] = useState(defaultType);
  const [content, setContent] = useState(defaultContent);

  return (
    <div className="space-y-3 rounded-xl border border-border bg-secondary/30 p-4">
      <div className="flex items-center gap-3">
        <span className="text-xs font-medium text-muted-foreground">Type</span>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="h-7 w-36 text-xs cursor-pointer">
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper" side="bottom" sideOffset={4}>
            {CLIENT_NOTE_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value} className="text-xs">
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write your note here…"
        rows={3}
        className="resize-none text-sm"
        disabled={isPending}
      />

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          disabled={isPending || !content.trim()}
          onClick={() => onSubmit(type, content)}
          className="cursor-pointer"
        >
          <Check size={13} className="mr-1" />
          {isPending ? "Saving…" : submitLabel}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onCancel}
          disabled={isPending}
          className="cursor-pointer"
        >
          <X size={13} className="mr-1" />
          Cancel
        </Button>
      </div>
    </div>
  );
}

// ─── Note row ─────────────────────────────────────────────────────────────────

function NoteRow({
  note,
  clientId,
  canWrite,
}: {
  note: ClientNote;
  clientId: string;
  canWrite: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleEdit(type: string, content: string) {
    startTransition(async () => {
      try {
        await editClientNoteAction(note.id, clientId, type, content);
        setEditing(false);
        toast.success("Note updated.");
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to update note.",
        );
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      try {
        await removeClientNoteAction(note.id, clientId);
        toast.success("Note deleted.");
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to delete note.",
        );
      }
    });
  }

  if (editing) {
    return (
      <NoteForm
        defaultType={note.type}
        defaultContent={note.content}
        submitLabel="Save"
        onSubmit={handleEdit}
        onCancel={() => setEditing(false)}
        isPending={isPending}
      />
    );
  }

  return (
    <div className="group rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/15">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <TypeBadge type={note.type} />
          <span className="text-[11px] text-muted-foreground">
            {new Date(note.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>
        {canWrite && (
          <TooltipProvider delayDuration={300}>
            <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground cursor-pointer"
                    aria-label="Edit note"
                  >
                    <Edit2 size={12} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">Edit note</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isPending}
                    className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-danger/10 hover:text-danger cursor-pointer"
                    aria-label="Delete note"
                  >
                    <Trash2 size={12} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">Delete note</TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        )}
      </div>
      <p className="mt-2.5 whitespace-pre-wrap text-sm text-foreground">
        {note.content}
      </p>
    </div>
  );
}

// ─── ClientNotesSection ───────────────────────────────────────────────────────

type ClientNotesSectionProps = {
  clientId: string;
  initialNotes: ClientNote[];
  canWrite: boolean;
};

export function ClientNotesSection({
  clientId,
  initialNotes,
  canWrite,
}: ClientNotesSectionProps) {
  const [adding, setAdding] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleAdd(type: string, content: string) {
    startTransition(async () => {
      try {
        await addClientNoteAction(clientId, type, content);
        setAdding(false);
        toast.success("Note added.");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to add note.");
      }
    });
  }

  return (
    <div className="mb-8 rounded-card border border-border bg-card p-6 shadow-cf-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StickyNote size={16} className="text-muted-foreground" />
          <h2 className="font-display text-lg font-semibold text-foreground">
            Notes
          </h2>
          {initialNotes.length > 0 && (
            <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {initialNotes.length}
            </span>
          )}
        </div>
        {canWrite && !adding && (
          <Button
            size="sm"
            variant="outline"
            className="cursor-pointer"
            onClick={() => setAdding(true)}
          >
            <Plus size={13} className="mr-1" />
            Add Note
          </Button>
        )}
      </div>

      <div className="mt-4 space-y-3">
        {adding && (
          <NoteForm
            submitLabel="Add Note"
            onSubmit={handleAdd}
            onCancel={() => setAdding(false)}
            isPending={isPending}
          />
        )}

        {initialNotes.length === 0 && !adding ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No notes yet.{" "}
            {canWrite && (
              <button
                type="button"
                onClick={() => setAdding(true)}
                className="text-primary underline-offset-2 hover:underline"
              >
                Add the first note.
              </button>
            )}
          </p>
        ) : (
          initialNotes.map((note) => (
            <NoteRow
              key={note.id}
              note={note}
              clientId={clientId}
              canWrite={canWrite}
            />
          ))
        )}
      </div>
    </div>
  );
}
