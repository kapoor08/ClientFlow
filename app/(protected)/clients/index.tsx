import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { mockClients } from "@/data/mockData";
import {
  Search,
  Plus,
  LayoutGrid,
  List,
  MoreHorizontal,
  Mail,
  Phone,
  FolderKanban,
  ArrowUpDown,
} from "lucide-react";

const statusBadge: Record<string, string> = {
  active: "bg-success/10 text-success",
  inactive: "bg-neutral-300/50 text-neutral-700",
  archived: "bg-neutral-300/50 text-neutral-500",
};

const ClientsPage = () => {
  const [view, setView] = useState<"table" | "card">("table");
  const [search, setSearch] = useState("");

  const filtered = mockClients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.company.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">
            Clients
          </h1>
          <p className="text-sm text-muted-foreground">
            {mockClients.length} clients total
          </p>
        </div>
        <Button asChild>
          <Link href="/app/clients/new">
            <Plus size={16} className="mr-1.5" /> Add Client
          </Link>
        </Button>
      </div>

      {/* Toolbar */}
      <div className="mb-4 flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder="Search clients…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex rounded-lg border border-border">
          <button
            onClick={() => setView("table")}
            className={`rounded-l-lg px-2.5 py-1.5 ${view === "table" ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/50"}`}
          >
            <List size={16} />
          </button>
          <button
            onClick={() => setView("card")}
            className={`rounded-r-lg px-2.5 py-1.5 ${view === "card" ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/50"}`}
          >
            <LayoutGrid size={16} />
          </button>
        </div>
      </div>

      {view === "table" ? (
        <div className="overflow-hidden rounded-card border border-border bg-card shadow-cf-1">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  <button className="flex items-center gap-1">
                    <span>Client</span>
                    <ArrowUpDown size={12} />
                  </button>
                </th>
                <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground md:table-cell">
                  Company
                </th>
                <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground sm:table-cell">
                  Status
                </th>
                <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground lg:table-cell">
                  Projects
                </th>
                <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground lg:table-cell">
                  Revenue
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Last Active
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((client) => (
                <tr
                  key={client.id}
                  className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/app/clients/${client.id}`}
                      className="flex items-center gap-3"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-primary">
                        {client.avatarInitials}
                      </div>
                      <div>
                        <span className="font-medium text-foreground hover:text-primary">
                          {client.name}
                        </span>
                        <span className="block text-xs text-muted-foreground md:hidden">
                          {client.company}
                        </span>
                      </div>
                    </Link>
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                    {client.company}
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    <span
                      className={`inline-flex rounded-pill px-2 py-0.5 text-xs font-medium capitalize ${statusBadge[client.status]}`}
                    >
                      {client.status}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">
                    {client.projectCount}
                  </td>
                  <td className="hidden px-4 py-3 font-medium text-foreground lg:table-cell">
                    {client.totalRevenue}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {client.lastActivity}
                  </td>
                  <td className="px-4 py-3">
                    <button className="rounded-lg p-1 text-muted-foreground hover:bg-secondary">
                      <MoreHorizontal size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((client) => (
            <Link
              key={client.id}
              href={`/app/clients/${client.id}`}
              className="group rounded-card border border-border bg-card p-5 shadow-cf-1 transition-shadow hover:shadow-cf-2"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-primary">
                  {client.avatarInitials}
                </div>
                <div>
                  <h3 className="font-medium text-foreground group-hover:text-primary">
                    {client.name}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {client.company}
                  </p>
                </div>
                <span
                  className={`ml-auto rounded-pill px-2 py-0.5 text-xs font-medium capitalize ${statusBadge[client.status]}`}
                >
                  {client.status}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-secondary/50 px-2 py-1.5">
                  <FolderKanban
                    size={14}
                    className="mx-auto text-muted-foreground"
                  />
                  <span className="mt-0.5 block text-xs font-medium text-foreground">
                    {client.projectCount}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Projects
                  </span>
                </div>
                <div className="rounded-lg bg-secondary/50 px-2 py-1.5">
                  <Mail size={14} className="mx-auto text-muted-foreground" />
                  <span className="mt-0.5 block text-xs font-medium text-foreground truncate">
                    {client.email.split("@")[0]}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Email
                  </span>
                </div>
                <div className="rounded-lg bg-secondary/50 px-2 py-1.5">
                  <Phone size={14} className="mx-auto text-muted-foreground" />
                  <span className="mt-0.5 block text-xs font-medium text-foreground">
                    {client.totalRevenue}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Revenue
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClientsPage;
