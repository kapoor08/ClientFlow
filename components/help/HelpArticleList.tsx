import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { KB_ARTICLES } from "@/config/kb-articles";

type Article = (typeof KB_ARTICLES)[number];

/** The rounded list of KB article links, shared by the search + browse views. */
export function HelpArticleList({ articles }: { articles: Article[] }) {
  return (
    <ul className="divide-border border-border bg-card divide-y rounded-xl border">
      {articles.map((a) => (
        <li key={a.slug}>
          <Link
            href={`/help/${a.slug}`}
            className="hover:bg-secondary/40 flex items-start justify-between gap-4 px-4 py-3 transition-colors"
          >
            <div className="min-w-0 flex-1">
              <p className="text-foreground text-sm font-medium">{a.title}</p>
              <p className="text-muted-foreground mt-1 text-xs">{a.excerpt}</p>
            </div>
            <ChevronRight size={16} className="text-muted-foreground mt-1 shrink-0" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
