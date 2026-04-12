"use client";

import Link from "next/link";
import { Sparkles, X } from "lucide-react";
import { useState } from "react";

export function TrialBanner({ daysLeft }: { daysLeft: number }) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const urgency = daysLeft <= 3;

  return (
    <div
      className={`flex items-center justify-between gap-3 px-4 py-2 text-xs font-medium ${
        urgency
          ? "bg-danger/10 text-danger border-b border-danger/20"
          : "bg-warning/10 text-warning border-b border-warning/20"
      }`}
    >
      <div className="flex items-center gap-2">
        <Sparkles size={13} className="shrink-0" />
        <span>
          {daysLeft <= 0
            ? "Your free trial has expired."
            : `${daysLeft} day${daysLeft === 1 ? "" : "s"} left in your free trial.`}{" "}
          <Link href="/plans" className="underline underline-offset-2 font-semibold hover:opacity-80">
            Upgrade now
          </Link>{" "}
          to keep full access.
        </span>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 rounded p-0.5 hover:bg-black/10 cursor-pointer"
        aria-label="Dismiss"
      >
        <X size={13} />
      </button>
    </div>
  );
}
