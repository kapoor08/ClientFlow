"use client";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useMotionStagger } from "@/hooks/use-home-motion";
import { posts } from "@/config/blogs";

const BlogPage = () => {
  const motionStagger = useMotionStagger({
    step: 0.05,
    initialY: 10,
    duration: 0.3,
  });

  return (
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
              Blog
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
              Insights on agency management, product updates, and best
              practices.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            variants={motionStagger.container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid gap-4 md:grid-cols-2"
          >
            {posts.map((post) => (
              <motion.article
                key={post.title}
                variants={motionStagger.item}
                className="flex flex-col rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-cf-2"
              >
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 font-semibold text-primary">
                    {post.category}
                  </span>
                  <span>{post.date}</span>
                  <span>· {post.readTime}</span>
                </div>
                <h2 className="mt-2.5 flex-1 font-display text-sm font-semibold text-foreground">
                  {post.title}
                </h2>
                <p className="mt-1.5 text-[13px] text-muted-foreground">
                  {post.excerpt}
                </p>
                <Link
                  href={post.slug}
                  className="mt-3 inline-flex items-center text-[13px] font-semibold text-primary hover:underline"
                >
                  Read More <ArrowRight size={13} className="ml-1" />
                </Link>
              </motion.article>
            ))}
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default BlogPage;
