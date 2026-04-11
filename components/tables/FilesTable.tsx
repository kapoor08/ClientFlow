"use client";

import { useCallback, useState, useTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Archive,
  Download,
  Eye,
  File,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileVideo,
  Loader2,
  Trash2,
} from "lucide-react";
import {
  DataTable,
  DateRangeFilter,
  FiltersPopover,
  RowActions,
  type ColumnDef,
} from "@/components/data-table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { parseAsString, useQueryState } from "nuqs";
import { useDeleteFile } from "@/core/files/useCase";
import { loadMoreFilesAction } from "@/app/(protected)/files/actions";
import type { OrgFileListItem } from "@/core/files/entity";
import {
  FilePreviewModal,
  type PreviewFile,
} from "@/components/files/FilePreviewModal";
import type { PaginationMeta } from "@/lib/pagination";
import { cn } from "@/lib/utils";
import { formatBytes } from "@/utils/file";
import { formatDate } from "@/utils/date";

// ─── Helpers ──────────────────────────────────────────────────────────────────

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


// ─── Grid Card ────────────────────────────────────────────────────────────────

function FileGridCard({
  file,
  canDelete,
  deletingId,
  onPreview,
  onDelete,
}: {
  file: OrgFileListItem;
  canDelete: boolean;
  deletingId: string | null;
  onPreview: (file: PreviewFile) => void;
  onDelete: (id: string) => void;
}) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const Icon = getFileIcon(file.mimeType);
  const iconBg = getIconBg(file.mimeType);
  const isDeleting = deletingId === file.id;

  return (
    <>
      <div className="group flex flex-col rounded-card border border-border bg-card shadow-cf-1 transition-all hover:shadow-cf-2 overflow-hidden">
        {/* Icon area */}
        <div className={cn("flex items-center justify-center py-8", iconBg, "bg-opacity-40")}>
          <div className={cn("flex h-14 w-14 items-center justify-center rounded-2xl", iconBg)}>
            <Icon size={28} />
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-col gap-1 p-3 flex-1">
          <p
            className="truncate text-sm font-semibold text-foreground leading-snug"
            title={file.fileName}
          >
            {file.fileName}
          </p>
          <Link
            href={`/projects/${file.projectId}`}
            className="truncate text-xs text-primary hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {file.projectName}
          </Link>
          {file.clientName && (
            <p className="truncate text-xs text-muted-foreground">{file.clientName}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 border-t border-border px-3 py-2">
          <div className="flex flex-col">
            <span className="text-[10px] text-muted-foreground">{formatBytes(file.sizeBytes)}</span>
            <span className="text-[10px] text-muted-foreground">{formatDate(file.createdAt)}</span>
          </div>
          <TooltipProvider>
            <div className="flex items-center gap-0.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => onPreview({ fileName: file.fileName, storageUrl: file.storageUrl, mimeType: file.mimeType })}
                    className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  >
                    <Eye size={14} />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Preview</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <a
                    href={file.storageUrl}
                    download={file.fileName}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  >
                    <Download size={14} />
                  </a>
                </TooltipTrigger>
                <TooltipContent>Download</TooltipContent>
              </Tooltip>
              {canDelete && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={() => setDeleteOpen(true)}
                      className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-danger/10 hover:text-danger disabled:opacity-40"
                    >
                      {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Delete</TooltipContent>
                </Tooltip>
              )}
            </div>
          </TooltipProvider>
        </div>
      </div>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirm delete</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete &ldquo;{file.fileName}&rdquo;? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDeleteOpen(false)} className="cursor-pointer">Cancel</Button>
            <Button variant="destructive" size="sm" onClick={() => { setDeleteOpen(false); onDelete(file.id); }} className="cursor-pointer">Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
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
      header: "",
      headerClassName: "w-24",
      cell: (file) => (
        <RowActions
          onPreview={() => onPreview({ fileName: file.fileName, storageUrl: file.storageUrl, mimeType: file.mimeType })}
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
            <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", iconBg)}>
              <Icon size={15} />
            </div>
            <span className="max-w-60 truncate text-sm font-medium text-foreground" title={file.fileName}>
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
        <Link href={`/projects/${file.projectId}`} className="text-sm text-muted-foreground hover:text-primary">
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
          <Link href={`/clients/${file.clientId}`} className="text-sm text-muted-foreground hover:text-primary">
            {file.clientName ?? "-"}
          </Link>
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        ),
    },
    {
      key: "sizeBytes",
      header: "Size",
      sortable: true,
      hideOnTablet: true,
      cell: (file) => (
        <span className="text-sm text-muted-foreground">{formatBytes(file.sizeBytes)}</span>
      ),
    },
    {
      key: "createdAt",
      header: "Uploaded",
      sortable: true,
      cell: (file) => (
        <span className="text-xs text-muted-foreground">{formatDate(file.createdAt)}</span>
      ),
    },
  ];
}

// ─── Component ────────────────────────────────────────────────────────────────

type ProjectOption = { id: string; name: string };

type FilesTableProps = {
  initialFiles: OrgFileListItem[];
  pagination: PaginationMeta;
  canWrite: boolean;
  projects: ProjectOption[];
};

export function FilesTable({ initialFiles, pagination, canWrite, projects }: FilesTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<PreviewFile | null>(null);
  const deleteFile = useDeleteFile();
  const searchParams = useSearchParams();

  const [, startTransition] = useTransition();
  const [projectId, setProjectId] = useQueryState(
    "projectId",
    parseAsString
      .withDefault("")
      .withOptions({ shallow: false, startTransition, clearOnDefault: true }),
  );

  const loadMore = useCallback(
    async (page: number, pageSize: number) => {
      return loadMoreFilesAction({
        page,
        pageSize,
        q: searchParams.get("q") ?? "",
        sort: searchParams.get("sort") ?? "",
        order: searchParams.get("order") ?? "desc",
        dateFrom: searchParams.get("dateFrom") ?? "",
        dateTo: searchParams.get("dateTo") ?? "",
        projectId: searchParams.get("projectId") ?? "",
      });
    },
    [searchParams],
  );

  const handleDelete = async (fileId: string) => {
    setDeletingId(fileId);
    try {
      await deleteFile.mutateAsync({ fileId });
      toast.success("File deleted.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete file.");
    } finally {
      setDeletingId(null);
    }
  };

  const columns = buildColumns(canWrite, deletingId, handleDelete, setPreviewFile);

  const searchExtra = (
    <>
      <DateRangeFilter />
      <FiltersPopover
        filters={[
          {
            key: "projectId",
            label: "Project",
            options: projects.map((p) => ({ value: p.id, label: p.name })),
            value: projectId,
            onChange: (val) => setProjectId(val || null),
          },
        ]}
      />
    </>
  );

  return (
    <>
      <DataTable
        data={initialFiles}
        columns={columns}
        getRowKey={(f) => f.id}
        searchPlaceholder="Search files…"
        searchExtra={searchExtra}
        pagination={pagination}
        gridCard={(file) => (
          <FileGridCard
            file={file}
            canDelete={canWrite}
            deletingId={deletingId}
            onPreview={setPreviewFile}
            onDelete={handleDelete}
          />
        )}
        gridCols={3}
        infiniteScroll
        loadMore={loadMore}
        emptyTitle="No files found."
        emptyDescription="Try a different search term or upload files from the project detail page."
      />
      <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
    </>
  );
}
