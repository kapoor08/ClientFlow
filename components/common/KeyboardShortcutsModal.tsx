"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * Global "?" keyboard-shortcut help overlay. Mounted once near the root of
 * the protected layout. Renders nothing until the user presses `?` outside
 * an editable element.
 *
 * Adding a new shortcut: append to SHORTCUTS below. The list is grouped so
 * the modal stays scannable as the surface grows.
 */

type Shortcut = { keys: string[]; label: string };
type ShortcutGroup = { title: string; items: Shortcut[] };

const SHORTCUTS: ShortcutGroup[] = [
  {
    title: "Global",
    items: [
      { keys: ["?"], label: "Open this shortcut help" },
      { keys: ["⌘", "K"], label: "Open command palette / global search" },
      { keys: ["Esc"], label: "Close any open dialog or popover" },
    ],
  },
  {
    title: "Navigation",
    items: [
      { keys: ["G", "D"], label: "Go to Dashboard" },
      { keys: ["G", "C"], label: "Go to Clients" },
      { keys: ["G", "P"], label: "Go to Projects" },
      { keys: ["G", "T"], label: "Go to Tasks" },
      { keys: ["G", "I"], label: "Go to Invoices" },
    ],
  },
  {
    title: "Editing",
    items: [
      { keys: ["⌘", "Enter"], label: "Submit current form" },
      { keys: ["⌘", "S"], label: "Save (where supported)" },
    ],
  },
];

function isEditableElement(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  if (el.isContentEditable) return true;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

export function KeyboardShortcutsModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "?") return;
      // Don't hijack `?` inside text inputs - it's a legitimate character.
      if (isEditableElement(e.target)) return;
      // `?` typically requires Shift on US layout - that's fine, we just key
      // off the resolved character.
      e.preventDefault();
      setOpen(true);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
          <DialogDescription>
            Press{" "}
            <kbd className="bg-muted rounded border px-1.5 py-0.5 font-mono text-[10px]">?</kbd>{" "}
            anywhere to reopen this list.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] space-y-5 overflow-y-auto">
          {SHORTCUTS.map((group) => (
            <div key={group.title}>
              <p className="text-muted-foreground mb-2 text-[11px] font-semibold tracking-wide uppercase">
                {group.title}
              </p>
              <ul className="divide-border divide-y rounded-md border">
                {group.items.map((s, i) => (
                  <li
                    key={`${group.title}-${i}`}
                    className="flex items-center justify-between px-3 py-2 text-xs"
                  >
                    <span className="text-foreground/80">{s.label}</span>
                    <span className="flex items-center gap-1">
                      {s.keys.map((k, ki) => (
                        <kbd
                          key={ki}
                          className="bg-muted text-foreground rounded border px-1.5 py-0.5 font-mono text-[10px]"
                        >
                          {k}
                        </kbd>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
