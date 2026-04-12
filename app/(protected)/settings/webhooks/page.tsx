"use client";

import { useState } from "react";
import { Plus, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { WebhookCard, CreateWebhookDialog } from "@/components/settings";
import { EmptyState } from "@/components/shared";
import type { WebhookItem } from "@/core/webhooks/entity";
import {
  useWebhooks,
  useCreateWebhook,
  useUpdateWebhook,
  useDeleteWebhook,
} from "@/core/webhooks/useCase";

export default function WebhooksPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<WebhookItem | null>(null);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useWebhooks();
  const createMutation = useCreateWebhook();
  const toggleMutation = useUpdateWebhook();
  const deleteMutation = useDeleteWebhook();

  function handleCreate() {
    createMutation.mutate(
      { name, url, events: selectedEvents },
      {
        onSuccess: () => {
          setCreateOpen(false);
          setName("");
          setUrl("");
          setSelectedEvents([]);
          toast.success("Webhook created.");
        },
        onError: (err) => {
          setError(err.message);
          toast.error(err.message);
        },
      },
    );
  }

  function handleToggle(id: string, isActive: boolean) {
    toggleMutation.mutate(
      { id, data: { isActive } },
      {
        onSuccess: () => {
          toast.success(`Webhook ${isActive ? "activated" : "deactivated"}.`);
        },
        onError: (err) => toast.error(err.message),
      },
    );
  }

  function handleDelete(id: string) {
    deleteMutation.mutate(id, {
      onSuccess: () => {
        setDeleteTarget(null);
        toast.success("Webhook deleted.");
      },
      onError: (err) => toast.error(err.message),
    });
  }

  const webhooks = data?.webhooks ?? [];

  function toggleEvent(event: string) {
    setSelectedEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event],
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">
            Webhooks
          </h1>
          <p className="text-sm text-muted-foreground">
            Send real-time event notifications to your endpoints.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setError(null);
            setCreateOpen(true);
          }}
          className="cursor-pointer"
        >
          <Plus size={14} /> Add Webhook
        </Button>
      </div>

      {error && (
        <div className="mb-4 rounded-card border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="rounded-card border border-border bg-card p-5 shadow-cf-1"
            >
              <div className="h-3 w-48 animate-pulse rounded bg-secondary" />
            </div>
          ))
        ) : webhooks.length === 0 ? (
          <EmptyState
            icon={Zap}
            title="No webhooks yet"
            description="Add a webhook to receive event notifications."
          />
        ) : (
          webhooks.map((w) => (
            <WebhookCard
              key={w.id}
              webhook={w}
              onToggle={handleToggle}
              onDelete={setDeleteTarget}
            />
          ))
        )}
      </div>

      <CreateWebhookDialog
        open={createOpen}
        name={name}
        url={url}
        selectedEvents={selectedEvents}
        isPending={createMutation.isPending}
        onNameChange={setName}
        onUrlChange={setUrl}
        onToggleEvent={toggleEvent}
        onSubmit={handleCreate}
        onClose={() => setCreateOpen(false)}
      />

      {/* Delete confirm */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(v) => {
          if (!v) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete webhook?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{deleteTarget?.name}</strong> will be permanently deleted
              and stop receiving events.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-danger text-white hover:bg-danger/90 cursor-pointer"
              onClick={() => deleteTarget && handleDelete(deleteTarget.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
