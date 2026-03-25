export type BoardColumn = {
  id: string;
  name: string;
  color: string;
  columnType: string | null;
  description: string | null;
  position: number;
};

export type BoardColumnsResponse = {
  columns: BoardColumn[];
};

export type CreateColumnData = {
  name: string;
  color: string;
  columnType?: string | null;
  description?: string | null;
};

export type UpdateColumnData = Partial<CreateColumnData>;

export const COLUMN_TYPE_OPTIONS = [
  { value: "none", label: "None (optional)" },
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "testing_qa", label: "Testing / QA" },
  { value: "completed", label: "Completed" },
] as const;

export const PRESET_COLORS = [
  "#71717a", "#3b82f6", "#22c55e", "#f59e0b",
  "#f97316", "#ef4444", "#a855f7", "#ec4899",
];
