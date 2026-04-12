"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/utils/cn";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { http } from "@/core/infrastructure";
import { Check, ChevronDown, X } from "lucide-react";
import {
  TASK_FILTER_STATUS_OPTIONS as STATUS_OPTIONS,
  TASK_PRIORITY_OPTIONS as PRIORITY_OPTIONS,
  TASK_TAG_OPTIONS,
} from "@/constants/task";
import { getInitials } from "@/utils/user";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type ExtendedFilters = {
  projectId?: string;
  priority?: string;
  assigneeUserIds?: string[];
  statuses?: string[];
  dueDateRange?: { from?: Date; to?: Date };
  tags?: string[];
};

type FiltersDrawerProps = {
  open: boolean;
  onClose: () => void;
  filters: ExtendedFilters;
  onChange: (filters: ExtendedFilters) => void;
};

type ProjectOption = { id: string; name: string };
type MemberOption = { userId: string; name: string; email: string };

// ─── Constants ────────────────────────────────────────────────────────────────

const TAG_OPTIONS = TASK_TAG_OPTIONS;

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </h3>
  );
}

/** Generic multi-select popover built on Command */
function MultiSelectPopover({
  options,
  selected,
  onToggle,
  placeholder,
  searchable = false,
}: {
  options: { value: string; label: string }[];
  selected: string[];
  onToggle: (value: string) => void;
  placeholder: string;
  searchable?: boolean;
}) {
  const [open, setOpen] = useState(false);

  const label =
    selected.length === 0
      ? placeholder
      : selected.length === 1
        ? (options.find((o) => o.value === selected[0])?.label ?? selected[0])
        : `${selected.length} selected`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex h-9 w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm transition-colors cursor-pointer hover:border-foreground/50",
            selected.length > 0 ? "text-foreground" : "text-muted-foreground",
          )}
        >
          <span className="truncate">{label}</span>
          <ChevronDown size={14} className="shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0" align="start">
        <Command>
          {searchable && <CommandInput placeholder="Search…" className="h-8 text-xs" />}
          <CommandList>
            <CommandEmpty>No options found.</CommandEmpty>
            <CommandGroup>
              {options.map((opt) => {
                const isSelected = selected.includes(opt.value);
                return (
                  <CommandItem
                    key={opt.value}
                    value={opt.value}
                    onSelect={() => onToggle(opt.value)}
                    className="cursor-pointer gap-2"
                  >
                    <div className={cn(
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                      isSelected ? "border-primary bg-primary text-primary-foreground" : "border-border",
                    )}>
                      {isSelected && <Check size={10} />}
                    </div>
                    {opt.label}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

/** Selected value chips row shown below a multi-select */
function SelectedChips({
  options,
  selected,
  onRemove,
}: {
  options: { value: string; label: string }[];
  selected: string[];
  onRemove: (value: string) => void;
}) {
  if (!selected.length) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-1.5">
      {selected.map((val) => {
        const label = options.find((o) => o.value === val)?.label ?? val;
        return (
          <span
            key={val}
            className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary"
          >
            {label}
            <button type="button" onClick={() => onRemove(val)} className="cursor-pointer hover:text-danger">
              <X size={10} />
            </button>
          </span>
        );
      })}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function FiltersDrawer({
  open,
  onClose,
  filters,
  onChange,
}: FiltersDrawerProps) {
  const [memberSearch, setMemberSearch] = useState("");
  const [assigneeOpen, setAssigneeOpen] = useState(false);

  const { data: projectsData } = useQuery({
    queryKey: ["projects-filter-list"],
    queryFn: () => http<{ projects: ProjectOption[] }>("/api/projects?pageSize=100"),
    enabled: open,
    staleTime: 60 * 1000,
  });

  const { data: teamData } = useQuery({
    queryKey: ["team-filter-list"],
    queryFn: () => http<{ members: MemberOption[] }>("/api/team"),
    enabled: open,
    staleTime: 60 * 1000,
  });

  const projects = projectsData?.projects ?? [];
  const allMembers = teamData?.members ?? [];
  const filteredMembers = memberSearch
    ? allMembers.filter(
        (m) =>
          m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
          m.email.toLowerCase().includes(memberSearch.toLowerCase()),
      )
    : allMembers;

  // ── Handlers ─────────────────────────────────────────────────────────────────

  function handleProjectChange(value: string) {
    onChange({ ...filters, projectId: value === "all" ? undefined : value });
  }

  function handlePriorityChange(value: string) {
    onChange({ ...filters, priority: value === "all" ? undefined : value });
  }

  function toggleStatus(value: string) {
    const current = filters.statuses ?? [];
    const next = current.includes(value) ? current.filter((s) => s !== value) : [...current, value];
    onChange({ ...filters, statuses: next.length ? next : undefined });
  }

  function toggleTag(value: string) {
    const current = filters.tags ?? [];
    const next = current.includes(value) ? current.filter((t) => t !== value) : [...current, value];
    onChange({ ...filters, tags: next.length ? next : undefined });
  }

  function toggleAssignee(userId: string) {
    const current = filters.assigneeUserIds ?? [];
    const next = current.includes(userId) ? current.filter((id) => id !== userId) : [...current, userId];
    onChange({ ...filters, assigneeUserIds: next.length ? next : undefined });
  }

  function handleClearAll() {
    onChange({});
    setMemberSearch("");
  }

  const hasActiveFilters =
    !!filters.priority ||
    !!filters.projectId ||
    (filters.assigneeUserIds?.length ?? 0) > 0 ||
    (filters.statuses?.length ?? 0) > 0 ||
    !!(filters.dueDateRange?.from || filters.dueDateRange?.to) ||
    (filters.tags?.length ?? 0) > 0;

  const assigneeLabels = (filters.assigneeUserIds ?? []).map((id) => {
    const m = allMembers.find((m) => m.userId === id);
    return m?.name ?? id;
  });

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-80 sm:w-96 overflow-y-auto">
        <SheetHeader className="pb-4 border-b border-border">
          <SheetTitle>Filters</SheetTitle>
        </SheetHeader>

        <div className="p-5 space-y-5">

          {/* Project + Priority - same row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <SectionLabel>Project</SectionLabel>
              <Select value={filters.projectId ?? "all"} onValueChange={handleProjectChange}>
                <SelectTrigger className="cursor-pointer w-full">
                  <SelectValue placeholder="All projects" />
                </SelectTrigger>
                <SelectContent position="popper" side="bottom" align="start">
                  <SelectItem value="all" className="cursor-pointer">All</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id} className="cursor-pointer">
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <SectionLabel>Priority</SectionLabel>
              <Select value={filters.priority ?? "all"} onValueChange={handlePriorityChange}>
                <SelectTrigger className="cursor-pointer w-full">
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent position="popper" side="bottom" align="start">
                  <SelectItem value="all" className="cursor-pointer">Any</SelectItem>
                  {PRIORITY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="cursor-pointer">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Status - multi-select dropdown */}
          <div className="space-y-1.5">
            <SectionLabel>Status</SectionLabel>
            <MultiSelectPopover
              options={STATUS_OPTIONS}
              selected={filters.statuses ?? []}
              onToggle={toggleStatus}
              placeholder="Any status"
            />
            <SelectedChips
              options={STATUS_OPTIONS}
              selected={filters.statuses ?? []}
              onRemove={toggleStatus}
            />
          </div>

          {/* Due Date - date range picker */}
          <div className="space-y-1.5">
            <SectionLabel>Due Date</SectionLabel>
            <div className="[&>button]:w-full">
              <DateRangePicker
                initialDateFrom={filters.dueDateRange?.from}
                initialDateTo={filters.dueDateRange?.to}
                onUpdate={({ range }) =>
                  onChange({
                    ...filters,
                    dueDateRange:
                      range.from || range.to
                        ? { from: range.from, to: range.to }
                        : undefined,
                  })
                }
                align="start"
              />
            </div>
          </div>

          {/* Tags - multi-select dropdown */}
          <div className="space-y-1.5">
            <SectionLabel>Tags</SectionLabel>
            <MultiSelectPopover
              options={TAG_OPTIONS}
              selected={filters.tags ?? []}
              onToggle={toggleTag}
              placeholder="Any tag"
            />
            <SelectedChips
              options={TAG_OPTIONS}
              selected={filters.tags ?? []}
              onRemove={toggleTag}
            />
          </div>

          {/* Assignee - popover with search, avatar, name, email */}
          <div className="space-y-1.5">
            <SectionLabel>Assignee</SectionLabel>
            <Popover open={assigneeOpen} onOpenChange={setAssigneeOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "flex h-9 w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm transition-colors cursor-pointer hover:border-foreground/50",
                    (filters.assigneeUserIds?.length ?? 0) > 0
                      ? "text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  <span className="truncate">
                    {(filters.assigneeUserIds?.length ?? 0) === 0
                      ? "Any assignee"
                      : filters.assigneeUserIds!.length === 1
                        ? (assigneeLabels[0] ?? "1 selected")
                        : `${filters.assigneeUserIds!.length} selected`}
                  </span>
                  <ChevronDown size={14} className="shrink-0 text-muted-foreground" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-2" align="start">
                <Input
                  placeholder="Search members…"
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  className="mb-2 h-8 text-xs"
                />
                <div className="max-h-52 overflow-y-auto space-y-0.5">
                  {filteredMembers.length === 0 && (
                    <p className="py-3 text-center text-xs text-muted-foreground">
                      No members found.
                    </p>
                  )}
                  {filteredMembers.map((m) => {
                    const isSelected = (filters.assigneeUserIds ?? []).includes(m.userId);
                    return (
                      <button
                        key={m.userId}
                        type="button"
                        onClick={() => toggleAssignee(m.userId)}
                        className={cn(
                          "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs transition-colors cursor-pointer",
                          isSelected
                            ? "bg-secondary text-foreground font-medium"
                            : "hover:bg-secondary/50 text-muted-foreground",
                        )}
                      >
                        <div className={cn(
                          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold",
                          isSelected ? "bg-primary text-primary-foreground" : "bg-brand-100 text-primary",
                        )}>
                          {getInitials(m.name)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-foreground">{m.name}</p>
                          <p className="truncate text-muted-foreground">{m.email}</p>
                        </div>
                        {isSelected && <Check size={11} className="shrink-0 text-primary" />}
                      </button>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>

            {/* Selected assignee chips */}
            {(filters.assigneeUserIds?.length ?? 0) > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {filters.assigneeUserIds!.map((id) => {
                  const m = allMembers.find((m) => m.userId === id);
                  return (
                    <span
                      key={id}
                      className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary"
                    >
                      {m?.name ?? id}
                      <button
                        type="button"
                        onClick={() => toggleAssignee(id)}
                        className="cursor-pointer hover:text-danger"
                      >
                        <X size={10} />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Clear */}
          {hasActiveFilters && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClearAll}
              className="w-full cursor-pointer"
            >
              Clear all filters
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
