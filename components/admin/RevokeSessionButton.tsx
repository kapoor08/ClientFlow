"use client";

import { useState } from "react";
import { Loader2, LogOut } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function RevokeSessionButton({ sessionId, userId }: { sessionId: string; userId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleRevoke() {
    setPending(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/sessions/${sessionId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Session revoked.");
      router.refresh();
    } catch {
      toast.error("Failed to revoke session.");
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      onClick={handleRevoke}
      disabled={pending}
      className="rounded-lg p-1.5 text-warning hover:bg-warning/10 transition-colors disabled:opacity-50"
      title="Revoke session"
    >
      {pending ? <Loader2 size={12} className="animate-spin" /> : <LogOut size={12} />}
    </button>
  );
}
