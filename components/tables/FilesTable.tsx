"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Archive,
  File,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileVideo,
} from "lucide-react";
import {
  DataTable,
  DateRangeFilter,
  RowActions,
  type ColumnDef,
} from "@/components/data-table";
import { toast } from "sonner";
import { useDeleteFile } from "@/core/files/useCase";
import type { OrgFileListItem } from "@/core/files/entity";
import {
  FilePreviewModal,
  type PreviewFile,
} from "@/components/files/FilePreviewModal";
import type { PaginationMeta } from "@/lib/pagination";

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
    mimeType.includes("tar") ||
    mimeType.includes("archive")
  )
    return Archive;
  return File;
}

function getIconBg(mimeType: string | null): string {
  if (!mimeType) return "bg-muted text-muted-foreground";
  if (mimeType.startsWith("image/")) return "bg-primary/10 text-primary";
  if (mimeType.startsWith("video/")) return "bg-purple-100 text-purple-500";
  if (mimeType === "application/pdf") return "bg-danger/10 text-danger";
  if (
    mimeType.includes("spreadsheet") ||
    mimeType.includes("excel") ||
    mimeType === "text/csv"
  )
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

// ─── Column definitions ───────────────────────────────────────────────────────

function buildColumns(
  canDelete: boolean,
  deletingId: string | null,
  onDelete: (id: string) => void,
  onPreview: (file: PreviewFile) => void,
): ColumnDef<OrgFileListItem>[] {
  return [
    {
      key: "actions",
      header: "Actions",
      cell: (file) => (
        <RowActions
          onPreview={() =>
            onPreview({
              fileName: file.fileName,
              storageUrl: file.storageUrl,
              mimeType: file.mimeType,
            })
          }
          downloadHref={file.storageUrl}
          downloadFileName={file.fileName}
          onDelete={canDelete ? () => onDelete(file.id) : undefined}
          isDeleting={deletingId === file.id}
          deleteLabel={file.fileName}
        />
      ),
    },
    {
      key: "fileName",
      header: "File",
      sortable: true,
      cell: (file) => {
        const Icon = getFileIcon(file.mimeType);
        const iconBg = getIconBg(file.mimeType);
        return (
          <div className="flex items-center gap-3">
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconBg}`}
            >
              <Icon size={15} />
            </div>
            <span
              className="max-w-55 truncate text-sm font-medium text-foreground"
              title={file.fileName}
            >
              {file.fileName}
            </span>
          </div>
        );
      },
    },
    {
      key: "projectName",
      header: "Project",
      hideOnMobile: true,
      cell: (file) => (
        <Link
          href={`/projects/${file.projectId}`}
          className="text-sm text-muted-foreground hover:text-primary"
        >
          {file.projectName}
        </Link>
      ),
    },
    {
      key: "clientName",
      header: "Client",
      hideOnTablet: true,
      cell: (file) =>
        file.clientId ? (
          <Link
            href={`/clients/${file.clientId}`}
            className="text-sm text-muted-foreground hover:text-primary"
          >
            {file.clientName ?? "—"}
          </Link>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        ),
    },
    {
      key: "sizeBytes",
      header: "Size",
      sortable: true,
      hideOnTablet: true,
      cell: (file) => (
        <span className="text-sm text-muted-foreground">
          {formatBytes(file.sizeBytes)}
        </span>
      ),
    },
    {
      key: "createdAt",
      header: "Uploaded",
      sortable: true,
      cell: (file) => (
        <span className="text-xs text-muted-foreground">
          {formatDate(file.createdAt)}
        </span>
      ),
    },
  ];
}

// ─── Export ───────────────────────────────────────────────────────────────────

type FilesTableProps = {
  initialFiles: OrgFileListItem[];
  pagination: PaginationMeta;
  canWrite: boolean;
};

export function FilesTable({
  initialFiles,
  pagination,
  canWrite,
}: FilesTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<PreviewFile | null>(null);
  const deleteFile = useDeleteFile();

  const handleDelete = async (fileId: string) => {
    setDeletingId(fileId);
    try {
      await deleteFile.mutateAsync({ fileId });
      toast.success("File deleted.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete file.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  const columns = buildColumns(canWrite, deletingId, handleDelete, setPreviewFile);

  return (
    <>
      <DataTable
        data={initialFiles}
        columns={columns}
        getRowKey={(f) => f.id}
        searchPlaceholder="Search files…"
        searchExtra={<DateRangeFilter />}
        pagination={pagination}
        emptyTitle="No files found."
        emptyDescription="Try a different search term or upload files from the project detail page."
      />
      <FilePreviewModal
        file={previewFile}
        onClose={() => setPreviewFile(null)}
      />
    </>
  );
}
