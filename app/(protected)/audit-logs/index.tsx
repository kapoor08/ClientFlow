import { mockAuditEvents } from "@/data/mockData";
import { Input } from "@/components/ui/input";
import { Search, FileCode } from "lucide-react";
import { useState } from "react";

const AuditLogsPage = () => {
  const [search, setSearch] = useState("");
  const filtered = mockAuditEvents.filter(
    (e) =>
      e.action.includes(search.toLowerCase()) ||
      e.actor.includes(search.toLowerCase()) ||
      e.details.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-foreground">
          Audit Logs
        </h1>
        <p className="text-sm text-muted-foreground">
          Security-grade immutable action trail
        </p>
      </div>

      <div className="mb-4 relative max-w-sm">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          placeholder="Search audit events…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="overflow-hidden rounded-card border border-border bg-card shadow-cf-1">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Timestamp
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Actor
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Action
              </th>
              <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground md:table-cell">
                Entity
              </th>
              <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground lg:table-cell">
                IP
              </th>
              <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground xl:table-cell">
                Details
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((e) => (
              <tr
                key={e.id}
                className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors"
              >
                <td className="px-4 py-3 text-xs text-muted-foreground font-mono whitespace-nowrap">
                  {e.timestamp}
                </td>
                <td className="px-4 py-3 text-foreground">{e.actor}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1 rounded-pill bg-secondary px-2 py-0.5 text-xs font-mono font-medium text-foreground">
                    <FileCode size={10} /> {e.action}
                  </span>
                </td>
                <td className="hidden px-4 py-3 text-muted-foreground md:table-cell font-mono text-xs">
                  {e.entity}
                </td>
                <td className="hidden px-4 py-3 text-xs text-muted-foreground lg:table-cell font-mono">
                  {e.ipAddress}
                </td>
                <td className="hidden px-4 py-3 text-xs text-muted-foreground xl:table-cell max-w-xs truncate">
                  {e.details}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AuditLogsPage;
