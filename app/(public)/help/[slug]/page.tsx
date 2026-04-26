import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { buildMetadata } from "@/lib/seo";
import { KB_ARTICLES, KB_CATEGORY_META, getArticleBySlug } from "@/config/kb-articles";

export function generateStaticParams() {
  return KB_ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article)
    return buildMetadata({
      title: "Article not found",
      description: "The article you're looking for couldn't be found.",
      path: `/help/${slug}`,
    });
  return buildMetadata({
    title: article.title,
    description: article.excerpt,
    path: `/help/${slug}`,
  });
}

export default async function HelpArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) notFound();

  const categoryMeta = KB_CATEGORY_META[article.category];

  return (
    <article className="container mx-auto max-w-3xl py-10 md:py-14">
      <Link
        href="/help"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
      >
        <ArrowLeft size={14} />
        Back to Help Center
      </Link>

      <header className="border-border mt-6 border-b pb-6">
        <p className="text-primary text-[11px] font-semibold tracking-widest uppercase">
          {categoryMeta.title}
        </p>
        <h1 className="font-display text-foreground mt-2 text-2xl font-bold md:text-3xl">
          {article.title}
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">{article.excerpt}</p>
        <p className="text-muted-foreground mt-3 text-[11px]">Last updated {article.updatedAt}</p>
      </header>

      <div className="prose prose-sm prose-neutral dark:prose-invert prose-headings:font-display prose-headings:font-semibold prose-h3:mt-8 prose-h3:mb-3 prose-p:leading-relaxed prose-table:text-sm prose-th:bg-secondary prose-th:px-3 prose-th:py-2 prose-td:px-3 prose-td:py-2 prose-td:border-t prose-td:border-border prose-pre:bg-secondary prose-pre:text-foreground prose-code:text-foreground prose-code:bg-secondary prose-code:rounded prose-code:px-1 prose-code:py-0.5 prose-code:before:content-none prose-code:after:content-none prose-a:text-primary prose-a:no-underline hover:prose-a:underline mt-8 max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{article.body}</ReactMarkdown>
      </div>

      <footer className="border-border mt-12 border-t pt-6 text-center">
        <p className="text-muted-foreground text-sm">
          Was this helpful? Have suggestions?{" "}
          <Link href="/contact" className="text-primary hover:underline">
            Contact support
          </Link>
          .
        </p>
      </footer>
    </article>
  );
}
