import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type FormPageLayoutProps = {
  title: string;
  description?: string;
  backHref: string;
  backLabel?: string;
  children: ReactNode;
};

export function FormPageLayout({
  title,
  description,
  backHref,
  backLabel = "Back",
  children,
}: FormPageLayoutProps) {
  return (
    <>
      <div className="flex w-full justify-between">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-semibold text-foreground">
            {title}
          </h1>
          {description ? (
            <p className="mt-0.5 text-sm text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        <Link
          href={backHref}
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft size={14} />
          {backLabel}
        </Link>
      </div>
        {children}
    </>
  );
}
