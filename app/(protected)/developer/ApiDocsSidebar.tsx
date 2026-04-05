import { cn } from "@/lib/utils";
import type { ApiSection } from "./api-docs-data";

type ApiDocsSidebarProps = {
  sections: ApiSection[];
  activeSection: string;
  onSelect: (id: string) => void;
};

export function ApiDocsSidebar({ sections, activeSection, onSelect }: ApiDocsSidebarProps) {
  return (
    <nav className="hidden w-48 shrink-0 md:block">
      <p className="mb-3 px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        Reference
      </p>
      <ul className="space-y-0.5">
        {sections.map((section) => {
          const isActive = activeSection === section.id;
          return (
            <li key={section.id}>
              <button
                onClick={() => onSelect(section.id)}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors cursor-pointer",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
              >
                <span>{section.title}</span>
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "bg-secondary text-muted-foreground",
                  )}
                >
                  {section.endpoints.length}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
