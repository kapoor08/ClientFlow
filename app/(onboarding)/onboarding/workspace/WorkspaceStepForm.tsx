"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Plus, X, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Invite = { email: string; role: string };

const ROLE_OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Manager" },
  { value: "member", label: "Member" },
];

export default function WorkspaceStepForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [invites, setInvites] = useState<Invite[]>([{ email: "", role: "member" }]);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addInvite() {
    setInvites((prev) => [...prev, { email: "", role: "member" }]);
  }

  function removeInvite(index: number) {
    setInvites((prev) => prev.filter((_, i) => i !== index));
  }

  function updateInvite(index: number, field: keyof Invite, value: string) {
    setInvites((prev) =>
      prev.map((inv, i) => (i === index ? { ...inv, [field]: value } : inv)),
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const validInvites = invites.filter((inv) => inv.email.trim());
    if (validInvites.length === 0) {
      router.push("/onboarding/complete");
      return;
    }

    startTransition(async () => {
      try {
        await Promise.all(
          validInvites.map((inv) =>
            fetch("/api/invitations", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email: inv.email.trim(), roleKey: inv.role }),
            }).then(async (res) => {
              if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error ?? `Failed to invite ${inv.email}`);
              }
            }),
          ),
        );
        setSent(true);
        setTimeout(() => router.push("/onboarding/complete"), 1200);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to send invitations.");
      }
    });
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <CheckCircle2 size={40} className="text-success" />
        <p className="text-sm font-medium text-foreground">Invitations sent!</p>
        <p className="text-xs text-muted-foreground">Redirecting…</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-card border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {invites.map((invite, i) => (
          <div key={i} className="flex items-end gap-2">
            <div className="flex-1 space-y-2">
              {i === 0 && <Label>Email address</Label>}
              <Input
                type="email"
                value={invite.email}
                onChange={(e) => updateInvite(i, "email", e.target.value)}
                placeholder="teammate@company.com"
                disabled={isPending}
              />
            </div>
            <div className="w-36 space-y-2">
              {i === 0 && <Label>Role</Label>}
              <Select
                value={invite.role}
                onValueChange={(v) => updateInvite(i, "role", v)}
              >
                <SelectTrigger disabled={isPending}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper">
                  {ROLE_OPTIONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {invites.length > 1 && (
              <button
                type="button"
                onClick={() => removeInvite(i)}
                className="mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>
        ))}
      </div>

      {invites.length < 5 && (
        <button
          type="button"
          onClick={addInvite}
          className="flex items-center gap-1.5 text-sm text-primary hover:underline"
        >
          <Plus size={14} />
          Add another
        </button>
      )}

      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={() => router.push("/onboarding/complete")}
          disabled={isPending}
        >
          Skip for now
        </Button>
        <Button type="submit" className="flex-1" disabled={isPending}>
          {isPending ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <>
              Send invites <ArrowRight size={16} />
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
