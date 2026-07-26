import { CheckCircle2, AlertTriangle, XCircle, Wrench } from "lucide-react";
import type { BannerState } from "@/server/status/queries";
import { formatRelative } from "./format";

const BANNER_CONFIG: Record<
  BannerState,
  {
    title: string;
    subtitle: string;
    icon: typeof CheckCircle2;
    bgClass: string;
    borderClass: string;
    iconClass: string;
  }
> = {
  operational: {
    title: "All Systems Operational",
    subtitle: "All ClientFlow services are responding normally.",
    icon: CheckCircle2,
    bgClass: "bg-emerald-500/5",
    borderClass: "border-emerald-500/20",
    iconClass: "text-emerald-500",
  },
  degraded: {
    title: "Some Systems Degraded",
    subtitle:
      "One or more services are responding slowly or returning intermittent errors. Investigation in progress.",
    icon: AlertTriangle,
    bgClass: "bg-amber-500/5",
    borderClass: "border-amber-500/20",
    iconClass: "text-amber-500",
  },
  outage: {
    title: "Major Outage",
    subtitle:
      "One or more services are currently unavailable. Our team is actively working on a fix.",
    icon: XCircle,
    bgClass: "bg-red-500/5",
    borderClass: "border-red-500/20",
    iconClass: "text-red-500",
  },
  maintenance: {
    title: "Scheduled Maintenance",
    subtitle: "Planned maintenance is in progress. Some services may be briefly unavailable.",
    icon: Wrench,
    bgClass: "bg-sky-500/5",
    borderClass: "border-sky-500/20",
    iconClass: "text-sky-500",
  },
};

export function StatusBanner({
  state,
  lastUpdate,
}: {
  state: BannerState;
  lastUpdate: Date | null;
}) {
  const conf = BANNER_CONFIG[state];
  const Icon = conf.icon;

  return (
    <section
      className={`rounded-2xl border ${conf.borderClass} ${conf.bgClass} p-6`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-4">
        <Icon size={28} className={`mt-0.5 shrink-0 ${conf.iconClass}`} aria-hidden />
        <div className="min-w-0 flex-1">
          <h1 className="text-foreground text-2xl font-semibold">{conf.title}</h1>
          <p className="text-muted-foreground mt-1 text-sm">{conf.subtitle}</p>
          {lastUpdate ? (
            <p className="text-muted-foreground mt-3 text-xs">
              Last checked {formatRelative(lastUpdate)}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
