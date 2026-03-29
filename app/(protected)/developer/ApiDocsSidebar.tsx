import { cn } from "@/lib/utils";
import type { ApiSection } from "./api-docs-data";

// ─── ApiDocsSidebar ───────────────────────────────────────────────────────────

type ApiDocsSidebarProps = {
  sections: ApiSection[];
  activeSection: string;
  onSelect: (id: string) => void;
};

export function ApiDocsSidebar({ sections, activeSection, onSelect }: ApiDocsSidebarProps) {
  return (
    <nav className="hidden w-44 shrink-0 md:block">
      <p className="mb-3 px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        Reference
      </p>
      <ul className="space-y-0.5">
        {sections.map((section) => (
          <li key={section.id}>
            <button
              onClick={() => onSelect(section.id)}
              className={cn(
                "w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors",
                activeSection === section.id
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              {section.title}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
