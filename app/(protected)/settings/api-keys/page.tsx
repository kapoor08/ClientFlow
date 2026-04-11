"use client";

import { useState } from "react";
import {
  Key,
  Plus,
  Trash2,
  Ban,
  Copy,
  Check,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { formatDistanceToNow } from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type ApiKeyItem = {
  id: string;
  name: string;
  keyPrefix: string;
  createdAt: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  revokedAt: string | null;
  isActive: boolean;
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
      title="Copy"
    >
      {copied ? (
        <Check size={13} className="text-success" />
      ) : (
        <Copy size={13} />
      )}
    </button>
  );
}

export default function ApiKeysPage() {
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyExpiry, setNewKeyExpiry] = useState("never");
  const [revealedKey, setRevealedKey] = useState<{
    key: string;
    name: string;
  } | null>(null);
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
        throw new Error(
          (d as { error?: string }).error ?? "Failed to create key.",
        );
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
      const message =
        err instanceof Error ? err.message : "Failed to create API key.";
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
    onError: (err) =>
      toast.error(
        err instanceof Error ? err.message : "Failed to revoke API key.",
      ),
  });

  const deleteMutation = useMutation({
    mutationFn: (keyId: string) =>
      fetch(`/api/api-keys/${keyId}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["api-keys"] });
      setDeleteTarget(null);
      toast.success("API key deleted.");
    },
    onError: (err) =>
      toast.error(
        err instanceof Error ? err.message : "Failed to delete API key.",
      ),
  });

  const keys = data?.keys ?? [];

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">
            API Keys
          </h1>
          <p className="text-sm text-muted-foreground">
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
        <div className="mb-4 rounded-card border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {/* Key list */}
      <div className="overflow-hidden rounded-card border border-border bg-card shadow-cf-1">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                Prefix
              </th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold text-muted-foreground sm:table-cell">
                Status
              </th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold text-muted-foreground md:table-cell">
                Created
              </th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold text-muted-foreground lg:table-cell">
                Last used
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  <td colSpan={6} className="px-4 py-3">
                    <div className="h-3 w-full animate-pulse rounded bg-secondary" />
                  </td>
                </tr>
              ))
            ) : keys.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-12 text-center text-sm text-muted-foreground"
                >
                  No API keys yet. Create one to get started.
                </td>
              </tr>
            ) : (
              keys.map((k) => (
                <tr
                  key={k.id}
                  className="border-b border-border last:border-0 hover:bg-secondary/20 transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-foreground">
                    {k.name}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {k.keyPrefix}…
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    <span
                      className={`inline-flex rounded-pill px-2 py-0.5 text-xs font-medium ${k.isActive ? "bg-success/10 text-success" : "bg-danger/10 text-danger"}`}
                    >
                      {k.revokedAt
                        ? "Revoked"
                        : k.expiresAt && new Date(k.expiresAt) < new Date()
                          ? "Expired"
                          : "Active"}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 text-xs text-muted-foreground md:table-cell">
                    {formatDistanceToNow(new Date(k.createdAt), {
                      addSuffix: true,
                    })}
                  </td>
                  <td className="hidden px-4 py-3 text-xs text-muted-foreground lg:table-cell">
                    {k.lastUsedAt
                      ? formatDistanceToNow(new Date(k.lastUsedAt), {
                          addSuffix: true,
                        })
                      : "Never"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <TooltipProvider delayDuration={300}>
                      <div className="flex items-center justify-end gap-1">
                        {k.isActive && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-warning cursor-pointer"
                                onClick={() => setRevokeTarget(k)}
                              >
                                <Ban size={13} />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Revoke</TooltipContent>
                          </Tooltip>
                        )}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-danger cursor-pointer"
                              onClick={() => setDeleteTarget(k)}
                            >
                              <Trash2 size={13} />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Delete</TooltipContent>
                        </Tooltip>
                      </div>
                    </TooltipProvider>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Info note */}
      <p className="mt-4 text-xs text-muted-foreground">
        API keys grant full access to your organization&apos;s data. Keep them
        secret and rotate them regularly.
      </p>

      {/* Create key dialog */}
      <Dialog
        open={createOpen}
        onOpenChange={(v) => {
          if (!v) setCreateOpen(false);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create API Key</DialogTitle>
            <DialogDescription>
              Give this key a descriptive name so you know where it&apos;s used.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="key-name">Key name</Label>
              <Input
                id="key-name"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="e.g. My Integration"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="key-expiry">Expiry</Label>
              <Select value={newKeyExpiry} onValueChange={setNewKeyExpiry}>
                <SelectTrigger
                  className="w-full cursor-pointer"
                  id="key-expiry"
                >
                  <SelectValue placeholder="Select expiry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="never">No expiry</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                  <SelectItem value="365">1 year</SelectItem>
                </SelectContent>
              </Select>
              {newKeyExpiry === "never" && (
                <div className="flex items-start gap-2 rounded-md border border-warning/30 bg-warning/5 px-3 py-2">
                  <AlertTriangle
                    size={13}
                    className="mt-0.5 shrink-0 text-warning"
                  />
                  <p className="text-xs text-warning">
                    Keys with no expiry remain active indefinitely. Rotate them
                    regularly or set an expiry date for better security.
                  </p>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="cursor-pointer"
              onClick={() => setCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={!newKeyName.trim() || createMutation.isPending}
              className="cursor-pointer"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 size={14} className="mr-1.5 animate-spin" />{" "}
                  Creating…
                </>
              ) : (
                "Create Key"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revealed key dialog */}
      <Dialog
        open={!!revealedKey}
        onOpenChange={(v) => {
          if (!v) setRevealedKey(null);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Your new API key</DialogTitle>
            <DialogDescription>
              Copy this key now - it won&apos;t be shown again.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-card border border-warning/30 bg-warning/5 p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle
                size={14}
                className="mt-0.5 shrink-0 text-warning"
              />
              <p className="text-xs text-warning">
                Store this key somewhere safe. Once you close this dialog, it
                cannot be recovered.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary/50 px-3 py-2 font-mono text-xs">
            <span className="flex-1 break-all">{revealedKey?.key}</span>
            {revealedKey && <CopyButton text={revealedKey.key} />}
          </div>
          <DialogFooter>
            <Button onClick={() => setRevealedKey(null)} className="cursor-pointer">Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
              <strong>{revokeTarget?.name}</strong> will stop working
              immediately. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-warning text-warning-foreground hover:bg-warning/90 cursor-pointer"
              onClick={() =>
                revokeTarget && revokeMutation.mutate(revokeTarget.id)
              }
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
              className="bg-danger text-white hover:bg-danger/90 cursor-pointer"
              onClick={() =>
                deleteTarget && deleteMutation.mutate(deleteTarget.id)
              }
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
