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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { WebhookCard } from "./WebhookCard";
import type { WebhookItem } from "./WebhookCard";
import { CreateWebhookDialog } from "./CreateWebhookDialog";

export default function WebhooksPage() {
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<WebhookItem | null>(null);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useQuery<{ webhooks: WebhookItem[] }>({
    queryKey: ["webhooks"],
    queryFn: () => fetch("/api/webhooks").then((r) => r.json()),
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, url, events: selectedEvents }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error((d as { error?: string }).error ?? "Failed to create webhook.");
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["webhooks"] });
      setCreateOpen(false);
      setName("");
      setUrl("");
      setSelectedEvents([]);
      toast.success("Webhook created.");
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : "Failed to create webhook.";
      setError(message);
      toast.error(message);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      fetch(`/api/webhooks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      }),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["webhooks"] });
      toast.success(`Webhook ${variables.isActive ? "activated" : "deactivated"}.`);
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to update webhook."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/webhooks/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["webhooks"] });
      setDeleteTarget(null);
      toast.success("Webhook deleted.");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to delete webhook."),
  });

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
          <h1 className="font-display text-2xl font-semibold text-foreground">Webhooks</h1>
          <p className="text-sm text-muted-foreground">
            Send real-time event notifications to your endpoints.
          </p>
        </div>
        <Button size="sm" onClick={() => { setError(null); setCreateOpen(true); }}>
          <Plus size={14} className="mr-1.5" /> Add Webhook
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
            <div key={i} className="rounded-card border border-border bg-card p-5 shadow-cf-1">
              <div className="h-3 w-48 animate-pulse rounded bg-secondary" />
            </div>
          ))
        ) : webhooks.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-card border border-border bg-card py-16 text-center shadow-cf-1">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
              <Zap size={20} className="text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">No webhooks yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Add a webhook to receive event notifications.
              </p>
            </div>
          </div>
        ) : (
          webhooks.map((w) => (
            <WebhookCard
              key={w.id}
              webhook={w}
              onToggle={(id, isActive) => toggleMutation.mutate({ id, isActive })}
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
        onSubmit={() => createMutation.mutate()}
        onClose={() => setCreateOpen(false)}
      />

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => { if (!v) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete webhook?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{deleteTarget?.name}</strong> will be permanently deleted and stop receiving events.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-danger text-white hover:bg-danger/90"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
