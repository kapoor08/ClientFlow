"use client";

import { useState } from "react";
import { ToggleLeft, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { TipButton, TooltipProvider } from "@/components/data-table/RowActions";

export function WebhookActions({ webhookId, isActive }: { webhookId: string; isActive: boolean }) {
  const router = useRouter();
  const [deactivating, setDeactivating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDeactivate() {
    setDeactivating(true);
    try {
      const res = await fetch(`/api/admin/webhooks/${webhookId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "deactivate" }),
      });
      if (!res.ok) throw new Error();
      toast.success("Webhook deactivated.");
      router.refresh();
    } catch {
      toast.error("Action failed.");
    } finally {
      setDeactivating(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/webhooks/${webhookId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Webhook deleted.");
      router.refresh();
    } catch {
      toast.error("Action failed.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <TooltipProvider>
      <div className="flex items-center gap-0.5">
        {isActive && (
          <TipButton
            label="Deactivate"
            onClick={handleDeactivate}
            disabled={deactivating || deleting}
            variant="warning"
          >
            {deactivating ? <Loader2 size={14} className="animate-spin" /> : <ToggleLeft size={14} />}
          </TipButton>
        )}
        <TipButton
          label="Delete"
          onClick={handleDelete}
          disabled={deactivating || deleting}
          variant="danger"
        >
          {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
        </TipButton>
      </div>
    </TooltipProvider>
  );
}
