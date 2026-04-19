"use client";

import { useState } from "react";
import { Ban, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { TipButton, TooltipProvider } from "@/components/data-table/RowActions";

export function ApiKeyActions({ keyId, isActive }: { keyId: string; isActive: boolean }) {
  const router = useRouter();
  const [revoking, setRevoking] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleRevoke() {
    setRevoking(true);
    try {
      const res = await fetch(`/api/admin/api-keys/${keyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "revoke" }),
      });
      if (!res.ok) throw new Error();
      toast.success("Key revoked.");
      router.refresh();
    } catch {
      toast.error("Action failed.");
    } finally {
      setRevoking(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/api-keys/${keyId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Key deleted.");
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
            label="Revoke"
            onClick={handleRevoke}
            disabled={revoking || deleting}
            variant="warning"
          >
            {revoking ? <Loader2 size={14} className="animate-spin" /> : <Ban size={14} />}
          </TipButton>
        )}
        <TipButton
          label="Delete"
          onClick={handleDelete}
          disabled={revoking || deleting}
          variant="danger"
        >
          {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
        </TipButton>
      </div>
    </TooltipProvider>
  );
}
