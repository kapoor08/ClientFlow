"use client";

import {
  File,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileVideo,
  Trash2,
  Download,
  Archive,
} from "lucide-react";
import type { ProjectFile } from "@/core/files/entity";

function getFileIcon(mimeType: string | null) {
  if (!mimeType) return File;
  if (mimeType.startsWith("image/")) return FileImage;
  if (mimeType.startsWith("video/")) return FileVideo;
  if (mimeType === "application/pdf") return FileText;
  if (
    mimeType.includes("spreadsheet") ||
    mimeType.includes("excel") ||
    mimeType === "text/csv"
  )
    return FileSpreadsheet;
  if (
    mimeType.includes("word") ||
    mimeType.includes("document") ||
    mimeType.startsWith("text/")
  )
    return FileText;
  if (
    mimeType.includes("zip") ||
    mimeType.includes("archive") ||
    mimeType.includes("tar")
  )
    return Archive;
  return File;
}

function getFileIconColor(mimeType: string | null): string {
  if (!mimeType) return "text-muted-foreground";
  if (mimeType.startsWith("image/")) return "text-primary";
  if (mimeType.startsWith("video/")) return "text-purple-500";
  if (mimeType === "application/pdf") return "text-danger";
  if (
    mimeType.includes("spreadsheet") ||
    mimeType.includes("excel") ||
    mimeType === "text/csv"
  )
    return "text-success";
  if (mimeType.includes("word") || mimeType.includes("document"))
    return "text-info";
  return "text-muted-foreground";
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}

type FileCardProps = {
  file: ProjectFile;
  canDelete: boolean;
  onDelete: (fileId: string) => void;
  isDeleting: boolean;
};

export function FileCard({
  file,
  canDelete,
  onDelete,
  isDeleting,
}: FileCardProps) {
  const Icon = getFileIcon(file.mimeType);
  const iconColor = getFileIconColor(file.mimeType);

  return (
    <div className="group flex items-start gap-3 rounded-card border border-border bg-card p-4 shadow-cf-1 transition-all hover:border-primary/20 hover:shadow-cf-2">
      {/* Icon */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
        <Icon size={18} className={iconColor} />
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p
          className="truncate text-sm font-medium text-foreground"
          title={file.fileName}
        >
          {file.fileName}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {[formatBytes(file.sizeBytes), formatDate(file.createdAt)]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1">
        <a
          href={file.storageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground cursor-pointer"
          title="Download"
        >
          <Download size={13} />
        </a>
        {canDelete && (
          <button
            onClick={() => onDelete(file.id)}
            disabled={isDeleting}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-danger/10 hover:text-danger disabled:opacity-40 cursor-pointer"
            title="Delete"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>
    </div>
  );
}
