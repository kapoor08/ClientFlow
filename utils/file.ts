import type { LucideIcon } from "lucide-react";
import {
  File,
  FileAudio,
  FileCode,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileVideo,
} from "lucide-react";

/**
 * File-related formatting helpers.
 */

export type FileCategory =
  | "image"
  | "pdf"
  | "video"
  | "audio"
  | "office"
  | "markdown"
  | "csv"
  | "text"
  | "other";

/**
 * Formats a byte count as a human-readable string ("1.2 KB", "3.4 MB").
 * Uses 1024-based units. Returns "-" for null/undefined/0.
 */
export function formatBytes(bytes: number | null | undefined): string {
  if (!bytes) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getFileCategory(
  mimeType: string | null,
  fileName: string,
): FileCategory {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  if (mimeType?.startsWith("image/")) return "image";
  if (mimeType === "application/pdf" || ext === "pdf") return "pdf";
  if (mimeType?.startsWith("video/")) return "video";
  if (mimeType?.startsWith("audio/")) return "audio";
  if (
    mimeType?.includes("spreadsheetml") ||
    mimeType?.includes("ms-excel") ||
    mimeType?.includes("wordprocessingml") ||
    mimeType?.includes("presentationml") ||
    mimeType?.includes("msword") ||
    mimeType?.includes("powerpoint") ||
    ["docx", "doc", "xlsx", "xls", "pptx", "ppt"].includes(ext)
  ) {
    return "office";
  }
  if (mimeType === "text/csv" || ext === "csv") return "csv";
  if (mimeType === "text/markdown" || ext === "md" || ext === "mdx") {
    return "markdown";
  }
  if (
    mimeType?.startsWith("text/") ||
    mimeType === "application/json" ||
    [
      "txt",
      "json",
      "js",
      "ts",
      "jsx",
      "tsx",
      "html",
      "css",
      "xml",
      "yaml",
      "yml",
      "sh",
      "py",
      "rb",
      "go",
      "java",
      "c",
      "cpp",
      "h",
      "rs",
    ].includes(ext)
  ) {
    return "text";
  }
  return "other";
}

export function getSimpleFileIcon(
  mimeType: string | null,
  fileName = "",
): LucideIcon {
  switch (getFileCategory(mimeType, fileName)) {
    case "image":
      return FileImage;
    case "video":
      return FileVideo;
    case "audio":
      return FileAudio;
    case "office":
    case "csv":
      return FileSpreadsheet;
    case "markdown":
    case "text":
      return FileCode;
    case "pdf":
      return FileText;
    default:
      return File;
  }
}
