"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Users,
  FolderKanban,
  CheckSquare,
  Clock,
  X,
  CornerDownLeft,
} from "lucide-react";
import { Kbd } from "@/components/ui/kbd";
import {
  Command,
  CommandDialog,
  CommandList,
  CommandItem,
  CommandEmpty,
} from "@/components/ui/command";
import { navGroups } from "@/config/navigation";
import { cn } from "@/lib/utils";

// ─── History ─────────────────────────────────────────────────────────────────

const HISTORY_KEY = "cf_search_history";
const MAX_HISTORY = 6;

type HistoryItem = {
  label: string;
  subtitle?: string;
  href: string;
  type: "client" | "project" | "task" | "nav";
};

function loadHistory(): HistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function pushHistory(item: HistoryItem) {
  const prev = loadHistory().filter((h) => h.href !== item.href);
  localStorage.setItem(
    HISTORY_KEY,
    JSON.stringify([item, ...prev].slice(0, MAX_HISTORY)),
  );
}

// ─── Type config ──────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<
  HistoryItem["type"],
  { label: string; badgeClass: string }
> = {
  client: {
    label: "Client",
    badgeClass:
      "bg-blue-500/10 text-blue-600 ring-blue-500/20 dark:text-blue-400",
  },
  project: {
    label: "Project",
    badgeClass:
      "bg-violet-500/10 text-violet-600 ring-violet-500/20 dark:text-violet-400",
  },
  task: {
    label: "Task",
    badgeClass:
      "bg-amber-500/10 text-amber-600 ring-amber-500/20 dark:text-amber-500",
  },
  nav: {
    label: "Page",
    badgeClass: "bg-secondary text-muted-foreground ring-border",
  },
};

function TypeBadge({ type }: { type: HistoryItem["type"] }) {
  const { label, badgeClass } = TYPE_CONFIG[type];
  return (
    <span
      className={cn(
        "shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ring-1 ring-inset",
        badgeClass,
      )}
    >
      {label}
    </span>
  );
}

// ─── Search result types ──────────────────────────────────────────────────────

