"use client";

import { useState, useEffect, type ComponentType } from "react";
import { cn } from "@/utils/cn";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { getFileCategory, type FileCategory } from "@/utils/file";
import ReactMarkdown from "react-markdown";
import {
  X,
  Download,
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  FileSpreadsheet,
  FileCode,
  File,
} from "lucide-react";
import type { PreviewFile } from "./types";

const FILE_TYPE_META: Record<
  FileCategory,
  {
    icon: ComponentType<{ size?: number; className?: string }>;
    iconCls: string;
    bg: string;
  }
> = {
  image: {
    icon: FileImage,
    iconCls: "text-violet-500",
    bg: "bg-violet-50 dark:bg-violet-950/30",
  },
  pdf: {
    icon: FileText,
    iconCls: "text-red-500",
    bg: "bg-red-50 dark:bg-red-950/30",
  },
  video: {
    icon: FileVideo,
    iconCls: "text-purple-500",
    bg: "bg-purple-50 dark:bg-purple-950/30",
  },
  audio: {
    icon: FileAudio,
    iconCls: "text-orange-500",
    bg: "bg-orange-50 dark:bg-orange-950/30",
  },
  office: {
    icon: FileSpreadsheet,
    iconCls: "text-green-600",
    bg: "bg-green-50 dark:bg-green-950/30",
  },
  csv: {
    icon: FileSpreadsheet,
    iconCls: "text-emerald-600",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
  },
  markdown: {
    icon: FileCode,
    iconCls: "text-blue-500",
    bg: "bg-blue-50 dark:bg-blue-950/30",
  },
  text: {
    icon: FileCode,
    iconCls: "text-slate-500 dark:text-slate-400",
    bg: "bg-slate-50 dark:bg-slate-900/40",
  },
  other: { icon: File, iconCls: "text-muted-foreground", bg: "bg-secondary" },
};

export function getFileIcon(mimeType: string | null, fileName: string, size = 28) {
  const cat = getFileCategory(mimeType, fileName);
  const { icon: Icon, iconCls } = FILE_TYPE_META[cat];
  return <Icon size={size} className={cn("shrink-0", iconCls)} />;
}

/** Card thumbnail used in the Files tab grid - colored bg + icon + ext label. */
export function FileTypeThumbnail({
  mimeType,
  fileName,
}: {
  mimeType: string | null;
  fileName: string;
}) {
  const cat = getFileCategory(mimeType, fileName);
  const { icon: Icon, iconCls, bg } = FILE_TYPE_META[cat];
  const ext = fileName.split(".").pop()?.toUpperCase() ?? "";

  return (
    <div
      className={cn(
        "flex h-full w-full flex-col items-center justify-center gap-1 cursor-pointer",
        bg,
      )}
    >
      <Icon size={26} className={iconCls} />
      {ext && (
        <span className={cn("text-[9px] font-bold tracking-widest", iconCls)}>
          {ext}
        </span>
      )}
    </div>
  );
}

function parseCSV(text: string): string[][] {
  return text
    .trim()
    .split("\n")
    .map((row) => {
      const cols: string[] = [];
      let cur = "";
      let inQ = false;
      for (let i = 0; i < row.length; i++) {
        const ch = row[i];
        if (ch === '"') {
          inQ = !inQ;
        } else if (ch === "," && !inQ) {
          cols.push(cur.trim());
          cur = "";
        } else {
          cur += ch;
        }
      }
      cols.push(cur.trim());
      return cols;
    });
}

