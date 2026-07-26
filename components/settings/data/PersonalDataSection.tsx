"use client";

import { useState } from "react";
import { Download, Loader2, Check, Shield } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function PersonalDataSection() {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function handleExport() {
    setState("loading");
    try {
      const res = await fetch("/api/settings/my-data-export");
      if (!res.ok) throw new Error("Export failed.");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const fromHeader = res.headers.get("Content-Disposition")?.match(/filename="([^"]+)"/)?.[1];
      a.download = fromHeader ?? "clientflow-personal-data.json";
      a.click();
      URL.revokeObjectURL(url);
      setState("done");
      setTimeout(() => setState("idle"), 3000);
      toast.success("Your data export is ready.");
    } catch {
      setState("error");
      setTimeout(() => setState("idle"), 3000);
      toast.error("Failed to export your data.");
    }
  }

  return (
    <div className="rounded-card border-border bg-card shadow-cf-1 border">
      <div className="border-border flex items-center gap-2 border-b px-5 py-3.5">
        <Shield size={16} className="text-muted-foreground" />
        <h2 className="text-foreground text-sm font-semibold">Your personal data (GDPR)</h2>
      </div>
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-4">
          <div className="bg-secondary flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
            <Download size={16} className="text-muted-foreground" />
          </div>
          <div>
            <p className="text-foreground text-sm font-medium">Download my data</p>
            <p className="text-muted-foreground text-xs">
              A JSON file containing your account, sessions, notifications, memberships, and
              anything you&apos;ve authored. Security-sensitive fields (tokens, 2FA secrets) are
              redacted.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          disabled={state === "loading"}
          className={
            state === "error" ? "border-danger/50 text-danger cursor-pointer" : "cursor-pointer"
          }
        >
          {state === "loading" ? (
            <>
              <Loader2 size={13} className="mr-1.5 animate-spin" /> Preparing…
            </>
          ) : state === "done" ? (
            <>
              <Check size={13} className="text-success mr-1.5" /> Downloaded
            </>
          ) : state === "error" ? (
            "Error"
          ) : (
            <>
              <Download size={13} className="mr-1.5" /> Download JSON
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
