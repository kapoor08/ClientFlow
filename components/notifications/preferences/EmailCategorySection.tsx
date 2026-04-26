"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

type Categories = {
  productOptIn: boolean;
  billingOptIn: boolean;
  marketingOptIn: boolean;
};

type Row = {
  key: keyof Categories;
  title: string;
  desc: string;
};

const ROWS: Row[] = [
  {
    key: "productOptIn",
    title: "Product updates",
    desc: "Day-to-day workflow noise: tasks, comments, mentions, files, portal activity.",
  },
  {
    key: "billingOptIn",
    title: "Billing nudges",
    desc: "Usage warnings and plan suggestions. Critical billing (invoices, failed payments) is always sent.",
  },
  {
    key: "marketingOptIn",
    title: "Announcements & newsletters",
    desc: "Product launches, tips, occasional growth pitches.",
  },
];

export function EmailCategorySection() {
  const [prefs, setPrefs] = useState<Categories | null>(null);
  const [pendingKey, setPendingKey] = useState<keyof Categories | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/notifications/email-categories")
      .then((r) => r.json())
      .then((data) => {
        if (active) setPrefs(data);
      })
      .catch(() => toast.error("Could not load email preferences."));
    return () => {
      active = false;
    };
  }, []);

  async function toggle(key: keyof Categories, value: boolean) {
    if (!prefs) return;
    const previous = prefs;
    setPrefs({ ...prefs, [key]: value });
    setPendingKey(key);
    try {
      const res = await fetch("/api/notifications/email-categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value }),
      });
      if (!res.ok) throw new Error("update failed");
      const next = (await res.json()) as Categories;
      setPrefs(next);
    } catch {
      setPrefs(previous);
      toast.error("Could not update preference. Try again.");
    } finally {
      setPendingKey(null);
    }
  }

  return (
    <div className="border-border bg-card overflow-hidden rounded-xl border">
      <div className="border-border bg-secondary/40 border-b px-4 py-2.5">
        <p className="text-muted-foreground text-xs font-semibold tracking-widest uppercase">
          Email categories
        </p>
        <p className="text-muted-foreground mt-0.5 text-[12px]">
          Coarse opt-out for whole categories of email. Auth, security, and critical billing
          messages always send.
        </p>
      </div>

      {!prefs ? (
        <div className="text-muted-foreground flex items-center justify-center px-4 py-6">
          <Loader2 size={16} className="animate-spin" />
        </div>
      ) : (
        ROWS.map((row, i) => (
          <div
            key={row.key}
            className={`flex items-start justify-between gap-4 px-4 py-3 ${i < ROWS.length - 1 ? "border-border border-b" : ""}`}
          >
            <div>
              <p className="text-foreground text-[13px] font-medium">{row.title}</p>
              <p className="text-muted-foreground mt-0.5 text-[12px]">{row.desc}</p>
            </div>
            <Switch
              checked={prefs[row.key]}
              disabled={pendingKey === row.key}
              onCheckedChange={(v) => toggle(row.key, v)}
              aria-label={row.title}
            />
          </div>
        ))
      )}
    </div>
  );
}
