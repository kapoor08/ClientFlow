"use client";

import { useEffect, useState } from "react";
import { Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type PreviewLine = { description: string; amount: number };

type PreviewResponse = {
  amountDueNow: number;
  currency: string;
  prorationLines: PreviewLine[];
  nextBillingAt: number | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onApplied: () => void;
  fromPlanName: string;
  toPlanName: string;
  toPlanCode: string;
  cycle?: "month" | "year";
  /**
   * "upgrade" | "downgrade" | "lateral" - drives the dialog title, CTA copy,
   * and a small explanatory note about proration direction. The actual plan
   * change is the same Stripe call either way; this only affects copy.
   */
  direction?: "upgrade" | "downgrade" | "lateral";
};

function formatMoney(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

export function PlanChangePreviewDialog({
  open,
  onClose,
  onApplied,
  fromPlanName,
  toPlanName,
  toPlanCode,
  cycle = "month",
  direction = "lateral",
}: Props) {
  const titleByDirection = {
    upgrade: "Upgrade plan",
    downgrade: "Downgrade plan",
    lateral: "Change plan",
  } as const;
  const ctaByDirection = {
    upgrade: "Confirm upgrade",
    downgrade: "Confirm downgrade",
    lateral: "Confirm change",
  } as const;
  const directionNote =
    direction === "downgrade"
      ? "This change applies immediately. You'll receive prorated credit for the unused portion of your current plan, applied to your next invoice."
      : direction === "upgrade"
        ? "This change applies immediately. You'll be charged the prorated difference now and continue on your existing billing cycle."
        : null;
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setPreview(null);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch("/api/billing/preview-plan-change", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planCode: toPlanCode, cycle }),
    })
      .then(async (res) => {
        const body = (await res.json().catch(() => null)) as
          | (PreviewResponse & { error?: string })
          | null;
        if (!res.ok) throw new Error(body?.error ?? "Could not load preview");
        return body as PreviewResponse;
      })
      .then((data) => {
        if (!cancelled) setPreview(data);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, toPlanCode, cycle]);

  async function applyChange() {
    setApplying(true);
    try {
      const res = await fetch("/api/billing/change-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planCode: toPlanCode, cycle }),
      });
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(body?.error ?? "Could not change plan");
      toast.success(`Switched to ${toPlanName}.`);
      onApplied();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not change plan");
    } finally {
      setApplying(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{titleByDirection[direction]}</DialogTitle>
          <DialogDescription className="flex items-center gap-1.5">
            <span className="text-foreground font-medium">{fromPlanName}</span>
            <ArrowRight size={12} className="text-muted-foreground" />
            <span className="text-foreground font-medium">{toPlanName}</span>
          </DialogDescription>
        </DialogHeader>

        {directionNote && (
          <p className="text-muted-foreground -mt-1 text-[12px] leading-relaxed">{directionNote}</p>
        )}

        <div className="space-y-3">
          {loading ? (
            <div className="text-muted-foreground flex items-center justify-center py-6 text-sm">
              <Loader2 size={14} className="mr-2 animate-spin" />
              Calculating proration…
            </div>
          ) : error ? (
            <div className="border-destructive/30 bg-destructive/10 text-destructive rounded-md border p-3 text-xs">
              {error}
            </div>
          ) : preview ? (
            <>
              <div className="border-border bg-muted/30 rounded-md border p-3">
                <p className="text-muted-foreground text-xs">Due today</p>
                <p className="font-display text-foreground text-2xl font-bold">
                  {formatMoney(preview.amountDueNow, preview.currency)}
                </p>
                {preview.amountDueNow < 0 && (
                  <p className="text-success mt-1 text-[11px]">
                    Credit applied to your next invoice.
                  </p>
                )}
              </div>

              {preview.prorationLines.length > 0 && (
                <div>
                  <p className="text-foreground mb-2 text-xs font-medium">Proration breakdown</p>
                  <ul className="divide-border bg-background divide-y rounded-md border text-xs">
                    {preview.prorationLines.map((line, i) => (
                      <li key={i} className="flex items-center justify-between gap-3 px-3 py-2">
                        <span className="text-muted-foreground truncate">{line.description}</span>
                        <span className="text-foreground font-mono">
                          {formatMoney(line.amount, preview.currency)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {preview.nextBillingAt && (
                <p className="text-muted-foreground text-[11px]">
                  Next charge:{" "}
                  {new Date(preview.nextBillingAt * 1000).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              )}
            </>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={applying}>
            Cancel
          </Button>
          <Button
            onClick={applyChange}
            disabled={loading || applying || !preview || !!error}
            className="cursor-pointer"
          >
            {applying ? (
              <>
                <Loader2 size={14} className="mr-1.5 animate-spin" />
                Applying…
              </>
            ) : (
              ctaByDirection[direction]
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
