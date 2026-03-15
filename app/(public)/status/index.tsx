import { incidents, services } from "@/config/status";
import { motion } from "framer-motion";
import { CheckCircle2, AlertTriangle, Clock } from "lucide-react";

const statusIcon = (s: string) => {
  if (s === "operational")
    return <CheckCircle2 size={15} className="text-emerald-500" />;
  if (s === "degraded")
    return <AlertTriangle size={15} className="text-amber-500" />;
  return <Clock size={15} className="text-red-500" />;
};

const StatusPage = () => (
  <>
    <section className="relative overflow-hidden border-b border-border">
      <div className="absolute inset-0 dot-grid dot-grid-fade opacity-40" />
      <div
        className="absolute inset-0"
        style={{ background: "var(--cf-hero-gradient)" }}
      />
      <div className="container relative py-14 md:py-20">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mx-auto max-w-3xl text-center"
        >
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl">
            System Status
          </h1>
          <div className="mx-auto mt-5 inline-flex items-center gap-2 rounded-pill bg-emerald-100 px-4 py-1.5 text-[13px] font-semibold text-emerald-700">
            <CheckCircle2 size={15} />
            All Systems Operational
          </div>
        </motion.div>
      </div>
    </section>

    <section className="py-12 md:py-16">
      <div className="container mx-auto max-w-3xl">
        <h2 className="font-display text-lg font-bold text-foreground">
          Services
        </h2>
        <div className="mt-5 rounded-xl border border-border bg-card overflow-hidden">
          {services.map((s, i) => (
            <div
              key={s.name}
              className={`flex items-center justify-between px-4 py-3 ${i < services.length - 1 ? "border-b border-border" : ""}`}
            >
              <div className="flex items-center gap-2.5">
                {statusIcon(s.status)}
                <span className="text-[13px] font-medium text-foreground">
                  {s.name}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-muted-foreground">
                  {s.uptime} uptime
                </span>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold capitalize text-emerald-700">
                  {s.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>

    <section className="border-t border-border bg-card py-12 md:py-16">
      <div className="container mx-auto max-w-3xl">
        <h2 className="font-display text-lg font-bold text-foreground">
          Recent Incidents
        </h2>
        <div className="mt-5 space-y-3">
          {incidents.map((inc) => (
            <div
              key={inc.title}
              className="rounded-xl border border-border bg-background p-4"
            >
              <div className="flex items-center gap-2">
                <time className="text-[11px] text-muted-foreground">
                  {inc.date}
                </time>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                  {inc.status}
                </span>
              </div>
              <h3 className="mt-1.5 font-display text-sm font-semibold text-foreground">
                {inc.title}
              </h3>
              <p className="mt-1 text-[13px] text-muted-foreground">
                {inc.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  </>
);

export default StatusPage;
