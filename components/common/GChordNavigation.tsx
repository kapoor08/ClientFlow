"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/**
 * Vim-style two-key navigation chords. Press `g` then a target key within
 * 1.2 s to jump:
 *   g d  → /dashboard
 *   g c  → /clients
 *   g p  → /projects
 *   g t  → /tasks
 *   g i  → /invoices
 *
 * Skips when the user is typing in an editable element so a "g" inside a
 * comment doesn't yank them away mid-sentence.
 *
 * Mounted once globally in the protected layout.
 */

const CHORD_TIMEOUT_MS = 1200;

const TARGETS: Record<string, string> = {
  d: "/dashboard",
  c: "/clients",
  p: "/projects",
  t: "/tasks",
  i: "/invoices",
};

function isEditableElement(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  if (el.isContentEditable) return true;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

export function GChordNavigation() {
  const router = useRouter();
  const armedRef = useRef<number | null>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      // Modifier keys would mean ⌘G / Ctrl-G / Alt-G - leave those to the browser.
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isEditableElement(e.target)) return;

      const key = e.key.toLowerCase();

      if (armedRef.current && Date.now() < armedRef.current) {
        const target = TARGETS[key];
        armedRef.current = null;
        if (target) {
          e.preventDefault();
          router.push(target);
        }
        return;
      }

      if (key === "g") {
        armedRef.current = Date.now() + CHORD_TIMEOUT_MS;
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [router]);

  return null;
}
