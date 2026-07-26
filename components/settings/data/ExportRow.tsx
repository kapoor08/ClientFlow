"use client";

import { useState } from "react";
import { Download, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export type ExportItem = {
  label: string;
  description: string;
  icon: React.ElementType;
  endpoint: string;
  filename: string;
};

export function ExportRow({ item }: { item: ExportItem }) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function handleExport() {
    setState("loading");
    try {
      const res = await fetch(item.endpoint);
      if (!res.ok) throw new Error("Export failed.");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = item.filename;
      a.click();
      URL.revokeObjectURL(url);
      setState("done");
      setTimeout(() => setState("idle"), 3000);
      toast.success(`${item.label} exported successfully.`);
    } catch {
      setState("error");
      setTimeout(() => setState("idle"), 3000);
      toast.error(`Failed to export ${item.label.toLowerCase()}.`);
    }
  }

  return (
    <div className="border-border flex items-center justify-between border-b px-5 py-4 last:border-0">
      <div className="flex items-center gap-4">
        <div className="bg-secondary flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
          <item.icon size={16} className="text-muted-foreground" />
        </div>
        <div>
          <p className="text-foreground text-sm font-medium">{item.label}</p>
          <p className="text-muted-foreground text-xs">{item.description}</p>
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
            <Loader2 size={13} className="mr-1.5 animate-spin" /> Exporting…
          </>
        ) : state === "done" ? (
          <>
            <Check size={13} className="text-success mr-1.5" /> Downloaded
          </>
        ) : state === "error" ? (
          "Error"
        ) : (
          <>
            <Download size={13} className="mr-1.5" /> Export CSV
          </>
        )}
      </Button>
    </div>
  );
}
