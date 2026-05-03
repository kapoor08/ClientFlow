"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, AlertCircle, Send, Slack, Trash2, Unplug } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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

type Props = {
  integration: {
    enabled: boolean;
    teamName: string | null;
    channelName: string | null;
    installedAt: string;
  } | null;
  canManage: boolean;
  /** True if the page just rendered after a successful OAuth callback. */
  connected: boolean;
  /** Error code from the OAuth callback (e.g. "invalid_state"). */
  error: string | null;
};

const ERROR_LABELS: Record<string, string> = {
  forbidden: "Only organization admins can manage integrations.",
  not_configured: "Slack integration is not configured on the server.",
  missing_params: "Slack returned an incomplete response. Please try again.",
  invalid_state: "Install link expired or was tampered with. Please try again.",
  session_mismatch: "You signed in as a different user mid-install. Please retry.",
  oauth_failed: "Slack rejected the install request.",
  access_denied: "You declined the permission request on Slack.",
};

function formatChannel(channel: string | null): string {
  if (!channel) return "selected channel";
  return channel.startsWith("#") ? channel : `#${channel}`;
}

export function SlackIntegrationCard({ integration, canManage, connected, error }: Props) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isTesting, setIsTesting] = useState(false);

  // Surface OAuth callback outcomes via toast on first render only. The
  // searchParams are intentionally not cleared from the URL - rerunning the
  // toast on re-renders is harmless because we use a one-shot toast.id.
  if (typeof window !== "undefined") {
    if (connected) {
      toast.success("Slack workspace connected.", { id: "slack-connected" });
    } else if (error) {
      toast.error(ERROR_LABELS[error] ?? `Install failed: ${error}`, {
        id: `slack-error-${error}`,
      });
    }
  }

  async function handleDisconnect() {
    startTransition(async () => {
      const res = await fetch("/api/integrations/slack/disconnect", { method: "POST" });
      if (res.ok) {
        toast.success("Slack disconnected.");
        setConfirmOpen(false);
        router.refresh();
      } else {
        const body = await res.json().catch(() => ({}));
        toast.error(body.error ?? "Disconnect failed.");
      }
    });
  }

  async function handleTest() {
    setIsTesting(true);
    try {
      const res = await fetch("/api/integrations/slack/test", { method: "POST" });
      if (res.ok) {
        toast.success(`Test message sent to ${formatChannel(integration?.channelName ?? null)}.`);
      } else {
        const body = await res.json().catch(() => ({}));
        toast.error(body.error ?? "Failed to send test message.");
      }
    } finally {
      setIsTesting(false);
    }
  }

  return (
    <div className="rounded-card border-border bg-card shadow-cf-1 border p-5">
      <div className="flex items-start gap-4">
        <div className="bg-secondary flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
          <Slack size={20} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-foreground text-base font-semibold">Slack</h2>
            {integration ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600">
                <CheckCircle2 size={11} /> Connected
              </span>
            ) : (
              <span className="text-muted-foreground bg-secondary rounded-full px-2 py-0.5 text-[11px] font-semibold">
                Not connected
              </span>
            )}
          </div>

          {integration ? (
            <p className="text-muted-foreground mt-1 text-sm">
              Sending notifications to{" "}
              <span className="text-foreground font-medium">
                {formatChannel(integration.channelName)}
              </span>{" "}
              in{" "}
              <span className="text-foreground font-medium">
                {integration.teamName ?? "your workspace"}
              </span>
              .
            </p>
          ) : (
            <p className="text-muted-foreground mt-1 text-sm">
              Get task assignments, project updates, invoice events, and incident alerts delivered
              to a Slack channel.
            </p>
          )}

          {!canManage && (
            <div className="text-muted-foreground mt-3 flex items-center gap-1.5 text-xs">
              <AlertCircle size={12} /> Only organization admins can manage this integration.
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            {integration ? (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleTest}
                  disabled={!canManage || isTesting}
                  className="cursor-pointer"
                >
                  <Send size={13} /> {isTesting ? "Sending..." : "Send test message"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setConfirmOpen(true)}
                  disabled={!canManage}
                  className="text-danger hover:text-danger cursor-pointer"
                >
                  <Unplug size={13} /> Disconnect
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                disabled={!canManage}
                asChild={canManage}
                className="cursor-pointer"
              >
                {canManage ? (
                  <a href="/api/integrations/slack/install">
                    <Slack size={13} /> Add to Slack
                  </a>
                ) : (
                  <span>
                    <Slack size={13} /> Add to Slack
                  </span>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect Slack?</AlertDialogTitle>
            <AlertDialogDescription>
              ClientFlow will stop posting notifications to{" "}
              <strong>{formatChannel(integration?.channelName ?? null)}</strong>. You can reconnect
              any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer" disabled={isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-danger hover:bg-danger/90 cursor-pointer text-white"
              onClick={handleDisconnect}
              disabled={isPending}
            >
              {isPending ? "Disconnecting..." : "Disconnect"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
