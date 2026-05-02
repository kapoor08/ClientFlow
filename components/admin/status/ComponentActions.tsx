"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Power, Trash2, ArrowUp, ArrowDown, Zap, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { TipButton, TooltipProvider } from "@/components/data-table/RowActions";
import {
  toggleComponentActiveAction,
  deleteComponentAction,
  moveComponentAction,
} from "@/server/actions/admin/status-components";
import { ComponentFormDialog } from "./ComponentFormDialog";
import type { AdminStatusComponent } from "@/server/admin/status-components";

type Props = {
  component: AdminStatusComponent;
  isFirst: boolean;
  isLast: boolean;
};

export function ComponentActions({ component, isFirst, isLast }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editOpen, setEditOpen] = useState(false);

  function withFeedback(fn: () => Promise<{ error?: string }>, successMessage: string) {
    startTransition(async () => {
      const result = await fn();
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(successMessage);
        router.refresh();
      }
    });
  }

  async function handleProbeNow() {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/status/components/${component.id}/probe-now`, {
          method: "POST",
        });
        const data = (await res.json()) as
          | { state: string; result: { success: boolean; latencyMs: number; error?: string } }
          | { error: string };
        if (!res.ok || "error" in data) {
          toast.error("error" in data ? data.error : "Probe failed");
          return;
        }
        const { state, result } = data;
        if (result.success) {
          toast.success(`Probe ok (${result.latencyMs}ms) → ${state}`);
        } else {
          toast.warning(`Probe failed: ${result.error ?? "unknown"} → ${state}`);
        }
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Probe failed");
      }
    });
  }

  return (
    <>
      <TooltipProvider>
        <div className="flex items-center gap-0.5">
          <TipButton
            label="Move up"
            onClick={() =>
              withFeedback(() => moveComponentAction(component.id, "up"), "Reordered.")
            }
            disabled={isPending || isFirst}
          >
            <ArrowUp size={14} />
          </TipButton>
          <TipButton
            label="Move down"
            onClick={() =>
              withFeedback(() => moveComponentAction(component.id, "down"), "Reordered.")
            }
            disabled={isPending || isLast}
          >
            <ArrowDown size={14} />
          </TipButton>
          <TipButton label="Probe now" onClick={handleProbeNow} disabled={isPending}>
            {isPending ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
          </TipButton>
          <TipButton label="Edit" onClick={() => setEditOpen(true)} disabled={isPending}>
            <Pencil size={14} />
          </TipButton>
          <TipButton
            label={component.isActive ? "Deactivate" : "Activate"}
            onClick={() =>
              withFeedback(
                () => toggleComponentActiveAction(component.id, !component.isActive),
                component.isActive ? "Deactivated." : "Activated.",
              )
            }
            disabled={isPending}
            variant={component.isActive ? "warning" : "success"}
          >
            <Power size={14} />
          </TipButton>
          <TipButton
            label="Delete"
            onClick={() => {
              if (
                confirm(
                  `Delete "${component.name}"? Probe history and incident links will be removed.`,
                )
              ) {
                withFeedback(() => deleteComponentAction(component.id), "Component deleted.");
              }
            }}
            disabled={isPending}
            variant="danger"
          >
            <Trash2 size={14} />
          </TipButton>
        </div>
      </TooltipProvider>

      <ComponentFormDialog component={component} open={editOpen} onOpenChange={setEditOpen} />
    </>
  );
}
