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
        <h2 className="font-display text-foreground text-base font-semibold">Files</h2>
        <span className="text-muted-foreground ml-auto text-xs">{files.length}</span>
      </div>

      <div className="rounded-card border-border bg-card shadow-cf-1 overflow-hidden border">
        {files.length === 0 ? (
          <p className="text-muted-foreground px-5 py-10 text-center text-sm">No files yet.</p>
        ) : (
          <div className="divide-border divide-y">
            {files.map((file) => (
              <div
                key={file.id}
                className="hover:bg-secondary/30 flex items-center justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="text-foreground truncate text-sm font-medium">{file.fileName}</p>
                  <p className="text-muted-foreground text-xs">
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
                  className="text-muted-foreground hover:text-primary shrink-0 transition-colors"
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
