import { releases } from "@/config/changelog";
import { motion } from "framer-motion";
import { Tag } from "lucide-react";

const typeBadge: Record<string, string> = {
  feature: "bg-emerald-100 text-emerald-700",
  improvement: "bg-blue-100 text-blue-700",
  fix: "bg-amber-100 text-amber-700",
};

const ChangelogPage = () => (
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
            Changelog
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
            Product updates, new features, and improvements.
          </p>
        </motion.div>
      </div>
    </section>

    <section className="py-12 md:py-16">
      <div className="container mx-auto max-w-3xl">
        <div className="relative space-y-10 before:absolute before:left-1.75 before:top-2 before:h-[calc(100%-16px)] before:w-px before:bg-border">
          {releases.map((r) => (
            <motion.div
              key={r.version}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative pl-7"
            >
              <div className="absolute left-0 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-primary bg-card" />
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 font-mono text-[11px] font-bold text-primary">
                  <Tag size={11} /> v{r.version}
                </span>
                <time className="text-[11px] text-muted-foreground">
                  {r.date}
                </time>
              </div>
              <ul className="mt-3 space-y-1.5">
                {r.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-[13px]">
                    <span
                      className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${typeBadge[item.type]}`}
                    >
                      {item.type}
                    </span>
                    <span className="text-foreground">{item.text}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  </>
);

export default ChangelogPage;
