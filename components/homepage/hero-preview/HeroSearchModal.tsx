"use client";

import { m as Motion, AnimatePresence } from "framer-motion";
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
          <Motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 z-40 bg-black/30 backdrop-blur-[1px]"
            onClick={onClose}
          />

          {/* Modal */}
          <Motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="border-border bg-card absolute top-12 left-1/2 z-50 w-[75%] max-w-md -translate-x-1/2 overflow-hidden rounded-xl border shadow-lg"
          >
            {/* Search input */}
            <div className="border-border flex items-center gap-2 border-b px-3 py-2">
              <Search size={10} className="text-muted-foreground shrink-0" />
              <div className="text-muted-foreground flex-1 text-[11px]">
                What are you looking for?
              </div>
              <button
                type="button"
                onClick={onClose}
                className="border-border bg-secondary text-muted-foreground hover:bg-secondary/70 cursor-pointer rounded border px-1 text-[9px]"
              >
                Esc
              </button>
            </div>

            {/* Quick nav */}
            <div className="hero-preview-scrollbar max-h-48 overflow-y-auto p-2">
              {HERO_NAV_GROUPS.map((group, gi) => (
                <div key={group.label}>
                  {gi > 0 && <div className="bg-border my-1.5 h-px" />}
                  <p className="text-muted-foreground/50 mb-1 px-2 text-[6px] font-bold tracking-widest uppercase">
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
                        className="group border-border bg-secondary/40 hover:border-primary/30 hover:bg-primary/5 flex w-full cursor-pointer items-center gap-1.5 rounded-md border px-2 py-1.5 text-left transition-colors"
                      >
                        <div className="bg-background flex h-4 w-4 shrink-0 items-center justify-center rounded">
                          <Icon
                            size={8}
                            className="text-muted-foreground group-hover:text-primary"
                          />
                        </div>
                        <span className="text-foreground truncate text-[10px] font-medium">
                          {label}
                        </span>
                        <CornerDownLeft
                          size={7}
                          className="text-muted-foreground/30 ml-auto shrink-0 opacity-0 group-hover:opacity-100"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="border-border flex items-center justify-between border-t px-3 py-1.5">
              <div className="text-muted-foreground/50 flex items-center gap-2 text-[9px]">
                <span className="flex items-center gap-0.5">
                  <span className="border-border bg-secondary rounded border px-0.5 text-[6px]">
                    ↑↓
                  </span>
                  Navigate
                </span>
                <span className="flex items-center gap-0.5">
                  <span className="border-border bg-secondary rounded border px-0.5 text-[6px]">
                    ↵
                  </span>
                  Open
                </span>
              </div>
              <span className="text-muted-foreground/40 text-[9px]">ClientFlow Search</span>
            </div>
          </Motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
