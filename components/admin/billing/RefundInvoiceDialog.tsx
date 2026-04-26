"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCcw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { toast } from "sonner";
import { refundInvoiceAction } from "@/server/actions/admin/billing";

type RefundableInvoice = {
  id: string;
  externalInvoiceId: string | null;
  status: string;
  amountPaidCents: number;
  currencyCode: string | null;
  paidAt: string | null;
  invoiceUrl: string | null;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscriptionId: string;
  orgName: string;
};

function formatCents(cents: number, currency: string | null) {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: currency ?? "USD",
  });
}

export function RefundInvoiceDialog({ open, onOpenChange, subscriptionId, orgName }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [invoices, setInvoices] = useState<RefundableInvoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [amountDollars, setAmountDollars] = useState<string>("");
  const [reason, setReason] = useState<"requested_by_customer" | "duplicate" | "fraudulent">(
    "requested_by_customer",
  );

  useEffect(() => {
    // Resets dialog state on close + fetches refundable invoices on open.
    // setState-in-effect is the correct pattern here: the dialog open/close is
    // the external system this effect synchronises with.
    /* eslint-disable react-hooks/set-state-in-effect */
    if (!open) {
      setInvoices([]);
      setSelectedId(null);
      setAmountDollars("");
      return;
    }

    setLoading(true);
    fetch(`/api/admin/subscriptions/${subscriptionId}/refundable-invoices`)
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const data = (await r.json()) as { invoices: RefundableInvoice[] };
        setInvoices(data.invoices);
      })
      .catch(() => toast.error("Failed to load refundable invoices."))
      .finally(() => setLoading(false));
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [open, subscriptionId]);

  const selected = invoices.find((i) => i.id === selectedId) ?? null;

  function handleSubmit() {
    if (!selected) {
      toast.error("Select an invoice to refund.");
      return;
    }

    const fullAmountCents = selected.amountPaidCents;
    const trimmed = amountDollars.trim();
    let amountCents: number | undefined;

    if (trimmed.length > 0) {
      const parsed = Number(trimmed);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        toast.error("Enter a valid refund amount.");
        return;
      }
      amountCents = Math.round(parsed * 100);
      if (amountCents > fullAmountCents) {
        toast.error("Refund amount cannot exceed the invoice total.");
        return;
      }
    }

    startTransition(async () => {
      const result = await refundInvoiceAction({
        invoiceId: selected.id,
        amountCents,
        reason,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(`Refunded ${formatCents(result.refund!.amountCents, selected.currencyCode)}.`);
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCcw size={16} /> Refund invoice
          </DialogTitle>
          <DialogDescription>
            Issue a full or partial refund for {orgName}. Refunds are processed through Stripe and
            cannot be undone.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 size={20} className="text-muted-foreground animate-spin" />
          </div>
        ) : invoices.length === 0 ? (
          <div className="rounded-card border-border bg-card text-muted-foreground border px-4 py-6 text-center text-sm">
            No paid, Stripe-synced invoices on this subscription.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Invoice</Label>
              <div className="rounded-card border-border max-h-60 space-y-1.5 overflow-y-auto border p-1.5">
                {invoices.map((inv) => (
                  <button
                    key={inv.id}
                    type="button"
                    onClick={() => setSelectedId(inv.id)}
                    className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                      selectedId === inv.id
                        ? "border-primary bg-primary/5"
                        : "hover:bg-secondary/50 border-transparent"
                    }`}
                  >
                    <div>
                      <p className="text-foreground font-medium">
                        {formatCents(inv.amountPaidCents, inv.currencyCode)}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {inv.paidAt
                          ? new Date(inv.paidAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "-"}
                        {inv.externalInvoiceId && (
                          <span className="ml-2 font-mono text-[10px]">
                            {inv.externalInvoiceId.slice(0, 14)}…
                          </span>
                        )}
                      </p>
                    </div>
                    {selectedId === inv.id && (
                      <span className="text-primary text-xs font-semibold">Selected</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="refund-amount">Amount (optional)</Label>
              <Input
                id="refund-amount"
                type="number"
                step="0.01"
                placeholder={
                  selected
                    ? `Full (${formatCents(selected.amountPaidCents, selected.currencyCode)})`
                    : "Full refund"
                }
                value={amountDollars}
                onChange={(e) => setAmountDollars(e.target.value)}
              />
              <p className="text-muted-foreground text-xs">
                Leave blank to refund the full amount. Enter a smaller amount for a partial refund.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>Reason</Label>
              <Select value={reason} onValueChange={(v) => setReason(v as typeof reason)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="requested_by_customer">Requested by customer</SelectItem>
                  <SelectItem value="duplicate">Duplicate charge</SelectItem>
                  <SelectItem value="fraudulent">Fraudulent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleSubmit}
            disabled={isPending || loading || !selected}
          >
            {isPending ? (
              <>
                <Loader2 size={14} className="mr-1.5 animate-spin" /> Refunding…
              </>
            ) : (
              "Refund"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