export function FilePreviewModal({
  file,
  onClose,
}: {
  file: PreviewFile;
  onClose: () => void;
}) {
  const [textContent, setTextContent] = useState<string | null>(null);
  const [csvRows, setCsvRows] = useState<string[][] | null>(null);
  const [fetchError, setFetchError] = useState(false);

  const category = getFileCategory(file.mimeType, file.fileName);
  // Proxy route streams the file server-side, bypassing Cloudinary raw-resource auth (401).
  // Images/video/audio load fine directly from Cloudinary CDN so they keep using src.
  const proxyUrl = `/api/tasks/attachments/proxy?id=${encodeURIComponent(file.id)}`;
  const needsFetch =
    category === "text" || category === "markdown" || category === "csv";
  const officeViewerUrl =
    category === "office"
      ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(file.src)}`
      : null;

  useEffect(() => {
    if (!needsFetch) return;
    setTextContent(null);
    setCsvRows(null);
    setFetchError(false);
    fetch(proxyUrl)
      .then((r) => r.text())
      .then((text) => {
        if (category === "csv") setCsvRows(parseCSV(text));
        else setTextContent(text);
      })
      .catch(() => setFetchError(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file.src]);

  // Nested Radix Dialog so it gets its own portal + overlay outside the parent
  // dialog's DismissableLayer - prevents Radix from treating clicks inside the
  // preview as "outside" interactions on the task-detail dialog.
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        className="w-[92vw] max-w-7xl! p-0 gap-0 flex flex-col overflow-hidden"
        style={{ height: "90vh" }}
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">{file.fileName}</DialogTitle>

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-3 shrink-0">
          {getFileIcon(file.mimeType, file.fileName, 15)}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">
              {file.fileName}
            </p>
            {file.sizeBytes ? (
              <p className="text-[10px] text-muted-foreground">
                {(file.sizeBytes / 1024).toFixed(0)} KB
              </p>
            ) : null}
          </div>
          <a
            href={file.src}
            download={file.fileName}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            title="Download"
          >
            <Download size={13} />
          </a>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <X size={13} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden bg-secondary/20">
          {category === "image" && (
            <div className="flex h-full items-center justify-center p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={file.src}
                alt={file.fileName}
                className="max-h-full max-w-full rounded-lg object-contain shadow"
              />
            </div>
          )}

          {category === "pdf" && (
            <iframe
              src={proxyUrl}
              className="h-full w-full"
              title={file.fileName}
            />
          )}

          {category === "video" && (
            <div className="flex h-full items-center justify-center p-4">
              <video
                src={file.src}
                controls
                className="max-h-full max-w-full rounded-lg shadow"
              />
            </div>
          )}

          {category === "audio" && (
            <div className="flex h-full items-center justify-center p-6">
              <audio src={file.src} controls className="w-full max-w-md" />
            </div>
          )}

          {category === "office" && officeViewerUrl && (
            <iframe
              src={officeViewerUrl}
              className="h-full w-full"
              title={file.fileName}
            />
          )}

          {(category === "markdown" || category === "text") && (
            <div className="h-full overflow-y-auto p-6">
              {fetchError ? (
                <p className="text-sm text-muted-foreground">
                  Unable to load preview.
                </p>
              ) : textContent === null ? (
                <p className="text-sm text-muted-foreground animate-pulse">
                  Loading…
                </p>
              ) : category === "markdown" ? (
                <article className="prose prose-sm max-w-none dark:prose-invert">
                  <ReactMarkdown>{textContent}</ReactMarkdown>
                </article>
              ) : (
                <pre className="whitespace-pre-wrap wrap-break-words font-mono text-xs text-foreground">
                  {textContent}
                </pre>
              )}
            </div>
          )}

          {category === "csv" && (
            <div className="h-full overflow-auto p-4">
              {fetchError ? (
                <p className="text-sm text-muted-foreground">
                  Unable to load preview.
                </p>
              ) : csvRows === null ? (
                <p className="text-sm text-muted-foreground animate-pulse">
                  Loading…
                </p>
              ) : (
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr>
                      {(csvRows[0] ?? []).map((cell, i) => (
                        <th
                          key={i}
                          className="border border-border bg-secondary px-2 py-1.5 text-left font-semibold text-foreground whitespace-nowrap"
                        >
                          {cell}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {csvRows.slice(1).map((row, ri) => (
                      <tr key={ri} className="even:bg-secondary/30">
                        {row.map((cell, ci) => (
                          <td
                            key={ci}
                            className="border border-border px-2 py-1 text-foreground/80 whitespace-nowrap"
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {category === "other" && (
            <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
              <File size={48} className="text-muted-foreground/30" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  Preview not available
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  This file type cannot be previewed in the browser
                </p>
              </div>
              <a
                href={file.src}
                download={file.fileName}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Download size={12} />
                Download file
              </a>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
