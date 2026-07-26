"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
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
import { ApiKeysTable } from "@/components/settings/api-keys/ApiKeysTable";
import { CreateApiKeyDialog } from "@/components/settings/api-keys/CreateApiKeyDialog";
import { RevealedKeyDialog } from "@/components/settings/api-keys/RevealedKeyDialog";
import type { ApiKeyItem } from "@/components/settings/api-keys/types";

export default function ApiKeysPage() {
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyExpiry, setNewKeyExpiry] = useState("never");
  const [revealedKey, setRevealedKey] = useState<{ key: string; name: string } | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<ApiKeyItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ApiKeyItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useQuery<{ keys: ApiKeyItem[] }>({
    queryKey: ["api-keys"],
    queryFn: () => fetch("/api/api-keys").then((r) => r.json()),
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const expiresInDays =
        newKeyExpiry === "30"
          ? 30
          : newKeyExpiry === "90"
            ? 90
            : newKeyExpiry === "365"
              ? 365
              : undefined;
      const res = await fetch("/api/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName, expiresInDays }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error((d as { error?: string }).error ?? "Failed to create key.");
      }
      return res.json() as Promise<{ id: string; key: string; prefix: string }>;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["api-keys"] });
      setCreateOpen(false);
      setRevealedKey({ key: data.key, name: newKeyName });
      setNewKeyName("");
      setNewKeyExpiry("never");
      toast.success("API key created.");
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : "Failed to create API key.";
      setError(message);
      toast.error(message);
    },
  });

  const revokeMutation = useMutation({
    mutationFn: (keyId: string) =>
      fetch(`/api/api-keys/${keyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "revoke" }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["api-keys"] });
      setRevokeTarget(null);
      toast.success("API key revoked.");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to revoke API key."),
  });

  const deleteMutation = useMutation({
    mutationFn: (keyId: string) => fetch(`/api/api-keys/${keyId}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["api-keys"] });
      setDeleteTarget(null);
      toast.success("API key deleted.");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to delete API key."),
  });

  const keys = data?.keys ?? [];

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-foreground text-2xl font-semibold">API Keys</h1>
          <p className="text-muted-foreground text-sm">
            Generate keys to authenticate requests to the ClientFlow API.
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
          <Plus size={14} /> New Key
        </Button>
      </div>

      {error && (
        <div className="rounded-card border-danger/20 bg-danger/5 text-danger mb-4 border px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <ApiKeysTable
        keys={keys}
        isLoading={isLoading}
        onRevoke={setRevokeTarget}
        onDelete={setDeleteTarget}
      />

      <p className="text-muted-foreground mt-4 text-xs">
        API keys grant full access to your organization&apos;s data. Keep them secret and rotate
        them regularly.
      </p>

      <CreateApiKeyDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        name={newKeyName}
        onNameChange={setNewKeyName}
        expiry={newKeyExpiry}
        onExpiryChange={setNewKeyExpiry}
        onSubmit={() => createMutation.mutate()}
        isPending={createMutation.isPending}
      />

      <RevealedKeyDialog revealedKey={revealedKey} onClose={() => setRevealedKey(null)} />

      {/* Revoke confirm */}
      <AlertDialog
        open={!!revokeTarget}
        onOpenChange={(v) => {
          if (!v) setRevokeTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke API key?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{revokeTarget?.name}</strong> will stop working immediately. This cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-warning text-warning-foreground hover:bg-warning/90 cursor-pointer"
              onClick={() => revokeTarget && revokeMutation.mutate(revokeTarget.id)}
            >
              Revoke
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirm */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(v) => {
          if (!v) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete API key?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{deleteTarget?.name}</strong> will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-danger hover:bg-danger/90 cursor-pointer text-white"
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
