"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { DatePicker } from "@/components/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { InvoiceLineItem } from "@/lib/invoices";

type ClientOption = { id: string; name: string };

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  clients: ClientOption[];
};

const EMPTY_LINE_ITEM: InvoiceLineItem = {
  description: "",
  quantity: 1,
  unitPriceCents: 0,
};

export function CreateInvoiceDialog({
  open,
  onClose,
  onCreated,
  clients,
}: Props) {
  const [clientId, setClientId] = useState("");
  const [title, setTitle] = useState("");
  const [number, setNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [dueAt, setDueAt] = useState<Date | undefined>(undefined);
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([
    { ...EMPTY_LINE_ITEM },
  ]);
  const [saving, setSaving] = useState(false);

  function addLine() {
    setLineItems((prev) => [...prev, { ...EMPTY_LINE_ITEM }]);
  }

  function removeLine(idx: number) {
    setLineItems((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateLine<K extends keyof InvoiceLineItem>(
    idx: number,
    field: K,
    value: InvoiceLineItem[K],
  ) {
    setLineItems((prev) =>
      prev.map((li, i) => (i === idx ? { ...li, [field]: value } : li)),
    );
  }

  function totalCents(): number {
    return lineItems.reduce(
      (sum, li) => sum + (li.quantity || 0) * (li.unitPriceCents || 0),
      0,
    );
  }

  function formatCents(cents: number): string {
    return (cents / 100).toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
    });
  }

  function reset() {
    setClientId("");
    setTitle("");
    setNumber("");
    setNotes("");
    setDueAt(undefined);
    setLineItems([{ ...EMPTY_LINE_ITEM }]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clientId) {
      toast.error("Select a client.");
      return;
    }
    if (!title.trim()) {
      toast.error("Title is required.");
      return;
    }
    if (lineItems.some((li) => !li.description.trim())) {
      toast.error("All line items need a description.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          title: title.trim(),
          number: number.trim() || undefined,
          notes: notes.trim() || undefined,
          dueAt: dueAt?.toISOString(),
          lineItems,
        }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? "Failed to create invoice.");
      }

      toast.success("Invoice created.");
      reset();
      onCreated();
      onClose();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create invoice.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-x-hidden overflow-y-auto p-6 sm:max-w-3xl lg:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Invoice</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-1">
          {/* Client + Title row */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="inv-client">Client *</Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger
                  className="w-full cursor-pointer"
                  id="inv-client"
                >
                  <SelectValue placeholder="Select client…" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="cursor-pointer">
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="inv-number">Invoice # (auto if blank)</Label>
              <Input
                id="inv-number"
                placeholder="INV-0001"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
              />
            </div>
          </div>

          {/* Due date + Notes */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="inv-due">Due Date</Label>
              <DatePicker
                value={dueAt}
                onChange={setDueAt}
                placeholder="Select due date"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="inv-title">Title *</Label>
            <Input
              id="inv-title"
              placeholder="e.g. Web Design - March 2026"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Line items */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Line Items *</Label>
              <Button type="button" variant="ghost" size="sm" onClick={addLine} className="cursor-pointer">
                <Plus className="mr-1 h-3.5 w-3.5" />
                Add line
              </Button>
            </div>

            <div className="rounded-lg border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">
                      Description
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground w-20">
                      Qty
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground w-28">
                      Unit Price
                    </th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((li, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-border last:border-0"
                    >
                      <td className="px-3 py-2">
                        <Input
                          placeholder="Service description"
                          value={li.description}
                          onChange={(e) =>
                            updateLine(idx, "description", e.target.value)
                          }
                          className="h-8"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          type="number"
                          min="1"
                          value={li.quantity}
                          onChange={(e) =>
                            updateLine(
                              idx,
                              "quantity",
                              Math.max(1, parseInt(e.target.value) || 1),
                            )
                          }
                          className="h-8 w-20"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={li.unitPriceCents / 100 || ""}
                          onChange={(e) =>
                            updateLine(
                              idx,
                              "unitPriceCents",
                              Math.round(
                                parseFloat(e.target.value || "0") * 100,
                              ),
                            )
                          }
                          className="h-8 w-28"
                        />
                      </td>
                      <td className="px-3 py-2">
                        {lineItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeLine(idx)}
                            className="cursor-pointer text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="text-right text-sm font-semibold text-foreground">
              Total: {formatCents(totalCents())}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="inv-notes">Notes</Label>
            <Textarea
              id="inv-notes"
              placeholder="Payment terms, bank details, etc."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saving}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button type="submit" className="cursor-pointer" disabled={saving}>
              {saving ? "Creating…" : "Create Invoice"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
