"use client";

import { useEffect, useState } from "react";
import { Download, FileX, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export type PreviewFile = {
  fileName: string;
  storageUrl: string;
  mimeType: string | null;
};

type PreviewKind = "image" | "video" | "pdf" | "markdown" | "text" | "office" | "unsupported";

function isMarkdown(mimeType: string | null, fileName: string): boolean {
  if (mimeType === "text/markdown" || mimeType === "text/x-markdown" || mimeType === "text/md")
    return true;
  const ext = fileName.split(".").pop()?.toLowerCase();
  return ext === "md" || ext === "mdx" || ext === "markdown";
}

function getPreviewKind(mimeType: string | null, fileName: string): PreviewKind {
  // Check filename extension first - MIME type may be null or generic from the storage provider
  if (isMarkdown(mimeType, fileName)) return "markdown";
  if (!mimeType) return "unsupported";
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType.startsWith("text/")) return "text";
  if (
    mimeType.includes("wordprocessingml") ||
    mimeType.includes("spreadsheetml") ||
    mimeType.includes("presentationml") ||
    mimeType === "application/msword" ||
    mimeType === "application/vnd.ms-excel" ||
    mimeType === "application/vnd.ms-powerpoint"
  )
    return "office";
  return "unsupported";
}

type FilePreviewModalProps = {
  file: PreviewFile | null;
  onClose: () => void;
};

