"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Trash2, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import type {
  AdminFeatureFlagRow,
  FlagOverrideRow,
  OrgPickerRow,
} from "@/server/admin/feature-flags";

type Props = {
  flag: AdminFeatureFlagRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ManageOverridesDialog({ flag, open, onOpenChange }: Props) {
  const [overrides, setOverrides] = useState<FlagOverrideRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [picker, setPicker] = useState("");
  const [pickerResults, setPickerResults] = useState<OrgPickerRow[]>([]);
  const [pickerLoading, setPickerLoading] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);

  // Load overrides whenever the dialog opens.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    fetch(`/api/admin/feature-flags/${encodeURIComponent(flag.key)}/overrides`)
      .then((r) => r.json())
      .then((body: { data: FlagOverrideRow[] }) => {
        if (!cancelled) setOverrides(body.data ?? []);
      })
      .catch(() => {
        if (!cancelled) toast.error("Could not load overrides");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, flag.key]);

  // Debounced org search.
  useEffect(() => {
    const q = picker.trim();
    if (q.length < 2) {
      setPickerResults([]);
      return;
    }
    const handle = setTimeout(() => {
      setPickerLoading(true);
      fetch(`/api/admin/organizations/search?q=${encodeURIComponent(q)}`)
        .then((r) => r.json())
        .then((body: { data: OrgPickerRow[] }) => setPickerResults(body.data ?? []))
        .catch(() => setPickerResults([]))
        .finally(() => setPickerLoading(false));
    }, 200);
    return () => clearTimeout(handle);
  }, [picker]);

  async function addOverride(org: OrgPickerRow, enabled: boolean) {
    setPendingId(org.id);
    try {
      const res = await fetch(
        `/api/admin/feature-flags/${encodeURIComponent(flag.key)}/overrides`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ organizationId: org.id, enabled }),
        },
      );
      if (!res.ok) throw new Error("Add failed");
      toast.success(`${org.name} → ${enabled ? "on" : "off"}`);
      setPicker("");
      setPickerResults([]);
      // Reload overrides
      const refreshed = await fetch(
        `/api/admin/feature-flags/${encodeURIComponent(flag.key)}/overrides`,
      ).then((r) => r.json());
      setOverrides(refreshed.data ?? []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Add failed");
    } finally {
      setPendingId(null);
    }
  }

  async function flipOverride(row: FlagOverrideRow) {
    setPendingId(row.id);
    try {
      const res = await fetch(
        `/api/admin/feature-flags/${encodeURIComponent(flag.key)}/overrides`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            organizationId: row.organizationId,
            enabled: !row.enabled,
          }),
        },
      );
      if (!res.ok) throw new Error("Update failed");
      setOverrides((prev) =>
        prev.map((o) => (o.id === row.id ? { ...o, enabled: !o.enabled } : o)),
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setPendingId(null);
    }
  }

  async function deleteOverride(row: FlagOverrideRow) {
    setPendingId(row.id);
    try {
      const res = await fetch(
        `/api/admin/feature-flags/${encodeURIComponent(flag.key)}/overrides?organizationId=${encodeURIComponent(row.organizationId)}`,
        { method: "DELETE" },
      );
      if (!res.ok) throw new Error("Delete failed");
      setOverrides((prev) => prev.filter((o) => o.id !== row.id));
      toast.success(`Removed override for ${row.organizationName}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            <span className="font-mono text-sm">{flag.key}</span> overrides
          </DialogTitle>
          <DialogDescription>
            Per-org overrides win over the global default (
            {flag.enabled ? "currently on" : "currently off"}).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-foreground text-xs font-medium">Add override</label>
            <div className="relative mt-1.5">
              <Search
                size={14}
                className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
              />
              <Input
                value={picker}
                onChange={(e) => setPicker(e.target.value)}
                placeholder="Search organisation by name or slug…"
                className="pl-8"
              />
            </div>
            {picker.trim().length >= 2 && (
              <div className="bg-background mt-2 max-h-44 overflow-y-auto rounded-md border">
                {pickerLoading ? (
                  <p className="text-muted-foreground px-3 py-2 text-xs">Searching…</p>
                ) : pickerResults.length === 0 ? (
                  <p className="text-muted-foreground px-3 py-2 text-xs">No matches.</p>
                ) : (
                  pickerResults.map((org) => {
                    const alreadyOverridden = overrides.some((o) => o.organizationId === org.id);
                    return (
                      <div
                        key={org.id}
                        className="border-border flex items-center justify-between gap-2 border-b px-3 py-2 last:border-b-0"
                      >
                        <div className="min-w-0">
                          <p className="text-foreground truncate text-xs font-medium">{org.name}</p>
                          <p className="text-muted-foreground truncate font-mono text-[10px]">
                            {org.slug}
                          </p>
                        </div>
                        {alreadyOverridden ? (
                          <span className="text-muted-foreground text-[10px]">
                            already overridden
                          </span>
                        ) : (
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={pendingId === org.id}
                              onClick={() => addOverride(org, true)}
                              className="cursor-pointer"
                            >
                              On
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={pendingId === org.id}
                              onClick={() => addOverride(org, false)}
                              className="cursor-pointer"
                            >
                              Off
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          <div>
            <p className="text-foreground text-xs font-medium">
              Active overrides ({overrides.length})
            </p>
            {loading ? (
              <p className="text-muted-foreground mt-2 text-xs">Loading…</p>
            ) : overrides.length === 0 ? (
              <p className="text-muted-foreground mt-2 text-xs italic">
                No overrides set. Every org currently sees the global value.
              </p>
            ) : (
              <ul className="divide-border bg-background mt-2 max-h-64 divide-y overflow-y-auto rounded-md border">
                {overrides.map((row) => (
                  <li key={row.id} className="flex items-center justify-between gap-3 px-3 py-2">
                    <div className="min-w-0">
                      <p className="text-foreground truncate text-xs font-medium">
                        {row.organizationName}
                      </p>
                      <p className="text-muted-foreground font-mono text-[10px]">
                        {row.organizationId}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch
                        size="sm"
                        checked={row.enabled}
                        disabled={pendingId === row.id}
                        onCheckedChange={() => flipOverride(row)}
                        aria-label={`Toggle ${flag.key} for ${row.organizationName}`}
                      />
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        disabled={pendingId === row.id}
                        onClick={() => deleteOverride(row)}
                        aria-label={`Remove override for ${row.organizationName}`}
                        className="text-muted-foreground hover:text-destructive cursor-pointer"
                      >
                        <Trash2 size={12} />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
