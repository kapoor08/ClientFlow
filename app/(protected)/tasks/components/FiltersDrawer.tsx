"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
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
import { http } from "@/core/infrastructure";
import type { TaskFilters } from "@/core/tasks/entity";
import { X } from "lucide-react";

type ExtendedFilters = TaskFilters & {
  projectId?: string;
  assigneeUserId?: string;
};

type FiltersDrawerProps = {
  open: boolean;
  onClose: () => void;
  filters: ExtendedFilters;
  onChange: (filters: ExtendedFilters) => void;
};

type ProjectOption = { id: string; name: string };
type MemberOption = { userId: string; name: string; email: string };

const PRIORITY_OPTIONS = [
  { value: "urgent", label: "Urgent", color: "#ef4444" },
  { value: "high", label: "High", color: "#f97316" },
  { value: "medium", label: "Medium", color: "#f59e0b" },
  { value: "low", label: "Low", color: "#71717a" },
];

export function FiltersDrawer({
  open,
  onClose,
  filters,
  onChange,
}: FiltersDrawerProps) {
  const [memberSearch, setMemberSearch] = useState("");

  const { data: projectsData } = useQuery({
    queryKey: ["projects-filter-list"],
    queryFn: () =>
      http<{ projects: ProjectOption[] }>("/api/projects?pageSize=100"),
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
  const members = (teamData?.members ?? []).filter((m) =>
    memberSearch
      ? m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
        m.email.toLowerCase().includes(memberSearch.toLowerCase())
      : true,
  );

  function togglePriority(value: string) {
    if (filters.priority === value) {
      onChange({ ...filters, priority: undefined });
    } else {
      onChange({ ...filters, priority: value });
    }
  }

  function handleProjectChange(value: string) {
    onChange({ ...filters, projectId: value === "all" ? undefined : value });
  }

  function handleAssigneeSelect(memberId: string) {
    if (filters.assigneeUserId === memberId) {
      onChange({ ...filters, assigneeUserId: undefined });
    } else {
      onChange({ ...filters, assigneeUserId: memberId });
    }
  }

  function handleClearAll() {
    onChange({});
  }

  const hasActiveFilters =
    !!filters.priority || !!filters.projectId || !!filters.assigneeUserId;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-80 sm:w-96 overflow-y-auto">
        <SheetHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-border">
          <SheetTitle>Filters</SheetTitle>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            aria-label="Close filters"
          >
            <X size={16} />
          </button>
        </SheetHeader>

        <div className="p-5 space-y-6">
          {/* Project */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Project
            </h3>
            <Select
              value={filters.projectId ?? "all"}
              onValueChange={handleProjectChange}
            >
              <SelectTrigger>
                <SelectValue
                  className="cursor-pointer"
                  placeholder="All projects"
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All projects</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Priority
            </h3>
            <div className="flex flex-wrap gap-2">
              {PRIORITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => togglePriority(opt.value)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors cursor-pointer",
                    filters.priority === opt.value
                      ? "border-foreground bg-secondary text-foreground font-medium"
                      : "border-border text-muted-foreground hover:border-foreground hover:text-foreground",
                  )}
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: opt.color }}
                  />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Assignee */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Assignee
            </h3>
            <Input
              placeholder="Search team members…"
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
            />
            <div className="mt-2 space-y-1 max-h-48 overflow-y-auto">
              {members.length === 0 && (
                <p className="text-xs text-muted-foreground py-2 text-center">
                  No members found.
                </p>
              )}
              {members.map((m) => {
                const initials = (m.name ?? "?")
                  .split(" ")
                  .map((w) => w[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);
                const isSelected = filters.assigneeUserId === m.userId;
                return (
                  <button
                    key={m.userId}
                    type="button"
                    onClick={() => handleAssigneeSelect(m.userId)}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm transition-colors cursor-pointer",
                      isSelected
                        ? "bg-secondary text-foreground"
                        : "hover:bg-secondary/50 text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[10px] font-semibold text-primary">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">
                        {m.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {m.email}
                      </p>
                    </div>
                    {isSelected && (
                      <div className="ml-auto h-2 w-2 rounded-full bg-primary" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Clear filters */}
          {hasActiveFilters && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClearAll}
              className="w-full"
            >
              Clear all filters
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
