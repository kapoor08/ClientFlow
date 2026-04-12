"use client";

import { useState } from "react";
import { ToggleLeft, Trash2, MoreHorizontal, Loader2 } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function WebhookActions({ webhookId, isActive }: { webhookId: string; isActive: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handle(action: "deactivate" | "delete") {
    setPending(true);
    try {
      const res = await fetch(`/api/admin/webhooks/${webhookId}`, {
        method: action === "delete" ? "DELETE" : "PATCH",
        headers: { "Content-Type": "application/json" },
        ...(action === "deactivate" ? { body: JSON.stringify({ action: "deactivate" }) } : {}),
      });
      if (!res.ok) throw new Error();
      toast.success(action === "deactivate" ? "Webhook deactivated." : "Webhook deleted.");
      router.refresh();
    } catch {
      toast.error("Action failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary transition-colors" disabled={pending}>
          {pending ? <Loader2 size={13} className="animate-spin" /> : <MoreHorizontal size={13} />}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        {isActive && (
          <>
            <DropdownMenuItem onClick={() => handle("deactivate")} className="gap-2">
              <ToggleLeft size={13} className="text-warning" /> Deactivate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem onClick={() => handle("delete")} className="gap-2 text-danger focus:text-danger">
          <Trash2 size={13} /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