export function FilePreviewModal({ file, onClose }: FilePreviewModalProps) {
  const [textContent, setTextContent] = useState<string | null>(null);
  const [textLoading, setTextLoading] = useState(false);

  const kind = file ? getPreviewKind(file.mimeType, file.fileName) : null;

  useEffect(() => {
    if (!file || (kind !== "text" && kind !== "markdown")) {
      setTextContent(null);
      return;
    }
    setTextLoading(true);
    fetch(file.storageUrl)
      .then((r) => r.text())
      .then(setTextContent)
      .catch(() => setTextContent("Failed to load file content."))
      .finally(() => setTextLoading(false));
  }, [file, kind]);

  return (
    <Dialog open={!!file} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[92vh] w-[92vw] max-w-[92vw] flex-col gap-0 overflow-hidden p-0 sm:max-w-[92vw]">
        {/* Header */}
        <DialogHeader className="border-border flex shrink-0 flex-row items-center justify-between border-b px-5 py-3 pr-12">
          <DialogTitle
            className="max-w-[calc(100%-7rem)] truncate text-sm font-medium"
            title={file?.fileName}
          >
            {file?.fileName}
          </DialogTitle>
          <a
            href={file?.storageUrl}
            target="_blank"
            rel="noopener noreferrer"
            download={file?.fileName}
          >
            <Button variant="outline" size="sm" className="shrink-0 cursor-pointer">
              <Download size={13} className="mr-1.5" />
              Download
            </Button>
          </a>
        </DialogHeader>

        {/* Preview area */}
        <div className="min-h-0 flex-1 overflow-auto">
          {/* Image */}
          {kind === "image" && (
            <div className="flex h-full min-h-[60vh] items-center justify-center p-6">
              {/* P3-5: raw <img> is intentional here - an on-demand full-size
                  preview of a user-uploaded file of arbitrary intrinsic
                  dimensions (already served from the Cloudinary CDN), so
                  next/image's fixed-size optimization does not apply. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={file!.storageUrl}
                alt={file!.fileName}
                className="max-h-[75vh] max-w-full rounded-lg object-contain shadow-md"
              />
            </div>
          )}

          {/* Video */}
          {kind === "video" && (
            <div className="flex items-center justify-center p-6">
              <video
                src={file!.storageUrl}
                controls
                className="max-h-[75vh] max-w-full rounded-lg"
              />
            </div>
          )}

          {/* PDF - rendered inline by browser */}
          {kind === "pdf" && (
            <iframe
              src={file!.storageUrl}
              title={file!.fileName}
              className="h-[78vh] w-full border-0"
            />
          )}

          {/* Office docs - Google Docs Viewer */}
          {kind === "office" && (
            <div className="flex h-[78vh] flex-col">
              <iframe
                src={`https://docs.google.com/viewer?url=${encodeURIComponent(file!.storageUrl)}&embedded=true`}
                title={file!.fileName}
                className="h-full w-full border-0"
              />
              <p className="border-border text-muted-foreground shrink-0 border-t px-4 py-2 text-center text-[11px]">
                Powered by Google Docs Viewer · If the preview doesn&apos;t load,{" "}
                <a
                  href={file!.storageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="hover:text-foreground underline underline-offset-2"
                >
                  download the file
                </a>
              </p>
            </div>
          )}

          {/* Markdown - rendered with react-markdown */}
          {kind === "markdown" && (
            <div className="p-6">
              {textLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 size={20} className="text-muted-foreground animate-spin" />
                </div>
              ) : (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({ children }) => (
                      <h1 className="font-display text-foreground mt-6 mb-4 text-2xl font-bold first:mt-0">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="font-display text-foreground mt-5 mb-3 text-xl font-semibold">
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="font-display text-foreground mt-4 mb-2 text-base font-semibold">
                        {children}
                      </h3>
                    ),
                    p: ({ children }) => (
                      <p className="text-foreground/90 mb-3 text-sm leading-relaxed">{children}</p>
                    ),
                    a: ({ href, children }) => (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline underline-offset-2 hover:opacity-80"
                      >
                        {children}
                      </a>
                    ),
                    ul: ({ children }) => (
                      <ul className="text-foreground/90 mb-3 ml-5 list-disc space-y-1 text-sm">
                        {children}
                      </ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="text-foreground/90 mb-3 ml-5 list-decimal space-y-1 text-sm">
                        {children}
                      </ol>
                    ),
                    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                    blockquote: ({ children }) => (
                      <blockquote className="border-border text-muted-foreground mb-3 border-l-4 pl-4 text-sm italic">
                        {children}
                      </blockquote>
                    ),
                    code: ({ className, children, ...props }) => {
                      const isBlock = className?.includes("language-");
                      return isBlock ? (
                        <code
                          className={`bg-muted text-foreground block overflow-x-auto rounded-lg px-4 py-3 font-mono text-xs leading-relaxed ${className}`}
                          {...props}
                        >
                          {children}
                        </code>
                      ) : (
                        <code
                          className="bg-muted text-foreground rounded px-1.5 py-0.5 font-mono text-xs"
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    },
                    pre: ({ children }) => (
                      <pre className="bg-muted mb-3 overflow-x-auto rounded-lg p-0">{children}</pre>
                    ),
                    hr: () => <hr className="border-border my-4" />,
                    table: ({ children }) => (
                      <div className="mb-3 overflow-x-auto">
                        <table className="w-full border-collapse text-sm">{children}</table>
                      </div>
                    ),
                    th: ({ children }) => (
                      <th className="border-border bg-muted text-foreground border px-3 py-2 text-left text-xs font-semibold">
                        {children}
                      </th>
                    ),
                    td: ({ children }) => (
                      <td className="border-border text-foreground/80 border px-3 py-2 text-sm">
                        {children}
                      </td>
                    ),
                    img: ({ src, alt }) => (
                      // P3-5: markdown-authored image with an arbitrary host and
                      // unknown dimensions - next/image cannot be used here.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={src} alt={alt} className="my-3 max-w-full rounded-lg" />
                    ),
                  }}
                >
                  {textContent ?? ""}
                </ReactMarkdown>
              )}
            </div>
          )}

          {/* Plain text / CSV */}
          {kind === "text" && (
            <div className="p-5">
              {textLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 size={20} className="text-muted-foreground animate-spin" />
                </div>
              ) : (
                <pre className="wrap-break-words text-foreground font-mono text-sm leading-relaxed whitespace-pre-wrap">
                  {textContent}
                </pre>
              )}
            </div>
          )}

          {/* Unsupported */}
          {kind === "unsupported" && (
            <div className="flex flex-col items-center gap-4 py-20 text-center">
              <div className="bg-muted flex h-16 w-16 items-center justify-center rounded-full">
                <FileX size={28} className="text-muted-foreground" />
              </div>
              <div>
                <p className="text-foreground text-sm font-medium">Preview not available</p>
                <p className="text-muted-foreground mt-1 text-xs">
                  This file type cannot be previewed in the browser.
                </p>
              </div>
              <a
                href={file!.storageUrl}
                target="_blank"
                rel="noopener noreferrer"
                download={file!.fileName}
              >
                <Button>
                  <Download size={13} className="mr-1.5" />
                  Download File
                </Button>
              </a>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
