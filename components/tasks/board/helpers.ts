// Maps a task status to whether it belongs under a column of the given type.

export function statusMatchesColumnType(status: string, columnType: string | null): boolean {
  if (!columnType) return false;
  const map: Record<string, string[]> = {
    todo: ["todo", "backlog"],
    in_progress: ["in_progress"],
    testing_qa: ["review", "testing"],
    completed: ["done", "completed"],
  };
  return map[columnType]?.includes(status) ?? false;
}
