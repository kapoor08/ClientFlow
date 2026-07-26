import { FileText, ExternalLink } from "lucide-react";
import { formatBytes } from "@/utils/file";
import type { getPortalProjectDetailForUser } from "@/server/client-portal";

type PortalFile = NonNullable<
  Awaited<ReturnType<typeof getPortalProjectDetailForUser>>
>["files"][number];

export function PortalFilesPanel({ files }: { files: PortalFile[] }) {
  return (
    <div className="lg:col-span-2">
      <div className="mb-4 flex items-center gap-2">
        <FileText size={16} className="text-muted-foreground" />
        <h2 className="font-display text-base font-semibold text-foreground">Files</h2>
        <span className="ml-auto text-xs text-muted-foreground">{files.length}</span>
      </div>

      <div className="overflow-hidden rounded-card border border-border bg-card shadow-cf-1">
        {files.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted-foreground">No files yet.</p>
        ) : (
          <div className="divide-y divide-border">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-secondary/30"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{file.fileName}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatBytes(file.sizeBytes)}
                    {file.sizeBytes ? " · " : ""}
                    {new Date(file.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <a
                  href={file.storageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 text-muted-foreground hover:text-primary transition-colors"
                >
                  <ExternalLink size={14} />
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
