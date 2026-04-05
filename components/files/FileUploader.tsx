"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, X, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useUploadFile,
  useDeleteFile,
  useProjectFiles,
} from "@/core/files/useCase";
import { FileCard } from "./FileCard";

const ACCEPTED_TYPES = [
  "image/*",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "text/csv",
  "application/zip",
  "video/*",
].join(",");

const MAX_SIZE_MB = 5;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

type UploadItem = {
  id: string;
  name: string;
  status: "uploading" | "done" | "error";
  error?: string;
};

type FileUploaderProps = {
  projectId: string;
  canUpload: boolean;
};

export function FileUploader({ projectId, canUpload }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<UploadItem[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: files = [], isLoading } = useProjectFiles(projectId);
  const uploadFile = useUploadFile(projectId);
  const deleteFile = useDeleteFile(projectId);

  const processFiles = useCallback(
    async (fileList: FileList | File[]) => {
      const valid = Array.from(fileList).filter((f) => {
        if (f.size > MAX_SIZE_BYTES) return false;
        return true;
      });

      for (const file of valid) {
        const itemId = crypto.randomUUID();
        setUploadQueue((q) => [
          ...q,
          { id: itemId, name: file.name, status: "uploading" },
        ]);

        try {
          await uploadFile.mutateAsync({ projectId, file });
          setUploadQueue((q) =>
            q.map((item) =>
              item.id === itemId ? { ...item, status: "done" } : item,
            ),
          );
          setTimeout(() => {
            setUploadQueue((q) => q.filter((item) => item.id !== itemId));
          }, 2000);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Upload failed.";
          setUploadQueue((q) =>
            q.map((item) =>
              item.id === itemId
                ? { ...item, status: "error", error: message }
                : item,
            ),
          );
        }
      }
    },
    [projectId, uploadFile],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (!canUpload) return;
      processFiles(e.dataTransfer.files);
    },
    [canUpload, processFiles],
  );

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
      {/* Drop zone — only shown to users who can upload */}
      {canUpload && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex cursor-pointer flex-col items-center gap-2 rounded-card border-2 border-dashed px-6 py-5 text-center transition-all",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/40 hover:bg-muted/30",
          )}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <Upload size={18} className="text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              Drop files here or{" "}
              <span className="text-primary underline-offset-2 hover:underline">
                browse
              </span>
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Images, PDFs, documents, spreadsheets — up to {MAX_SIZE_MB} MB
              each
            </p>
          </div>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={ACCEPTED_TYPES}
            className="hidden"
            onChange={(e) => e.target.files && processFiles(e.target.files)}
          />
        </div>
      )}

      {/* Upload queue */}
      {uploadQueue.length > 0 && (
        <div className="space-y-2">
          {uploadQueue.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 rounded-card border border-border bg-card px-4 py-2.5"
            >
              {item.status === "uploading" && (
                <Loader2
                  size={14}
                  className="shrink-0 animate-spin text-primary"
                />
              )}
              {item.status === "done" && (
                <CheckCircle2 size={14} className="shrink-0 text-success" />
              )}
              {item.status === "error" && (
                <AlertCircle size={14} className="shrink-0 text-danger" />
              )}
              <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                {item.name}
              </span>
              {item.status === "error" && (
                <span className="shrink-0 text-xs text-danger">
                  {item.error}
                </span>
              )}
              {item.status !== "uploading" && (
                <button
                  onClick={() =>
                    setUploadQueue((q) => q.filter((i) => i.id !== item.id))
                  }
                  className="shrink-0 text-muted-foreground hover:text-foreground"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Files list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 size={20} className="animate-spin text-muted-foreground" />
        </div>
      ) : files.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <Upload size={28} className="text-muted-foreground/30" />
          <p className="text-sm font-medium text-muted-foreground">
            No files yet
          </p>
          {canUpload && (
            <p className="text-xs text-muted-foreground/70">
              Upload your first file using the area above.
            </p>
          )}
        </div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {files.map((file) => (
            <FileCard
              key={file.id}
              file={file}
              canDelete={canUpload}
              onDelete={handleDelete}
              isDeleting={deletingId === file.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
