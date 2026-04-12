import type { ReactNode } from "react";

type ListPageLayoutProps = {
  title: ReactNode;
  description?: ReactNode;
  /** Button or action rendered top-right, aligned with the title */
  action?: ReactNode;
  children: ReactNode;
};

export function ListPageLayout({
  title,
  description,
  action,
  children,
}: ListPageLayoutProps) {
  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">
            {title}
          </h1>
          {description ? (
            <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {action ? (
          <div className="flex shrink-0 items-center gap-2">{action}</div>
        ) : null}
      </div>
      {children}
    </div>
  );
}
