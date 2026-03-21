"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Archive,
  Download,
  File,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileVideo,
  Loader2,
  Search,
  Trash2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAllFiles, useDeleteFile } from "@/core/files/useCase";
import type { OrgFileListItem } from "@/core/files/entity";
import { cn } from "@/lib/utils";

// ─── Helpers ───────────────────────────────────────────────────────────────

function getFileIcon(mimeType: string | null) {
  if (!mimeType) return File;
  if (mimeType.startsWith("image/")) return FileImage;
  if (mimeType.startsWith("video/")) return FileVideo;
  if (mimeType === "application/pdf") return FileText;
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel") || mimeType === "text/csv")
    return FileSpreadsheet;
  if (mimeType.includes("word") || mimeType.includes("document") || mimeType.startsWith("text/"))
    return FileText;
  if (mimeType.includes("zip") || mimeType.includes("tar") || mimeType.includes("archive"))
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

function formatBytes(bytes: number | null): string {
  if (!bytes) return "—";
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

// ─── Row ──────────────────────────────────────────────────────────────────

function FileRow({
  file,
  canDelete,
  onDelete,
  isDeleting,
}: {
  file: OrgFileListItem;
  canDelete: boolean;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}) {
  const Icon = getFileIcon(file.mimeType);
  const iconBg = getIconBg(file.mimeType);

  return (
    <tr
      className={cn(
        "border-b border-border last:border-0 transition-colors hover:bg-secondary/30",
        isDeleting && "opacity-50",
      )}
    >
      {/* File name */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconBg}`}
          >
            <Icon size={15} />
          </div>
          <span
            className="max-w-[220px] truncate text-sm font-medium text-foreground"
            title={file.fileName}
          >
            {file.fileName}
          </span>
        </div>
      </td>

      {/* Project */}
      <td className="hidden px-4 py-3 sm:table-cell">
        <Link
          href={`/projects/${file.projectId}`}
          className="text-sm text-muted-foreground hover:text-primary"
        >
          {file.projectName}
        </Link>
      </td>

      {/* Client */}
      <td className="hidden px-4 py-3 md:table-cell">
        {file.clientId ? (
          <Link
            href={`/clients/${file.clientId}`}
            className="text-sm text-muted-foreground hover:text-primary"
          >
            {file.clientName ?? "—"}
          </Link>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        )}
      </td>

      {/* Size */}
      <td className="hidden px-4 py-3 text-sm text-muted-foreground lg:table-cell">
        {formatBytes(file.sizeBytes)}
      </td>

      {/* Date */}
      <td className="px-4 py-3 text-xs text-muted-foreground">
        {formatDate(file.createdAt)}
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1">
          <a
            href={file.storageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            title="Download"
          >
            <Download size={13} />
          </a>
          {canDelete && (
            <button
              onClick={() => onDelete(file.id)}
              disabled={isDeleting}
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-danger/10 hover:text-danger disabled:opacity-40"
              title="Delete"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

// ─── Table ────────────────────────────────────────────────────────────────

type FilesTableProps = {
  initialFiles: OrgFileListItem[];
  canWrite: boolean;
};

export function FilesTable({ initialFiles, canWrite }: FilesTableProps) {
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: files = initialFiles, isLoading } = useAllFiles({ q: search });
  const deleteFile = useDeleteFile();

  const handleDelete = async (fileId: string) => {
    setDeletingId(fileId);
    try {
      await deleteFile.mutateAsync({ fileId });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative max-w-sm">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          placeholder="Search files…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-card border border-border bg-card shadow-cf-1">
        {isLoading && search ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={20} className="animate-spin text-muted-foreground" />
          </div>
        ) : files.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <File size={28} className="text-muted-foreground/30" />
            <p className="text-sm font-medium text-muted-foreground">
              {search ? "No files match your search." : "No files uploaded yet."}
            </p>
            {!search && (
              <p className="text-xs text-muted-foreground/70">
                Upload files from the project detail page.
              </p>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/40">
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                  File
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-semibold text-muted-foreground sm:table-cell">
                  Project
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-semibold text-muted-foreground md:table-cell">
                  Client
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-semibold text-muted-foreground lg:table-cell">
                  Size
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                  Uploaded
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {files.map((file) => (
                <FileRow
                  key={file.id}
                  file={file}
                  canDelete={canWrite}
                  onDelete={handleDelete}
                  isDeleting={deletingId === file.id}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
