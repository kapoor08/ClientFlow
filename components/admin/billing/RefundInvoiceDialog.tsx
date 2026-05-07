"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Label } from "@/components/ui/label";
import { ControlledInput, ControlledSelect } from "@/components/form";
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

const REASON_OPTIONS = [
  { value: "requested_by_customer", label: "Requested by customer" },
  { value: "duplicate", label: "Duplicate charge" },
  { value: "fraudulent", label: "Fraudulent" },
] as const;

type ReasonValue = (typeof REASON_OPTIONS)[number]["value"];

const refundFormSchema = z.object({
  invoiceId: z.string().min(1, "Select an invoice to refund."),
  // Empty string means "full refund"; otherwise must be a positive number.
  amountDollars: z
    .string()
    .refine((v) => v.trim() === "" || (Number.isFinite(Number(v)) && Number(v) > 0), {
      message: "Enter a valid refund amount.",
    }),
  reason: z.enum(["requested_by_customer", "duplicate", "fraudulent"]),
});

type RefundFormValues = z.infer<typeof refundFormSchema>;

const DEFAULT_VALUES: RefundFormValues = {
  invoiceId: "",
  amountDollars: "",
  reason: "requested_by_customer",
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

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<RefundFormValues>({
    resolver: zodResolver(refundFormSchema),
    defaultValues: DEFAULT_VALUES,
    mode: "onSubmit",
  });

  const selectedId = useWatch({ control, name: "invoiceId" });

  useEffect(() => {
    // Resets dialog state on close + fetches refundable invoices on open.
    // setState-in-effect is the correct pattern here: the dialog open/close is
    // the external system this effect synchronises with.
    /* eslint-disable react-hooks/set-state-in-effect */
    if (!open) {
      setInvoices([]);
      reset(DEFAULT_VALUES);
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
  }, [open, subscriptionId, reset]);

  const selected = invoices.find((i) => i.id === selectedId) ?? null;

  function onSubmit(values: RefundFormValues) {
    if (!selected) return; // schema guards this, but TS still needs it
    const trimmed = values.amountDollars.trim();
    let amountCents: number | undefined;
    if (trimmed.length > 0) {
      amountCents = Math.round(Number(trimmed) * 100);
      if (amountCents > selected.amountPaidCents) {
        toast.error("Refund amount cannot exceed the invoice total.");
        return;
      }
    }

    startTransition(async () => {
      const result = await refundInvoiceAction({
        invoiceId: selected.id,
        amountCents,
        reason: values.reason as ReasonValue,
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
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label className={errors.invoiceId ? "text-destructive" : ""}>Invoice</Label>
              <div className="rounded-card border-border max-h-60 space-y-1.5 overflow-y-auto border p-1.5">
                {invoices.map((inv) => (
                  <button
                    key={inv.id}
                    type="button"
                    onClick={() =>
                      setValue("invoiceId", inv.id, { shouldValidate: true, shouldDirty: true })
                    }
                    className={`flex w-full cursor-pointer items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition-colors ${
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
              {errors.invoiceId && (
                <p className="text-sm text-red-500">{errors.invoiceId.message}</p>
              )}
            </div>

            <ControlledInput
              control={control}
              name="amountDollars"
              label="Amount (optional)"
              type="number"
              step="0.01"
              placeholder={
                selected
                  ? `Full (${formatCents(selected.amountPaidCents, selected.currencyCode)})`
                  : "Full refund"
              }
              description="Leave blank to refund the full amount. Enter a smaller amount for a partial refund."
              error={errors.amountDollars}
            />

            <ControlledSelect
              control={control}
              name="reason"
              label="Reason"
              options={REASON_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
              error={errors.reason}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={isPending || loading}
                className="cursor-pointer"
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
          </form>
        )}

        {invoices.length === 0 && !loading && (
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="cursor-pointer"
            >
              Close
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
