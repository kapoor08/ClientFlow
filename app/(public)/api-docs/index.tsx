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
          <div className="mb-4 inline-flex items-center gap-2 rounded-pill border border-border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-cf-1">
            <Code size={14} className="text-primary" />
            REST API v1
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl">
            API Documentation
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
            Build custom integrations with the ClientFlow REST API. Full CRUD
            operations for all core resources.
          </p>
          <div className="mt-4 inline-block rounded-lg bg-card border border-border px-4 py-2 font-mono text-sm text-foreground shadow-cf-1">
            Base URL: https://api.clientflow.io/v1
          </div>
        </motion.div>
      </div>
    </section>

    <section className="py-12 md:py-16">
      <div className="container">
        <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <h2 className="font-display text-lg font-bold text-foreground">
              Endpoints
            </h2>
            <div className="mt-5 space-y-2">
              {endpoints.map((ep) => (
                <div
                  key={ep.method + ep.path}
                  className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/30"
                >
                  <span
                    className={`rounded px-2 py-0.5 font-mono text-[11px] font-bold ${methodColors[ep.method]}`}
                  >
                    {ep.method}
                  </span>
                  <div>
                    <code className="font-mono text-[13px] text-foreground">
                      {ep.path}
                    </code>
                    <p className="mt-0.5 text-[13px] text-muted-foreground">
                      {ep.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="font-display text-lg font-bold text-foreground">
              Features
            </h2>
            <div className="mt-5 space-y-3">
              {features.map((f) => (
                <div
                  key={f.title}
                  className="rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/30"
                >
                  <div className="flex items-center gap-2">
                    <f.icon size={15} className="text-primary" />
                    <h3 className="font-display text-[13px] font-semibold text-foreground">
                      {f.title}
                    </h3>
                  </div>
                  <p className="mt-1 text-[13px] text-muted-foreground">
                    {f.desc}
                  </p>
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
