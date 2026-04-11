"use client";

import { useState } from "react";
import {
  Archive,
  Download,
  Eye,
  File,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileVideo,
  Trash2,
} from "lucide-react";
import type { ProjectFile } from "@/core/files/entity";
import { formatBytes } from "@/utils/file";
import { formatDate } from "@/utils/date";
import { FilePreviewModal } from "./FilePreviewModal";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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

function getIconBg(mimeType: string | null): string {
  if (!mimeType) return "bg-muted text-muted-foreground";
  if (mimeType.startsWith("image/")) return "bg-primary/10 text-primary";
  if (mimeType.startsWith("video/")) return "bg-purple-100 text-purple-500";
  if (mimeType === "application/pdf") return "bg-danger/10 text-danger";
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel") || mimeType === "text/csv")
    return "bg-success/10 text-success";
  if (mimeType.includes("word") || mimeType.includes("document"))
    return "bg-info/10 text-info";
  return "bg-muted text-muted-foreground";
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
  const [previewing, setPreviewing] = useState(false);
  const Icon = getFileIcon(file.mimeType);
  const iconBg = getIconBg(file.mimeType);

  return (
    <>
      <div className="group flex items-center gap-3 rounded-card border border-border bg-card p-3.5 shadow-cf-1 transition-all hover:border-primary/20 hover:shadow-cf-2">
        {/* Icon */}
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconBg}`}>
          <Icon size={17} />
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

        {/* Actions - visible on hover */}
        <TooltipProvider delayDuration={300}>
          <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setPreviewing(true)}
                  className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  <Eye size={13} />
                </button>
              </TooltipTrigger>
              <TooltipContent>View</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <a
                  href={file.storageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={file.fileName}
                  className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  <Download size={13} />
                </a>
              </TooltipTrigger>
              <TooltipContent>Download</TooltipContent>
            </Tooltip>

            {canDelete && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onDelete(file.id)}
                    disabled={isDeleting}
                    className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-danger/10 hover:text-danger disabled:opacity-40"
                  >
                    <Trash2 size={13} />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Delete</TooltipContent>
              </Tooltip>
            )}
          </div>
        </TooltipProvider>
      </div>

      <FilePreviewModal
        file={previewing ? file : null}
        onClose={() => setPreviewing(false)}
      />
    </>
  );
}
