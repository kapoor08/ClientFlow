"use client";

import { useState } from "react";
import { Ban, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function RevokeInvitationButton({ invitationId }: { invitationId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleRevoke() {
    setPending(true);
    try {
      const res = await fetch(`/api/admin/invitations/${invitationId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Invitation revoked.");
      router.refresh();
    } catch {
      toast.error("Failed to revoke invitation.");
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      onClick={handleRevoke}
      disabled={pending}
      className="rounded-lg p-1.5 text-warning hover:bg-warning/10 transition-colors disabled:opacity-50"
      title="Revoke invitation"
    >
      {pending ? <Loader2 size={13} className="animate-spin" /> : <Ban size={13} />}
    </button>
  );
}
