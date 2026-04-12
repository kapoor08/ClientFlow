"use client";

import { motion } from "framer-motion";
import { LayoutGrid, List, Plus, Search, SlidersHorizontal, Users } from "lucide-react";

const COLUMNS = [
  {
    key: "todo",
    label: "To Do",
    count: 5,
    color: "bg-amber-400",
    tasks: [
      { ref: "CF-A98C454B", title: "Task 5", project: "Prop Firm Genie", assignees: ["AD", "LK"], priority: "Urgent", priorityColor: "bg-red-500/10 text-red-600", comments: 1, attachments: 1 },
      { ref: "CF-1147D63B", title: "Task 4", project: "Prop Firm Genie", assignees: ["LK"], priority: "Medium", priorityColor: "bg-amber-500/10 text-amber-600", comments: 0, attachments: 0 },
      { ref: "CF-23F37C6F", title: "Task 3", project: "Prop Firm Genie", assignees: ["AD"], priority: "High", priorityColor: "bg-orange-500/10 text-orange-600", comments: 0, attachments: 0 },
    ],
  },
  { key: "in_progress", label: "In Progress", count: 0, color: "bg-orange-400", tasks: [] },
  { key: "testing", label: "Testing / QA", count: 0, color: "bg-cyan-400", tasks: [] },
  { key: "completed", label: "Completed", count: 0, color: "bg-emerald-400", tasks: [] },
] as const;

const colAnim = {
  hidden: { opacity: 0, y: 8 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.3 } }),
};
const cardAnim = {
  hidden: { opacity: 0, scale: 0.96 },
  show: (i: number) => ({ opacity: 1, scale: 1, transition: { delay: 0.2 + i * 0.05, duration: 0.25 } }),
};

export function HeroTasksPage() {
  return (
    <div className="hero-preview-scrollbar flex-1 overflow-y-auto p-5">
      {/* Header */}
      <div className="mb-3 flex items-start justify-between">
        <div>
          <h2 className="text-base font-bold font-display text-foreground">My Tasks</h2>
          <p className="text-[11px] text-muted-foreground">4 columns · 5 tasks</p>
        </div>
        <div className="flex h-6 items-center gap-1 rounded-md bg-primary px-2.5 text-[11px] font-medium text-primary-foreground">
          <Plus size={10} /> Add Task
        </div>
      </div>

      {/* Filters bar */}
      <div className="mb-3 flex items-center gap-2">
        <div className="flex flex-1 items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 max-w-[40%]">
          <Search size={10} className="text-muted-foreground/50" />
          <span className="text-[11px] text-muted-foreground/40">Search tasks...</span>
        </div>
        <div className="flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1.5 text-[10px] text-muted-foreground">
          <Users size={9} /> Assigned to me
        </div>
        <div className="flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1.5 text-[10px] text-muted-foreground">
          <SlidersHorizontal size={9} /> Filters
        </div>
        <div className="ml-auto flex items-center overflow-hidden rounded-md border border-border">
          <div className="flex items-center justify-center bg-primary/10 px-1.5 py-1">
            <LayoutGrid size={11} className="text-primary" />
          </div>
          <div className="flex items-center justify-center px-1.5 py-1">
            <List size={11} className="text-muted-foreground/40" />
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-4 gap-2">
        {COLUMNS.map((col, ci) => (
          <motion.div
            key={col.key}
            custom={ci}
            variants={colAnim}
            initial="hidden"
            animate="show"
            className="flex flex-col"
          >
            {/* Column header */}
            <div className="mb-2 flex items-center gap-1.5 px-1">
              <div className={`h-4 w-0.5 rounded-full ${col.color}`} />
              <span className="text-xs font-bold text-foreground">{col.label}</span>
              <span className="text-[11px] text-muted-foreground">{col.count}</span>
            </div>

            {/* Cards */}
            <div className="flex-1 space-y-1.5">
              {col.tasks.length > 0 ? (
                col.tasks.map((task, ti) => (
                  <motion.div
                    key={task.ref}
                    custom={ci * 3 + ti}
                    variants={cardAnim}
                    initial="hidden"
                    animate="show"
                    className="rounded-lg border border-border bg-card p-2.5 transition-all hover:border-primary/20 hover:shadow-sm"
                  >
                    <div className="text-[9px] text-muted-foreground/50 font-mono">{task.ref}</div>
                    <div className="mt-0.5 text-xs font-medium text-foreground">{task.title}</div>
                    <div className="text-[10px] text-muted-foreground">{task.project}</div>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        {task.assignees.map((a) => (
                          <div key={a} className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[5px] font-bold text-primary-foreground -ml-0.5 first:ml-0">
                            {a}
                          </div>
                        ))}
                        <span className={`ml-1 inline-flex rounded-full px-1.5 py-0.5 text-[6px] font-medium ${task.priorityColor}`}>
                          {task.priority}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground/50">
                        {task.comments > 0 && <span>&#9633;{task.comments}</span>}
                        {task.attachments > 0 && <span>&#128206;{task.attachments}</span>}
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="rounded-lg border border-dashed border-border/50 py-4 text-center text-[10px] text-muted-foreground/40">
                  No tasks yet
                </div>
              )}

              {/* Add Task */}
              <div className="flex items-center justify-center gap-1 py-2 text-[10px] text-muted-foreground/40">
                <Plus size={8} /> Add Task
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
