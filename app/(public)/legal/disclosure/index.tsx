import { disclosureContent } from "@/data/legalContent";
import { motion } from "framer-motion";

const DisclosurePage = () => {
  const { title, lastUpdated, sections } = disclosureContent;
  return (
    <>
      <section className="border-b border-border bg-card">
        <div className="container py-12 md:py-16">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mx-auto max-w-3xl"
          >
            <h1 className="font-display text-2xl font-bold text-foreground md:text-3xl">
              {title}
            </h1>
            <p className="mt-1.5 text-[13px] text-muted-foreground">
              Last updated: {lastUpdated}
            </p>
          </motion.div>
        </div>
      </section>
      <section className="py-10 md:py-14">
        <div className="container mx-auto max-w-3xl">
          <div className="space-y-6">
            {sections.map((s, i) => (
              <div key={i}>
                <h2 className="font-display text-base font-semibold text-foreground">
                  {s.heading}
                </h2>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground whitespace-pre-line">
                  {s.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default DisclosurePage;
