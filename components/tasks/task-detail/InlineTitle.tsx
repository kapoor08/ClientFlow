"use client";

import { useState, useEffect, useRef } from "react";

export function InlineTitle({ value, onSave }: { value: string; onSave: (v: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  function commit() {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed && trimmed !== value) onSave(trimmed);
    else setDraft(value);
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") {
            setDraft(value);
            setEditing(false);
          }
        }}
        className="text-foreground ring-primary/40 -mx-1 w-full rounded bg-transparent px-1 text-xl font-semibold ring-2 outline-none"
      />
    );
  }

  return (
    <h2
      className="text-foreground hover:bg-secondary/60 -mx-1 cursor-text rounded px-1 text-xl leading-snug font-semibold transition-colors"
      onClick={() => setEditing(true)}
      title="Click to edit"
    >
      {value}
    </h2>
  );
}
