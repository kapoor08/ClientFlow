"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Send,
  UnplugIcon,
  Users,
} from "lucide-react";
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

type Props = {
  integration: {
    enabled: boolean;
    channelLabel: string | null;
    /** Last 8 chars of the URL host so the user can identify it without leaking the secret. */
    webhookHostHint: string | null;
    installedAt: string;
  } | null;
  canManage: boolean;
};

function maskUrl(url: string): string {
  // Show only the host so the `sig` query parameter (which is the auth
  // secret) never appears on screen even after the user pastes it.
  try {
    return new URL(url).host;
  } catch {
    return url.slice(0, 32) + "…";
  }
}

export function TeamsIntegrationCard({ integration, canManage }: Props) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [instructionsOpen, setInstructionsOpen] = useState(!integration);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [channelLabel, setChannelLabel] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isTesting, setIsTesting] = useState(false);

  async function handleConnect() {
    if (!webhookUrl.trim()) {
      toast.error("Paste the Power Automate webhook URL.");
      return;
    }
    startTransition(async () => {
      const res = await fetch("/api/integrations/teams/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          webhookUrl: webhookUrl.trim(),
          channelLabel: channelLabel.trim() || null,
        }),
      });
      if (res.ok) {
        toast.success("Microsoft Teams connected.");
        setWebhookUrl("");
        setChannelLabel("");
        router.refresh();
      } else {
        const body = await res.json().catch(() => ({}));
        toast.error(body.error ?? "Failed to connect.");
      }
    });
  }

  async function handleDisconnect() {
    startTransition(async () => {
      const res = await fetch("/api/integrations/teams/disconnect", { method: "POST" });
      if (res.ok) {
        toast.success("Microsoft Teams disconnected.");
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
      const res = await fetch("/api/integrations/teams/test", { method: "POST" });
      if (res.ok) {
        toast.success("Test message sent.");
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
          <Users size={20} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-foreground text-base font-semibold">
              Microsoft Teams
            </h2>
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
              {integration.channelLabel ? (
                <>
                  Posting to{" "}
                  <span className="text-foreground font-medium">{integration.channelLabel}</span>
                  {integration.webhookHostHint && (
                    <>
                      {" "}
                      via <span className="font-mono text-xs">{integration.webhookHostHint}</span>
                    </>
                  )}
                  .
                </>
              ) : integration.webhookHostHint ? (
                <>
                  Posting to a Power Automate flow at{" "}
                  <span className="font-mono text-xs">{integration.webhookHostHint}</span>.
                </>
              ) : (
                "Posting to a Power Automate flow."
              )}
            </p>
          ) : (
            <p className="text-muted-foreground mt-1 text-sm">
              Get task assignments, project updates, and incident alerts in a Microsoft Teams
              channel via Power Automate.
            </p>
          )}

          {!canManage && (
            <div className="text-muted-foreground mt-3 flex items-center gap-1.5 text-xs">
              <AlertCircle size={12} /> Only organization admins can manage this integration.
            </div>
          )}

          {/* ─── Connected state actions ─────────────────────────────── */}
          {integration && (
            <div className="mt-4 flex flex-wrap gap-2">
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
                <UnplugIcon size={13} /> Disconnect
              </Button>
            </div>
          )}

          {/* ─── Connect form (when not connected) ───────────────────── */}
          {!integration && canManage && (
            <div className="mt-4 space-y-3">
              <div>
                <label
                  htmlFor="teams-webhook-url"
                  className="text-foreground mb-1.5 block text-xs font-medium"
                >
                  Power Automate webhook URL
                </label>
                <Input
                  id="teams-webhook-url"
                  type="url"
                  placeholder="https://prod-XX.westus.logic.azure.com/workflows/..."
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
              <div>
                <label
                  htmlFor="teams-channel-label"
                  className="text-foreground mb-1.5 block text-xs font-medium"
                >
                  Channel label{" "}
                  <span className="text-muted-foreground font-normal">(optional)</span>
                </label>
                <Input
                  id="teams-channel-label"
                  placeholder="e.g. Engineering – #activity"
                  value={channelLabel}
                  onChange={(e) => setChannelLabel(e.target.value)}
                  maxLength={120}
                />
                <p className="text-muted-foreground mt-1 text-[11px]">
                  Just a memo so you remember which channel this points to.
                </p>
              </div>
              <Button
                size="sm"
                onClick={handleConnect}
                disabled={isPending || !webhookUrl.trim()}
                className="cursor-pointer"
              >
                {isPending ? "Connecting..." : "Connect Teams"}
              </Button>
            </div>
          )}

          {/* ─── Setup instructions (collapsible) ────────────────────── */}
          <button
            type="button"
            onClick={() => setInstructionsOpen((v) => !v)}
            className="text-muted-foreground hover:text-foreground mt-4 flex items-center gap-1 text-xs font-medium transition-colors"
          >
            {instructionsOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            How to get the webhook URL
          </button>

          {instructionsOpen && (
            <div className="bg-secondary/40 border-border mt-3 rounded-lg border p-4 text-[13px]">
              <ol className="text-muted-foreground list-decimal space-y-2 pl-4">
                <li>
                  In Microsoft Teams, open the{" "}
                  <span className="text-foreground font-medium">Workflows</span> app from the left
                  sidebar (or install it from the Apps catalog if it&apos;s not there yet).
                </li>
                <li>
                  Click <span className="text-foreground font-medium">+ New flow</span> →{" "}
                  <span className="text-foreground font-medium">Notifications</span>.
                </li>
                <li>
                  Pick the template{" "}
                  <span className="text-foreground font-medium">
                    &quot;Post to a channel when a webhook request is received&quot;
                  </span>
                  .
                </li>
                <li>
                  Sign in with the Microsoft account that has access to the team and channel you
                  want notifications in.
                </li>
                <li>
                  Choose the destination <span className="text-foreground font-medium">Team</span>{" "}
                  and <span className="text-foreground font-medium">Channel</span>, then click{" "}
                  <span className="text-foreground font-medium">Add workflow</span>.
                </li>
                <li>
                  Copy the generated{" "}
                  <span className="text-foreground font-medium">workflow URL</span> and paste it
                  above.
                </li>
              </ol>
              <a
                href="https://support.microsoft.com/en-us/office/post-a-workflow-when-a-webhook-request-is-received-in-microsoft-teams-8ae491c7-0394-4861-ba59-055e33f75498"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary mt-3 inline-flex items-center gap-1 text-xs font-medium hover:underline"
              >
                Microsoft&apos;s official guide <ExternalLink size={11} />
              </a>
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect Microsoft Teams?</AlertDialogTitle>
            <AlertDialogDescription>
              ClientFlow will stop posting notifications to your Teams channel. To fully cut access,
              also disable the underlying flow in the Teams Workflows app.
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

export { maskUrl };
