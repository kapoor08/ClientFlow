import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export type BreadcrumbSegment = {
  label: string;
  href?: string; // omit on the current/last segment
};

type Props = {
  items: BreadcrumbSegment[];
  className?: string;
};

/**
 * Convenience wrapper around the shadcn Breadcrumb primitive - pages pass an
 * ordered list of `{label, href}` segments and the component renders the
 * trail with proper separators and aria-current on the active page. The last
 * item is rendered as `BreadcrumbPage` (non-link) regardless of whether
 * `href` is set.
 */
export function Breadcrumbs({ items, className }: Props) {
  if (!items.length) return null;

  return (
    <Breadcrumb className={className}>
      <BreadcrumbList>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <span key={`${item.label}-${index}`} className="contents">
              <BreadcrumbItem>
                {isLast || !item.href ? (
                  <BreadcrumbPage>{item.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={item.href}>{item.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </span>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
