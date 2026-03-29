import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/get-session";
import { getOrganizationSettingsContextForUser } from "@/lib/organization-settings";
import { getPortalFilesForUser } from "@/lib/client-portal";
import { FileText, ExternalLink, FileImage, FileVideo, FileCode } from "lucide-react";

function getFileIcon(mimeType: string | null) {
  if (!mimeType) return FileText;
  if (mimeType.startsWith("image/")) return FileImage;
  if (mimeType.startsWith("video/")) return FileVideo;
  if (mimeType.includes("pdf") || mimeType.includes("document")) return FileText;
  if (mimeType.includes("spreadsheet") || mimeType.includes("csv")) return FileCode;
  return FileText;
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function ClientPortalFilesPage() {
  const session = await getServerSession();
  if (!session?.user) redirect("/auth/sign-in");

  const ctx = await getOrganizationSettingsContextForUser(session.user.id);
  if (!ctx || ctx.roleKey !== "client") redirect("/dashboard");

  const files = await getPortalFilesForUser(session.user.id);
  if (!files) redirect("/dashboard");

  // Group by project
  const grouped = files.reduce<Record<string, typeof files>>((acc, file) => {
    const key = file.projectName ?? "Other";
    if (!acc[key]) acc[key] = [];
    acc[key].push(file);
    return acc;
  }, {});

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-foreground">
          Files
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {files.length} file{files.length !== 1 ? "s" : ""} across all projects
        </p>
      </div>

      {files.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-card border border-border bg-card py-20 text-center shadow-cf-1">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
            <FileText size={20} className="text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">No files yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Files shared with you will appear here.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([projectName, projectFiles]) => (
            <div key={projectName}>
              <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                {projectName}
              </h2>
              <div className="overflow-hidden rounded-card border border-border bg-card shadow-cf-1">
                <div className="divide-y divide-border">
                  {projectFiles.map((file) => {
                    const Icon = getFileIcon(file.mimeType);
                    return (
                      <div
                        key={file.id}
                        className="flex items-center gap-4 px-5 py-3.5 hover:bg-secondary/30 transition-colors"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary">
                          <Icon size={16} className="text-muted-foreground" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-foreground">
                            {file.fileName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatBytes(file.sizeBytes)}
                            {file.sizeBytes ? " · " : ""}
                            {new Date(file.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                        <a
                          href={file.storageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          <ExternalLink size={13} />
                          Open
                        </a>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
