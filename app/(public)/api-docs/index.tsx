"use client";
import { endpoints, features } from "@/config/api-docs";
import { motion } from "framer-motion";
import { Code } from "lucide-react";

const methodColors: Record<string, string> = {
  GET: "bg-emerald-100 text-emerald-700",
  POST: "bg-blue-100 text-blue-700",
  PATCH: "bg-amber-100 text-amber-700",
  DELETE: "bg-red-100 text-red-700",
};

const ApiDocsPage = () => (
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
          <div className="rounded-pill border-border bg-card text-muted-foreground shadow-cf-1 mb-4 inline-flex items-center gap-2 border px-4 py-1.5 text-xs font-medium">
            <Code size={14} className="text-primary" />
            REST API v1
          </div>
          <h1 className="font-display text-foreground text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            API Documentation
          </h1>
          <p className="text-muted-foreground mx-auto mt-4 max-w-xl text-base">
            Read clients, projects, tasks, and invoices over a Bearer-token REST API. Generate keys
            from Settings &rarr; Developer.
          </p>
          <div className="bg-card border-border text-foreground shadow-cf-1 mt-4 inline-block rounded-lg border px-4 py-2 font-mono text-sm">
            Base URL: https://www.client-flow.in
          </div>
        </motion.div>
      </div>
    </section>

    <section className="py-12 md:py-16">
      <div className="container">
        <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <h2 className="font-display text-foreground text-lg font-bold">Endpoints</h2>
            <div className="mt-5 space-y-2">
              {endpoints.map((ep) => (
                <div
                  key={ep.method + ep.path}
                  className="border-border bg-card hover:border-primary/30 flex items-start gap-3 rounded-xl border p-4 transition-all"
                >
                  <span
                    className={`rounded px-2 py-0.5 font-mono text-[11px] font-bold ${methodColors[ep.method]}`}
                  >
                    {ep.method}
                  </span>
                  <div>
                    <code className="text-foreground font-mono text-[13px]">{ep.path}</code>
                    <p className="text-muted-foreground mt-0.5 text-[13px]">{ep.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="font-display text-foreground text-lg font-bold">Features</h2>
            <div className="mt-5 space-y-3">
              {features.map((f) => (
                <div
                  key={f.title}
                  className="border-border bg-card hover:border-primary/30 rounded-xl border p-4 transition-all"
                >
                  <div className="flex items-center gap-2">
                    <f.icon size={15} className="text-primary" />
                    <h3 className="font-display text-foreground text-[13px] font-semibold">
                      {f.title}
                    </h3>
                  </div>
                  <p className="text-muted-foreground mt-1 text-[13px]">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  </>
);

export default ApiDocsPage;