type SearchResult = {
  clients: { id: string; name: string; company: string | null }[];
  projects: { id: string; name: string; clientName: string; status: string }[];
  tasks: {
    id: string;
    title: string;
    projectName: string | null;
    status: string;
    refNumber: string | null;
  }[];
};

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-3 pb-1.5 pt-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
      {children}
    </p>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const router = useRouter();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load history when dialog opens
  useEffect(() => {
    if (open) setHistory(loadHistory());
  }, [open]);

  // Ctrl+K shortcut
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "k" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query || query.trim().length < 2) {
      setResults(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(query.trim())}`,
        );
        if (res.ok) setResults((await res.json()) as SearchResult);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const navigate = useCallback(
    (href: string, item: HistoryItem) => {
      pushHistory(item);
      setOpen(false);
      setQuery("");
      setResults(null);
      router.push(href);
    },
    [router],
  );

  function removeHistoryItem(href: string) {
    const updated = loadHistory().filter((h) => h.href !== href);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    setHistory(updated);
  }

  function handleClose(val: boolean) {
    setOpen(val);
    if (!val) {
      setQuery("");
      setResults(null);
    }
  }

  const hasResults =
    results &&
    (results.clients.length > 0 ||
      results.projects.length > 0 ||
      results.tasks.length > 0);

  const showEmpty = query.length >= 2 && !loading && !hasResults;
  const showQuickNav = !query;

  // Flatten all result items to identify the first one
  const allResults = results
    ? [
        ...results.clients.map((c) => ({ id: c.id, kind: "client" as const })),
        ...results.projects.map((p) => ({
          id: p.id,
          kind: "project" as const,
        })),
        ...results.tasks.map((t) => ({ id: t.id, kind: "task" as const })),
      ]
    : [];
  const firstResultId = allResults[0]?.id ?? null;

  return (
    <>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-52 cursor-pointer items-center justify-between gap-3 rounded-lg border border-border bg-secondary px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary/80"
      >
        <div className="flex items-center gap-2">
          <Search size={14} />
          <span className="hidden sm:inline">Search...</span>
        </div>
        <Kbd className="hidden border border-cf-neutral-500 bg-background px-2 py-2! sm:inline-flex">
          Ctrl+K
        </Kbd>
      </button>

      {/* Dialog */}
      <CommandDialog
        open={open}
        onOpenChange={handleClose}
        title="Global Search"
        description="Search clients, projects, tasks, and navigate the app"
        className="sm:max-w-2xl top-[16%] translate-y-0 overflow-hidden"
      >
        <Command shouldFilter={false} className="rounded-xl!">
          {/* ── Input row ── */}
          <div className="flex items-center gap-3 border-b border-border px-4 py-3">
            <Search size={16} className="shrink-0 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="What are you looking for?"
              className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
            <Kbd className="shrink-0 border border-border bg-secondary px-2 py-1 text-[11px] text-muted-foreground">
              Esc
            </Kbd>
          </div>

          {/* ── List ── */}
          <CommandList className="max-h-[28rem] overflow-y-auto [scrollbar-width:thin] [&::-webkit-scrollbar]:!block [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border">
            {/* Loading */}
            {loading && (
              <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
                Searching…
              </div>
            )}

            {/* No results */}
            {showEmpty && (
              <CommandEmpty className="py-12">
                <Search
                  size={30}
                  className="mx-auto mb-3 text-muted-foreground/30"
                />
                <p className="text-sm font-medium text-foreground">
                  No results for &quot;{query}&quot;
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Try searching for clients, projects, or tasks
                </p>
              </CommandEmpty>
            )}

            {/* ── Search results ── */}
            {!loading && hasResults && (
              <div className="p-2">
                {results!.clients.length > 0 && (
                  <div className="mb-2">
                    <SectionHeader>Clients</SectionHeader>
                    <div className="space-y-0.5">
                      {results!.clients.map((c) => {
                        const isFirst = c.id === firstResultId;
                        return (
                          <CommandItem
                            key={c.id}
                            onSelect={() =>
                              navigate(`/clients/${c.id}`, {
                                label: c.name,
                                subtitle: c.company ?? undefined,
                                href: `/clients/${c.id}`,
                                type: "client",
                              })
                            }
                            className={cn(
                              "group w-full cursor-pointer rounded-lg px-3 py-2.5",
                              isFirst &&
                                "border border-primary/25 bg-primary/5 ring-0",
                            )}
                          >
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-blue-500/10">
                              <Users
                                size={13}
                                className="text-blue-600 dark:text-blue-400"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium">
                                {c.name}
                              </p>
                              {c.company && (
                                <p className="truncate text-xs text-muted-foreground">
                                  {c.company}
                                </p>
                              )}
                            </div>
                            <TypeBadge type="client" />
                            <CornerDownLeft
                              size={13}
                              className="absolute right-3 shrink-0 opacity-0 group-data-selected:opacity-50"
                            />
                          </CommandItem>
                        );
                      })}
                    </div>
                  </div>
                )}

                {results!.projects.length > 0 && (
                  <>
                    {results!.clients.length > 0 && (
                      <div className="my-2 h-px bg-border" />
                    )}
                    <div className="mb-2">
                      <SectionHeader>Projects</SectionHeader>
                      <div className="space-y-0.5">
                        {results!.projects.map((p) => {
                          const isFirst = p.id === firstResultId;
                          return (
                            <CommandItem
                              key={p.id}
                              onSelect={() =>
                                navigate(`/projects/${p.id}`, {
                                  label: p.name,
                                  subtitle: p.clientName,
                                  href: `/projects/${p.id}`,
                                  type: "project",
                                })
                              }
                              className={cn(
                                "group w-full cursor-pointer rounded-lg px-3 py-2.5",
                                isFirst &&
                                  "border border-primary/25 bg-primary/5",
                              )}
                            >
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-violet-500/10">
                                <FolderKanban
                                  size={13}
                                  className="text-violet-600 dark:text-violet-400"
                                />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium">
                                  {p.name}
                                </p>
                                <p className="truncate text-xs text-muted-foreground">
                                  {p.clientName}
                                </p>
                              </div>
                              <TypeBadge type="project" />
                              <CornerDownLeft
                                size={13}
                                className="absolute right-3 shrink-0 opacity-0 group-data-selected:opacity-50"
                              />
                            </CommandItem>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}

                {results!.tasks.length > 0 && (
                  <>
                    {(results!.clients.length > 0 ||
                      results!.projects.length > 0) && (
                      <div className="my-2 h-px bg-border" />
                    )}
                    <div className="mb-2">
                      <SectionHeader>Tasks</SectionHeader>
                      <div className="space-y-0.5">
                        {results!.tasks.map((t) => {
                          const isFirst = t.id === firstResultId;
                          return (
                            <CommandItem
                              key={t.id}
                              onSelect={() =>
                                navigate(`/tasks?task=${t.refNumber ?? t.id}`, {
                                  label: t.title,
                                  subtitle: t.projectName ?? undefined,
                                  href: `/tasks?task=${t.refNumber ?? t.id}`,
                                  type: "task",
                                })
                              }
                              className={cn(
                                "group w-full cursor-pointer rounded-lg px-3 py-2.5",
                                isFirst &&
                                  "border border-primary/25 bg-primary/5",
                              )}
                            >
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-amber-500/10">
                                <CheckSquare
                                  size={13}
                                  className="text-amber-600 dark:text-amber-500"
                                />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium">
                                  {t.title}
                                </p>
                                {t.projectName && (
                                  <p className="truncate text-xs text-muted-foreground">
                                    {t.projectName}
                                  </p>
                                )}
                              </div>
                              {t.refNumber && (
                                <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                                  #{t.refNumber}
                                </span>
                              )}
                              <TypeBadge type="task" />
                              <CornerDownLeft
                                size={13}
                                className="absolute right-3 shrink-0 opacity-0 group-data-selected:opacity-50"
                              />
                            </CommandItem>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── Quick nav + recent history ── */}
            {showQuickNav && (
              <div className="p-2">
                {/* Recent history */}
                {history.length > 0 && (
                  <>
                    <SectionHeader>Recent</SectionHeader>
                    <div className="mb-2 space-y-0.5">
                      {history.map((item) => (
                        <CommandItem
                          key={item.href}
                          onSelect={() => navigate(item.href, item)}
                          className="group w-full cursor-pointer rounded-lg px-3 py-2.5"
                        >
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-secondary">
                            <Clock
                              size={13}
                              className="text-muted-foreground"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">
                              {item.label}
                            </p>
                            {item.subtitle && (
                              <p className="truncate text-xs text-muted-foreground">
                                {item.subtitle}
                              </p>
                            )}
                          </div>
                          <TypeBadge type={item.type} />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeHistoryItem(item.href);
                            }}
                            className="absolute right-3 flex h-5 w-5 shrink-0 items-center justify-center rounded opacity-0 hover:bg-secondary group-hover:opacity-100 cursor-pointer hover:text-danger"
                          >
                            <X size={11} className="text-muted-foreground" />
                          </button>
                        </CommandItem>
                      ))}
                    </div>
                    <div className="my-2 h-px bg-border" />
                  </>
                )}

                {/* Nav groups - 2-column grid */}
                {navGroups.map((group, i) => (
                  <div key={group.label}>
                    {i > 0 && <div className="my-2 h-px bg-border" />}
                    <SectionHeader>{group.label}</SectionHeader>
                    <div className="grid grid-cols-2 gap-1">
                      {group.items.map((item) => (
                        <CommandItem
                          key={item.href}
                          onSelect={() =>
                            navigate(item.href, {
                              label: item.label,
                              href: item.href,
                              type: "nav",
                            })
                          }
                          className="group w-full cursor-pointer rounded-lg border border-border bg-secondary/40 px-3 py-2.5 data-selected:border-primary/30 data-selected:bg-primary/5"
                        >
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-background">
                            <item.icon
                              size={13}
                              className="text-muted-foreground group-data-selected:text-primary"
                            />
                          </div>
                          <span className="truncate text-sm font-medium">
                            {item.label}
                          </span>
                          <CornerDownLeft
                            size={12}
                            className="absolute right-2.5 shrink-0 opacity-0 group-data-selected:opacity-50"
                          />
                        </CommandItem>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CommandList>

          {/* ── Footer ── */}
          <div className="flex items-center justify-between border-t border-border px-4 py-2.5">
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <Kbd className="px-1 py-0.5 text-[10px]">↑↓</Kbd>
                Navigate
              </span>
              <span className="flex items-center gap-1">
                <Kbd className="px-1 py-0.5 text-[10px]">↵</Kbd>
                Open
              </span>
              <span className="flex items-center gap-1">
                <Kbd className="px-1 py-0.5 text-[10px]">Esc</Kbd>
                Close
              </span>
            </div>
            <span className="text-[11px] text-muted-foreground">
              ClientFlow Search
            </span>
          </div>
        </Command>
      </CommandDialog>
    </>
  );
}
