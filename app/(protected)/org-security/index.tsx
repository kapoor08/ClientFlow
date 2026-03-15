import { Button } from "@/components/ui/button";
import {
  Monitor,
  Smartphone,
  LogOut,
  Shield,
  AlertTriangle,
} from "lucide-react";

const sessions = [
  {
    id: "s1",
    device: "MacBook Pro",
    browser: "Chrome 122",
    ip: "192.168.1.1",
    location: "New York, US",
    lastActive: "Current session",
    current: true,
    icon: Monitor,
  },
  {
    id: "s2",
    device: "iPhone 15",
    browser: "Safari 17",
    ip: "10.0.0.5",
    location: "New York, US",
    lastActive: "2 hours ago",
    current: false,
    icon: Smartphone,
  },
  {
    id: "s3",
    device: "Windows PC",
    browser: "Firefox 123",
    ip: "172.16.0.12",
    location: "London, UK",
    lastActive: "1 day ago",
    current: false,
    icon: Monitor,
  },
];

const securityEvents = [
  {
    id: "e1",
    event: "Successful sign-in",
    timestamp: "2026-03-06 14:22",
    ip: "192.168.1.1",
    risk: "low",
  },
  {
    id: "e2",
    event: "Password changed",
    timestamp: "2026-03-04 09:15",
    ip: "192.168.1.1",
    risk: "low",
  },
  {
    id: "e3",
    event: "Failed sign-in attempt",
    timestamp: "2026-03-03 23:45",
    ip: "203.0.113.42",
    risk: "high",
  },
  {
    id: "e4",
    event: "New device sign-in",
    timestamp: "2026-03-02 11:30",
    ip: "10.0.0.5",
    risk: "medium",
  },
];

const riskBadge: Record<string, string> = {
  low: "bg-success/10 text-success",
  medium: "bg-warning/10 text-warning",
  high: "bg-danger/10 text-danger",
};

const SecurityPage = () => {
  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-foreground">
          Security
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage sessions, devices, and security events
        </p>
      </div>

      {/* Active Sessions */}
      <h2 className="mb-4 font-display text-lg font-semibold text-foreground">
        Active Sessions
      </h2>
      <div className="mb-8 space-y-3">
        {sessions.map((s) => (
          <div
            key={s.id}
            className="flex items-center justify-between rounded-card border border-border bg-card p-4 shadow-cf-1"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                <s.icon size={20} className="text-muted-foreground" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">
                    {s.device}
                  </p>
                  {s.current && (
                    <span className="rounded-pill bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success">
                      Current
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {s.browser} · {s.ip} · {s.location}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {s.lastActive}
                </p>
              </div>
            </div>
            {!s.current && (
              <Button variant="outline" size="sm">
                <LogOut size={12} className="mr-1" /> Revoke
              </Button>
            )}
          </div>
        ))}
        <Button variant="destructive" size="sm" className="cursor-pointer">
          <LogOut size={14} className="mr-1.5" /> Sign Out All Devices
        </Button>
      </div>

      {/* Security Events */}
      <h2 className="mb-4 font-display text-lg font-semibold text-foreground">
        Security Events
      </h2>
      <div className="overflow-hidden rounded-card border border-border bg-card shadow-cf-1">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Event
              </th>
              <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground sm:table-cell">
                Time
              </th>
              <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground md:table-cell">
                IP
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Risk
              </th>
            </tr>
          </thead>
          <tbody>
            {securityEvents.map((e) => (
              <tr
                key={e.id}
                className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {e.risk === "high" ? (
                      <AlertTriangle size={14} className="text-danger" />
                    ) : (
                      <Shield size={14} className="text-muted-foreground" />
                    )}
                    <span className="text-foreground">{e.event}</span>
                  </div>
                </td>
                <td className="hidden px-4 py-3 text-xs text-muted-foreground font-mono sm:table-cell">
                  {e.timestamp}
                </td>
                <td className="hidden px-4 py-3 text-xs text-muted-foreground font-mono md:table-cell">
                  {e.ip}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-pill px-2 py-0.5 text-xs font-medium capitalize ${riskBadge[e.risk]}`}
                  >
                    {e.risk}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SecurityPage;
