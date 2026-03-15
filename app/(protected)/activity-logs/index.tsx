import { mockActivityLogs } from "@/data/mockData";

const ActivityLogsPage = () => {
  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-foreground">
          Activity Logs
        </h1>
        <p className="text-sm text-muted-foreground">
          Chronological activity across your organization
        </p>
      </div>

      <div className="space-y-1">
        {mockActivityLogs.map((log) => (
          <div
            key={log.id}
            className="flex items-start gap-3 rounded-lg p-3 hover:bg-secondary/50 transition-colors"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-primary">
              {log.actorInitials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground">
                <span className="font-medium">{log.actor}</span>{" "}
                <span className="text-muted-foreground">{log.action}</span>{" "}
                <span className="font-medium">{log.target}</span>
              </p>
              <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                <span>{log.timestamp}</span>
                <span>·</span>
                <span className="rounded-pill bg-secondary px-2 py-0.5 text-[10px] font-medium">
                  {log.module}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActivityLogsPage;
