"use client";

import { useState } from "react";
import {
  Trash2, Copy, Check, Eye, EyeOff, ToggleLeft, ToggleRight, Zap, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

export type WebhookItem = {
  id: string;
  name: string;
  url: string;
  secret: string;
  events: string[];
  isActive: boolean;
  lastTriggeredAt: string | null;
  createdAt: string;
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
      title="Copy"
    >
      {copied ? <Check size={13} className="text-success" /> : <Copy size={13} />}
    </button>
  );
}

function SecretCell({ secret }: { secret: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="flex items-center gap-1">
      <span className="font-mono text-xs text-muted-foreground">
        {visible ? secret : `${secret.slice(0, 10)}${"•".repeat(20)}`}
      </span>
      <button
        onClick={() => setVisible((v) => !v)}
        className="rounded p-1 text-muted-foreground hover:bg-secondary transition-colors"
      >
        {visible ? <EyeOff size={12} /> : <Eye size={12} />}
      </button>
      <CopyButton text={secret} />
    </div>
  );
}

export function WebhookCard({
  webhook,
  onToggle,
  onDelete,
}: {
  webhook: WebhookItem;
  onToggle: (id: string, isActive: boolean) => void;
  onDelete: (webhook: WebhookItem) => void;
}) {
  const [testing, setTesting] = useState(false);

  async function handleTest() {
    setTesting(true);
    try {
      const res = await fetch(`/api/webhooks/${webhook.id}/test`, { method: "POST" });
      const json = await res.json() as { success: boolean; statusCode: number; error: string | null };
      if (json.success) {
        toast.success(`Test ping delivered (HTTP ${json.statusCode}).`);
      } else {
        toast.error(
          json.error
            ? `Delivery failed: ${json.error}`
            : `Endpoint returned HTTP ${json.statusCode}.`,
        );
      }
    } catch {
      toast.error("Failed to send test ping.");
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="rounded-card border border-border bg-card p-5 shadow-cf-1">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <p className="font-medium text-foreground">{webhook.name}</p>
            <span className={`inline-flex rounded-pill px-2 py-0.5 text-[10px] font-medium ${webhook.isActive ? "bg-success/10 text-success" : "bg-secondary text-muted-foreground"}`}>
              {webhook.isActive ? "Active" : "Inactive"}
            </span>
          </div>
          <p className="truncate font-mono text-xs text-muted-foreground">{webhook.url}</p>
          <SecretCell secret={webhook.secret} />
          <div className="flex flex-wrap gap-1">
            {webhook.events.map((e) => (
              <span key={e} className="rounded-pill bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground">
                {e}
              </span>
            ))}
          </div>
          {webhook.lastTriggeredAt && (
            <p className="text-[10px] text-muted-foreground">
              Last triggered {formatDistanceToNow(new Date(webhook.lastTriggeredAt), { addSuffix: true })}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            title="Send test ping"
            onClick={handleTest}
            disabled={testing}
          >
            {testing
              ? <Loader2 size={13} className="animate-spin" />
              : <Zap size={13} className="text-muted-foreground" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            title={webhook.isActive ? "Deactivate" : "Activate"}
            onClick={() => onToggle(webhook.id, !webhook.isActive)}
          >
            {webhook.isActive
              ? <ToggleRight size={16} className="text-success" />
              : <ToggleLeft size={16} className="text-muted-foreground" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-danger"
            title="Delete"
            onClick={() => onDelete(webhook)}
          >
            <Trash2 size={13} />
          </Button>
        </div>
      </div>
    </div>
  );
}
