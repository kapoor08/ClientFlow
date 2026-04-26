"use client";

import { useEffect, useState, useTransition } from "react";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

type Blocker = {
  kind: "sole_owner_with_members";
  organizationId: string;
  organizationName: string;
  memberCount: number;
};

type StatusResponse = {
  status: {
    scheduled: boolean;
    scheduledAt: string | null;
    scheduledFor: string | null;
    daysRemaining: number | null;
  };
  blockers: Blocker[];
};

export function DeleteAccountSection() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<StatusResponse | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    void refresh();
  }, []);

  async function refresh() {
    setLoading(true);
    try {
      const res = await fetch("/api/settings/account-deletion");
      if (!res.ok) throw new Error();
      setData((await res.json()) as StatusResponse);
    } catch {
      toast.error("Could not load account deletion status.");
    } finally {
      setLoading(false);
    }
  }

  function handleSchedule() {
    if (confirmText !== "DELETE") return;
    startTransition(async () => {
      try {
        const res = await fetch("/api/settings/account-deletion", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ confirm: "DELETE" }),
        });
        if (res.status === 409) {
          toast.error("Deletion blocked - please resolve the items listed above first.");
          await refresh();
          return;
        }
        if (!res.ok) throw new Error();
        toast.success("Account deletion scheduled.");
        setConfirmOpen(false);
        setConfirmText("");
        await refresh();
      } catch {
        toast.error("Could not schedule deletion. Please retry.");
      }
    });
  }

  function handleCancel() {
    startTransition(async () => {
      try {
        const res = await fetch("/api/settings/account-deletion", {
          method: "DELETE",
        });
        if (!res.ok) throw new Error();
        toast.success("Account deletion cancelled.");
        await refresh();
      } catch {
        toast.error("Could not cancel deletion. Please retry.");
      }
    });
  }

  if (loading) {
    return (
      <div className="rounded-card border-border bg-card shadow-cf-1 border p-5">
        <Loader2 size={16} className="text-muted-foreground animate-spin" />
      </div>
    );
  }
  if (!data) return null;

  const { status, blockers } = data;

  return (
    <div className="rounded-card border-danger/30 bg-danger/5 shadow-cf-1 border p-5">
      <div className="flex items-start gap-3">
        <AlertTriangle size={18} className="text-danger mt-0.5 shrink-0" />
        <div className="flex-1 space-y-3">
          <div>
            <h3 className="text-foreground text-sm font-semibold">Delete my account</h3>
            <p className="text-muted-foreground mt-1 text-xs">
              Permanently removes your personal data after a 30-day grace period. You can cancel any
              time before the period ends.
            </p>
          </div>

          {status.scheduled ? (
            <ScheduledBanner
              scheduledFor={status.scheduledFor}
              daysRemaining={status.daysRemaining}
              onCancel={handleCancel}
              pending={pending}
            />
          ) : blockers.length > 0 ? (
            <BlockersList blockers={blockers} />
          ) : (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setConfirmOpen(true)}
              className="cursor-pointer"
            >
              <Trash2 size={13} className="mr-1.5" /> Delete my account
            </Button>
          )}
        </div>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
            <AlertDialogDescription>
              Your account will be scheduled for deletion in 30 days. During that window you can
              sign in and cancel. After 30 days your personal data is anonymized and cannot be
              restored. Type <span className="text-foreground font-mono">DELETE</span> to confirm.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="DELETE"
            autoFocus
          />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmText("")} disabled={pending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSchedule}
              disabled={confirmText !== "DELETE" || pending}
              className="bg-danger text-danger-foreground hover:bg-danger/90"
            >
              {pending ? "Working…" : "Schedule deletion"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ScheduledBanner({
  scheduledFor,
  daysRemaining,
  onCancel,
  pending,
}: {
  scheduledFor: string | null;
  daysRemaining: number | null;
  onCancel: () => void;
  pending: boolean;
}) {
  const date = scheduledFor ? new Date(scheduledFor).toLocaleDateString() : "";
  return (
    <div className="space-y-2">
      <p className="text-foreground text-xs">
        Your account will be deleted on <span className="font-semibold">{date}</span>
        {daysRemaining !== null ? ` (${daysRemaining} days remaining)` : ""}.
      </p>
      <Button
        variant="outline"
        size="sm"
        onClick={onCancel}
        disabled={pending}
        className="cursor-pointer"
      >
        {pending ? "Working…" : "Cancel deletion"}
      </Button>
    </div>
  );
}

function BlockersList({ blockers }: { blockers: Blocker[] }) {
  return (
    <div className="space-y-2">
      <p className="text-foreground text-xs font-medium">
        Resolve these before you can delete your account:
      </p>
      <ul className="text-muted-foreground space-y-1 text-xs">
        {blockers.map((b) => (
          <li key={b.organizationId}>
            You are the sole owner of{" "}
            <span className="text-foreground font-medium">{b.organizationName}</span> and there{" "}
            {b.memberCount === 1 ? "is" : "are"} {b.memberCount} other{" "}
            {b.memberCount === 1 ? "member" : "members"}. Transfer ownership or remove the other
            members first.
          </li>
        ))}
      </ul>
    </div>
  );
}
