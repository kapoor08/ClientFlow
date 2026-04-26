"use client";

import { incidents, services } from "@/config/status";
import { motion } from "framer-motion";
import { CheckCircle2, AlertTriangle, Clock, MinusCircle } from "lucide-react";

const statusIcon = (s: string) => {
  if (s === "operational") return <CheckCircle2 size={15} className="text-emerald-500" />;
  if (s === "degraded") return <AlertTriangle size={15} className="text-amber-500" />;
  if (s === "unmonitored") return <MinusCircle size={15} className="text-muted-foreground" />;
  return <Clock size={15} className="text-red-500" />;
};

type Probe = { ok: boolean; latencyMs: number; skipped?: boolean };

type Props = {
  dbHealth?: Probe;
  stripeHealth?: Probe;
  resendHealth?: Probe;
};

function probeToStatus(p: Probe | undefined): string {
  if (!p) return "operational";
  if (p.skipped) return "unmonitored";
  return p.ok ? "operational" : "degraded";
}

const StatusPage = ({ dbHealth, stripeHealth, resendHealth }: Props) => {
  // Overall pill goes amber if any *monitored* upstream is down. An unmonitored
  // (no API key configured) probe is neutral and doesn't affect overall state.
  const probes: Array<{ name: string; probe: Probe | undefined }> = [
    { name: "db", probe: dbHealth },
    { name: "stripe", probe: stripeHealth },
    { name: "resend", probe: resendHealth },
  ];
  const anyMonitoredDown = probes.some(({ probe }) => probe && !probe.skipped && !probe.ok);
  const overallStatus = anyMonitoredDown ? "Investigating an issue" : "All Systems Operational";
  const pillClass = anyMonitoredDown
    ? "bg-amber-100 text-amber-700"
    : "bg-emerald-100 text-emerald-700";

  // Map live probes onto the matching marketing rows. Anything not probed
  // keeps its config-defined value.
  const apiOk = dbHealth?.ok ?? true;
  const stripeStatus = probeToStatus(stripeHealth);
  const resendStatus = probeToStatus(resendHealth);

  const liveServices = services.map((s) => {
    if (s.name === "Web Application" || s.name === "REST API") {
      return { ...s, status: apiOk ? "operational" : "degraded" };
    }
    if (s.name === "Billing & Payments") {
      return { ...s, status: stripeStatus };
    }
    if (s.name === "Email Notifications") {
      return { ...s, status: resendStatus };
    }
    return s;
  });

  return (
    <>
      <section className="border-border relative overflow-hidden border-b">
        <div className="dot-grid dot-grid-fade absolute inset-0 opacity-40" />
        <div className="absolute inset-0" style={{ background: "var(--cf-hero-gradient)" }} />
        <div className="relative container py-14 md:py-20">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mx-auto max-w-3xl text-center"
          >
            <h1 className="font-display text-foreground text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
              System Status
            </h1>
            <div
              className={`rounded-pill mx-auto mt-5 inline-flex items-center gap-2 px-4 py-1.5 text-[13px] font-semibold ${pillClass}`}
            >
              {anyMonitoredDown ? <AlertTriangle size={15} /> : <CheckCircle2 size={15} />}
              {overallStatus}
            </div>
            {dbHealth ? (
              <p className="text-muted-foreground mt-3 text-[11px]">
                Database round-trip: {dbHealth.latencyMs}ms · refreshed every 60s
              </p>
            ) : null}
          </motion.div>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="container mx-auto max-w-3xl">
          <h2 className="font-display text-foreground text-lg font-bold">Services</h2>
          <div className="border-border bg-card mt-5 overflow-hidden rounded-xl border">
            {liveServices.map((s, i) => (
              <div
                key={s.name}
                className={`flex items-center justify-between px-4 py-3 ${i < liveServices.length - 1 ? "border-border border-b" : ""}`}
              >
                <div className="flex items-center gap-2.5">
                  {statusIcon(s.status)}
                  <span className="text-foreground text-[13px] font-medium">{s.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground text-[11px]">{s.uptime} uptime</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${
                      s.status === "operational"
                        ? "bg-emerald-100 text-emerald-700"
                        : s.status === "unmonitored"
                          ? "bg-muted text-muted-foreground"
                          : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {s.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-border bg-card border-t py-12 md:py-16">
        <div className="container mx-auto max-w-3xl">
          <h2 className="font-display text-foreground text-lg font-bold">Recent Incidents</h2>
          <div className="mt-5 space-y-3">
            {incidents.map((inc) => (
              <div key={inc.title} className="border-border bg-background rounded-xl border p-4">
                <div className="flex items-center gap-2">
                  <time className="text-muted-foreground text-[11px]">{inc.date}</time>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                    {inc.status}
                  </span>
                </div>
                <h3 className="font-display text-foreground mt-1.5 text-sm font-semibold">
                  {inc.title}
                </h3>
                <p className="text-muted-foreground mt-1 text-[13px]">{inc.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default StatusPage;
