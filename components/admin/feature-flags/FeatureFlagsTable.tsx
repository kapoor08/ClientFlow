"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import type { AdminFeatureFlagRow } from "@/server/admin/feature-flags";
import { ManageOverridesDialog } from "./ManageOverridesDialog";

type Props = { rows: AdminFeatureFlagRow[] };

export function FeatureFlagsTable({ rows }: Props) {
  const router = useRouter();
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [overridesFor, setOverridesFor] = useState<AdminFeatureFlagRow | null>(null);

  async function toggleFlag(row: AdminFeatureFlagRow, nextEnabled: boolean) {
    setPendingKey(row.key);
    try {
      const res = await fetch("/api/admin/feature-flags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: row.key,
          enabled: nextEnabled,
          description: row.description,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Update failed");
      }
      toast.success(
        row.seeded
          ? `${row.key} → ${nextEnabled ? "on" : "off"}`
          : `Seeded ${row.key} (${nextEnabled ? "on" : "off"})`,
      );
      startTransition(() => router.refresh());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setPendingKey(null);
    }
  }

  return (
    <>
      <div className="bg-card shadow-cf-1 overflow-hidden rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-muted-foreground text-xs">
            <tr>
              <th className="px-4 py-2.5 text-left font-medium">Key</th>
              <th className="px-4 py-2.5 text-left font-medium">Description</th>
              <th className="px-4 py-2.5 text-left font-medium">Global</th>
              <th className="px-4 py-2.5 text-left font-medium">Overrides</th>
              <th className="px-4 py-2.5 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-border divide-y">
            {rows.map((row) => (
              <tr key={row.key} className="hover:bg-muted/30">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-foreground font-mono text-xs">{row.key}</span>
                    {!row.seeded && (
                      <span className="bg-warning/10 text-warning rounded-full px-1.5 py-0.5 text-[10px] font-medium">
                        not seeded
                      </span>
                    )}
                  </div>
                </td>
                <td className="text-muted-foreground px-4 py-3 text-xs">
                  {row.description ?? <span className="italic">-</span>}
                </td>
                <td className="px-4 py-3">
                  <Switch
                    checked={row.enabled}
                    disabled={pendingKey === row.key}
                    onCheckedChange={(v) => toggleFlag(row, v)}
                    aria-label={`Toggle ${row.key} globally`}
                  />
                </td>
                <td className="px-4 py-3">
                  <span className="text-muted-foreground text-xs">
                    {row.overrideCount === 0
                      ? "-"
                      : `${row.overrideCount} org${row.overrideCount === 1 ? "" : "s"}`}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Button
                    size="sm"
                    variant="outline"
                    className="cursor-pointer"
                    onClick={() => setOverridesFor(row)}
                    disabled={!row.seeded}
                    title={
                      row.seeded
                        ? "Manage per-org overrides"
                        : "Seed the flag (toggle it once) before adding overrides"
                    }
                  >
                    <Settings2 size={12} className="mr-1.5" />
                    Overrides
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {overridesFor && (
        <ManageOverridesDialog
          flag={overridesFor}
          open={overridesFor !== null}
          onOpenChange={(open) => {
            if (!open) {
              setOverridesFor(null);
              startTransition(() => router.refresh());
            }
          }}
        />
      )}
    </>
  );
}
