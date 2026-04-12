"use client";

import { useState } from "react";
import { Ban, Trash2, MoreHorizontal, Loader2 } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function ApiKeyActions({ keyId, isActive }: { keyId: string; isActive: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handle(action: "revoke" | "delete") {
    setPending(true);
    try {
      const res = await fetch(`/api/admin/api-keys/${keyId}`, {
        method: action === "delete" ? "DELETE" : "PATCH",
        headers: { "Content-Type": "application/json" },
        ...(action === "revoke" ? { body: JSON.stringify({ action: "revoke" }) } : {}),
      });
      if (!res.ok) throw new Error();
      toast.success(action === "revoke" ? "Key revoked." : "Key deleted.");
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
            <DropdownMenuItem onClick={() => handle("revoke")} className="gap-2">
              <Ban size={13} className="text-warning" /> Revoke
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
