import type { ReactNode } from "react";

export type SortDirection = "asc" | "desc";

export type ColumnDef<T> = {
  /** Unique key - must match the sortable field name when sortable: true */
  key: string;
  header: ReactNode;
  sortable?: boolean;
  cell: (row: T) => ReactNode;
  /** Applied to every <td> in this column */
  className?: string;
  /** Applied to the <th> for this column */
  headerClassName?: string;
  /** Hidden on xs screens (< 640px) */
  hideOnMobile?: boolean;
  /** Hidden on sm screens (< 768px) */
  hideOnTablet?: boolean;
};
