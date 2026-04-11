import { redirect } from "next/navigation";
import { FileText, ExternalLink } from "lucide-react";
import { EmptyState } from "@/components/common";
import { getPortalFilesForUser } from "@/lib/client-portal";
import { getServerSession } from "@/lib/get-session";
import { getOrganizationSettingsContextForUser } from "@/lib/organization-settings";
import { formatDate } from "@/utils/date";
import { formatBytes, getSimpleFileIcon } from "@/utils/file";

export default async function ClientPortalFilesPage() {
  const session = await getServerSession();
  if (!session?.user) redirect("/auth/sign-in");

  const ctx = await getOrganizationSettingsContextForUser(session.user.id);
  if (!ctx || ctx.roleKey !== "client") redirect("/dashboard");

  const files = await getPortalFilesForUser(session.user.id);
  if (!files) redirect("/dashboard");

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
        <EmptyState
          icon={FileText}
          title="No files yet"
          description="Files shared with you will appear here."
        />
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
                    const Icon = getSimpleFileIcon(file.mimeType, file.fileName);
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
                            {formatDate(file.createdAt)}
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
