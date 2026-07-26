import { responsibleDisclosureContent } from "@/data/legalContent";
import { m as Motion } from "framer-motion";

const ResponsibleDisclosurePage = () => {
  const { title, lastUpdated, sections } = responsibleDisclosureContent;
  return (
    <>
      <section className="border-border bg-card border-b">
        <div className="container py-12 md:py-16">
          <Motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mx-auto max-w-3xl"
          >
            <h1 className="font-display text-foreground text-2xl font-bold md:text-3xl">{title}</h1>
            <p className="text-muted-foreground mt-1.5 text-[13px]">Last updated: {lastUpdated}</p>
          </Motion.div>
        </div>
      </section>
      <section className="py-10 md:py-14">
        <div className="container mx-auto max-w-3xl">
          <div className="space-y-6">
            {sections.map((s, i) => (
              <div key={i}>
                <h2 className="font-display text-foreground text-base font-semibold">
                  {s.heading}
                </h2>
                <p className="text-muted-foreground mt-2 text-[13px] leading-relaxed whitespace-pre-line">
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

export default ResponsibleDisclosurePage;
