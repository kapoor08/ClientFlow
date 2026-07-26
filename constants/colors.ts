// Single source of truth for the two user-customizable default colors that were
// previously duplicated as raw hex across server routes, dialogs and forms
// (P2-14). These are default *values* for DB-stored, user-editable colors - not
// theme tokens (those live in globals.css). Swatch-palette arrays and
// recharts/PDF literals are intentionally left as-is.

/** Default kanban column accent color (used when a column has no color set). */
export const DEFAULT_COLUMN_COLOR = "#3b82f6";

/** Default organization brand color (used when branding is unconfigured). */
export const DEFAULT_BRAND_COLOR = "#6366f1";
