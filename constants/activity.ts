import {
  Building2,
  CheckSquare,
  Clock,
  FileText,
  FolderKanban,
  Mail,
  Receipt,
  Shield,
  Users,
} from "lucide-react";

const ENTITY_TYPE_OPTIONS = [
  { value: "all", label: "All activity" },
  { value: "client", label: "Clients" },
  { value: "project", label: "Projects" },
  { value: "task", label: "Tasks" },
  { value: "file", label: "Files" },
  { value: "invoice", label: "Invoices" },
  { value: "time_entry", label: "Time Entries" },
  { value: "invitation", label: "Invitations" },
  { value: "membership", label: "Members" },
  { value: "organization", label: "Organization" },
];

const ENTITY_ICON: Record<string, React.ElementType> = {
  client: Users,
  project: FolderKanban,
  task: CheckSquare,
  file: FileText,
  invoice: Receipt,
  time_entry: Clock,
  invitation: Mail,
  membership: Shield,
  organization: Building2,
};

const ENTITY_ICON_BG: Record<string, string> = {
  client: "bg-blue-100 text-blue-600",
  project: "bg-violet-100 text-violet-600",
  task: "bg-indigo-100 text-indigo-600",
  file: "bg-amber-100 text-amber-600",
  invoice: "bg-orange-100 text-orange-600",
  time_entry: "bg-cyan-100 text-cyan-600",
  invitation: "bg-emerald-100 text-emerald-600",
  membership: "bg-rose-100 text-rose-600",
  organization: "bg-slate-100 text-slate-600",
};

export { ENTITY_ICON, ENTITY_ICON_BG, ENTITY_TYPE_OPTIONS };
