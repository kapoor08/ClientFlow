"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Search, CornerDownLeft } from "lucide-react";
import { HERO_NAV_GROUPS } from "./data";

type HeroSearchModalProps = {
  open: boolean;
  onClose: () => void;
  onNavigate: (href: string) => void;
};

export function HeroSearchModal({ open, onClose, onNavigate }: HeroSearchModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 z-40 bg-black/30 backdrop-blur-[1px]"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="absolute left-1/2 top-12 z-50 w-[75%] max-w-md -translate-x-1/2 overflow-hidden rounded-xl border border-border bg-card shadow-lg"
          >
            {/* Search input */}
            <div className="flex items-center gap-2 border-b border-border px-3 py-2">
              <Search size={10} className="shrink-0 text-muted-foreground" />
              <div className="flex-1 text-[11px] text-muted-foreground">
                What are you looking for?
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded border border-border bg-secondary px-1 text-[9px] text-muted-foreground cursor-pointer hover:bg-secondary/70"
              >
                Esc
              </button>
            </div>

            {/* Quick nav */}
            <div className="hero-preview-scrollbar max-h-48 overflow-y-auto p-2">
              {HERO_NAV_GROUPS.map((group, gi) => (
                <div key={group.label}>
                  {gi > 0 && <div className="my-1.5 h-px bg-border" />}
                  <p className="mb-1 px-2 text-[6px] font-bold uppercase tracking-widest text-muted-foreground/50">
                    {group.label}
                  </p>
                  <div className="grid grid-cols-2 gap-0.5">
                    {group.items.map(({ icon: Icon, label, href }) => (
                      <button
                        key={href}
                        type="button"
                        onClick={() => {
                          onNavigate(href);
                          onClose();
                        }}
                        className="group flex w-full cursor-pointer items-center gap-1.5 rounded-md border border-border bg-secondary/40 px-2 py-1.5 text-left transition-colors hover:border-primary/30 hover:bg-primary/5"
                      >
                        <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded bg-background">
                          <Icon size={8} className="text-muted-foreground group-hover:text-primary" />
                        </div>
                        <span className="truncate text-[10px] font-medium text-foreground">
                          {label}
                        </span>
                        <CornerDownLeft
                          size={7}
                          className="ml-auto shrink-0 text-muted-foreground/30 opacity-0 group-hover:opacity-100"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-border px-3 py-1.5">
              <div className="flex items-center gap-2 text-[9px] text-muted-foreground/50">
                <span className="flex items-center gap-0.5">
                  <span className="rounded border border-border bg-secondary px-0.5 text-[6px]">↑↓</span>
                  Navigate
                </span>
                <span className="flex items-center gap-0.5">
                  <span className="rounded border border-border bg-secondary px-0.5 text-[6px]">↵</span>
                  Open
                </span>
              </div>
              <span className="text-[9px] text-muted-foreground/40">ClientFlow Search</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
