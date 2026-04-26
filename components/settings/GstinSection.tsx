"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  initialGstin: string | null;
  initialGstLegalName: string | null;
  initialGstStateCode: string | null;
};

/**
 * India GST registration form. Saving the GSTIN auto-derives the state code
 * from the first two characters; the field is shown read-only after save so
 * admins see what the system inferred. Clearing the GSTIN nulls all three.
 */
export function GstinSection({ initialGstin, initialGstLegalName, initialGstStateCode }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [gstin, setGstin] = useState(initialGstin ?? "");
  const [legalName, setLegalName] = useState(initialGstLegalName ?? "");
  const [saving, setSaving] = useState(false);
  const dirty =
    gstin.trim().toUpperCase() !== (initialGstin ?? "") ||
    legalName.trim() !== (initialGstLegalName ?? "");

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/settings/gst", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gstin: gstin.trim() || null,
          gstLegalName: legalName.trim() || null,
        }),
      });
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(body?.error ?? "Failed to save");
      toast.success("GST details updated.");
      startTransition(() => router.refresh());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-card border-border bg-card shadow-cf-1 border p-6">
      <header className="mb-4">
        <h2 className="font-display text-foreground text-base font-semibold">
          India GST registration
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Required for B2B invoices to claim input tax credit. Saved values are snapshotted onto
          every new invoice for compliance.
        </p>
      </header>

      <form onSubmit={handleSave} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="gst-gstin">GSTIN</Label>
          <Input
            id="gst-gstin"
            placeholder="27AAACR5055K1Z5"
            value={gstin}
            onChange={(e) => setGstin(e.target.value.toUpperCase())}
            maxLength={15}
            className="font-mono"
            autoComplete="off"
          />
          <p className="text-muted-foreground text-xs">
            15 characters. State code is the first two digits.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="gst-legal-name">Legal entity name</Label>
          <Input
            id="gst-legal-name"
            placeholder="Acme Industries Private Limited"
            value={legalName}
            onChange={(e) => setLegalName(e.target.value)}
          />
          <p className="text-muted-foreground text-xs">
            As registered on your GSTIN. Falls back to the organization name on invoices when blank.
          </p>
        </div>

        {initialGstStateCode && (
          <div className="bg-muted/40 text-muted-foreground rounded-md p-3 text-xs">
            Derived state code:{" "}
            <span className="text-foreground font-mono">{initialGstStateCode}</span>
          </div>
        )}

        <div className="flex justify-end">
          <Button type="submit" disabled={saving || !dirty} className="cursor-pointer">
            {saving ? "Saving…" : "Save GST details"}
          </Button>
        </div>
      </form>
    </section>
  );
}
