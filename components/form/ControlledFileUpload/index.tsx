"use client";

import { ExternalLink, File, FileText, Upload, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  Control,
  FieldError,
  FieldErrorsImpl,
  FieldValues,
  Merge,
  Path,
} from "react-hook-form";
import { Controller } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// File item with preview information
export interface FileItem {
  id: string;
  file: File | null;
  preview: string;
  isExisting: boolean;
  url?: string;
  fileName?: string;
  fileSize?: number;
}

// Type for array field errors
type ArrayFieldError =
  | FieldError
  | Merge<
      FieldError,
      (FieldError | Merge<FieldError, FieldErrorsImpl<any>> | undefined)[]
    >;

export interface ControlledFileUploadProps<T extends FieldValues> {
  name: Path<T>;
  control: Control<T>;
  label?: string;
  description?: string;
  error?: ArrayFieldError;
  multiple?: boolean;
  maxFiles?: number;
  maxSize?: number; // in MB
  acceptedFormats?: string[];
  existingFiles?: Array<{
    id: string;
    url: string;
    fileName: string | null;
  }>;
  onFilesChange?: (files: FileItem[]) => void;
  className?: string;
}

// Generate unique ID
const generateId = () => Math.random().toString(36).substr(2, 9);

// Format file size to human readable
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
};

// Get file extension
const getFileExtension = (fileName: string): string => {
  return fileName.split(".").pop()?.toUpperCase() || "FILE";
};

// Check if file is an image
const isImageFile = (file: File | null, preview: string, fileName?: string): boolean => {
  if (file) {
    return file.type.startsWith("image/");
  }
  // For existing files, check the fileName first (more reliable), then URL
  const checkString = (fileName || preview).toLowerCase();
  return (
    checkString.endsWith(".jpg") ||
    checkString.endsWith(".jpeg") ||
    checkString.endsWith(".png") ||
    checkString.endsWith(".gif") ||
    checkString.endsWith(".webp")
  );
};

// Check if file is a PDF
const isPdfFile = (file: File | null, preview: string): boolean => {
  if (file) {
    return file.type === "application/pdf";
  }
  return preview.toLowerCase().endsWith(".pdf");
};

export const ControlledFileUpload = <T extends FieldValues>({
  name,
  control,
  label,
  description,
  error,
  multiple = false,
  maxFiles = 5,
  maxSize = 5,
  acceptedFormats = [
    "image/jpeg",
    "image/png",
    "image/jpg",
    "image/gif",
    "image/webp",
    "application/pdf",
  ],
  existingFiles = [],
  onFilesChange,
  className,
}: ControlledFileUploadProps<T>) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize files from existing files
  const initialFiles = useMemo((): FileItem[] => {
    if (existingFiles && existingFiles.length > 0) {
      return existingFiles.map((file) => ({
        id: file.id,
        file: null,
        preview: file.url,
        isExisting: true,
        url: file.url,
        fileName: file.fileName || undefined,
      }));
    }
    return [];
  }, [existingFiles]);

  const [files, setFiles] = useState<FileItem[]>(initialFiles);
  const [isDragging, setIsDragging] = useState(false);
  const dragCounterRef = useRef(0);

  // Sync with initial files when they change
  useEffect(() => {
    if (existingFiles && existingFiles.length > 0 && files.length === 0) {
      setFiles(initialFiles);
    }
  }, [existingFiles, initialFiles, files.length]);

  // Update form value when files change
  const updateFormValue = useCallback(
    (newFiles: FileItem[], onChange: (value: FileItem[]) => void) => {
      setFiles(newFiles);
      onChange(newFiles);
      onFilesChange?.(newFiles);
    },
    [onFilesChange],
  );

  // Process files (shared logic for both file input and drag-drop)
  const processFiles = (
    selectedFiles: File[],
    onChange: (value: FileItem[]) => void,
  ) => {
    if (selectedFiles.length === 0) return;

    const maxSizeBytes = maxSize * 1024 * 1024;
    const effectiveMaxFiles = multiple ? maxFiles : 1;

    // Check if adding these files would exceed the limit
    const remainingSlots = effectiveMaxFiles - files.length;
    if (selectedFiles.length > remainingSlots) {
      toast.error(
        multiple
          ? `You can only add ${remainingSlots} more file(s). Maximum ${effectiveMaxFiles} files allowed.`
          : "Only one file is allowed.",
      );
      resetFileInput();
      return;
    }

    const newFileItems: FileItem[] = [];

    for (const file of selectedFiles) {
      // Validate file type
      if (!acceptedFormats.includes(file.type)) {
        const formatNames = acceptedFormats
          .map((f) => f.split("/")[1]?.toUpperCase() || f)
          .join(", ");
        toast.error(
          `${file.name}: Invalid file type. Accepted: ${formatNames}`,
        );
        continue;
      }

      // Validate file size
      if (file.size > maxSizeBytes) {
        toast.error(`${file.name}: File size must be less than ${maxSize}MB`);
        continue;
      }

      // Create preview URL
      let preview: string;
      if (file.type === "application/pdf") {
        preview = "pdf:" + file.name;
      } else {
        preview = URL.createObjectURL(file);
      }

      newFileItems.push({
        id: generateId(),
        file,
        preview,
        isExisting: false,
        fileName: file.name,
        fileSize: file.size,
      });
    }

    if (newFileItems.length > 0) {
      const updatedFiles = multiple
        ? [...files, ...newFileItems]
        : newFileItems;
      updateFormValue(updatedFiles, onChange);
    }

    resetFileInput();
  };

  // Handle file selection from input
  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    onChange: (value: FileItem[]) => void,
  ) => {
    const selectedFiles = Array.from(e.target.files || []);
    processFiles(selectedFiles, onChange);
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (dragCounterRef.current === 1) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDrop = (
    e: React.DragEvent<HTMLDivElement>,
    onChange: (value: FileItem[]) => void,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    processFiles(droppedFiles, onChange);
  };

  // Remove a file
  const handleRemoveFile = (
    fileId: string,
    onChange: (value: FileItem[]) => void,
  ) => {
    const fileToRemove = files.find((f) => f.id === fileId);
    if (
      fileToRemove &&
      !fileToRemove.isExisting &&
      fileToRemove.preview.startsWith("blob:")
    ) {
      URL.revokeObjectURL(fileToRemove.preview);
    }

    const updatedFiles = files.filter((f) => f.id !== fileId);
    updateFormValue(updatedFiles, onChange);
  };

  // Reset file input
  const resetFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Get accept string for input
  const acceptString = acceptedFormats.join(",");

  // Calculate effective max files
  const effectiveMaxFiles = multiple ? maxFiles : 1;
  const canAddMore = files.length < effectiveMaxFiles;

  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { onChange, value } }) => {
        // Sync internal state with form value when it changes externally
        useEffect(() => {
          if (value && Array.isArray(value) && value.length > 0) {
            setFiles(value);
          } else if (!value || (Array.isArray(value) && value.length === 0)) {
            // Don't clear files if they have existing attachments
            const hasExistingFiles = files.some(f => f.isExisting);
            if (!hasExistingFiles) {
              setFiles([]);
            }
          }
        }, [value]);

        return (
        <div className={`grid gap-2 ${className || ""}`}>
          {label && <Label>{label}</Label>}
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}

          {/* Upload Area */}
          {canAddMore && (
            <div
              className="relative"
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, onChange)}
            >
              <Input
                ref={fileInputRef}
                type="file"
                accept={acceptString}
                multiple={multiple}
                onChange={(e) => handleFileSelect(e, onChange)}
                className="hidden"
                id={`${name}-upload`}
              />
              <label
                htmlFor={`${name}-upload`}
                className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                  isDragging
                    ? "border-primary bg-primary/10"
                    : "border-muted-foreground/25 bg-muted/10 hover:bg-muted/20"
                }`}
              >
                <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold">Click to upload</span> or drag
                  and drop
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {multiple
                    ? files.length > 0
                      ? `${files.length} of ${effectiveMaxFiles} files uploaded`
                      : `Up to ${effectiveMaxFiles} files`
                    : files.length > 0
                      ? "Replace current file"
                      : "Select a file"}
                </p>
              </label>
            </div>
          )}

          {/* Files List */}
          {files.length > 0 && (
            <div className={multiple ? "flex flex-wrap gap-3 mt-2" : "mt-2"}>
              {files.map((fileItem) => {
                const fileName =
                  fileItem.fileName ||
                  fileItem.file?.name ||
                  (fileItem.preview.startsWith("pdf:")
                    ? fileItem.preview.replace("pdf:", "")
                    : "File");
                const isImage = isImageFile(fileItem.file, fileItem.preview, fileName);
                const isPdf = isPdfFile(fileItem.file, fileItem.preview);
                const fileSize = fileItem.fileSize || fileItem.file?.size;

                // Single file - larger preview
                if (!multiple) {
                  return (
                    <div
                      key={fileItem.id}
                      className="relative border rounded-lg bg-muted/10 overflow-hidden"
                    >
                      {isImage && !fileItem.preview.startsWith("pdf:") ? (
                        <div className="relative w-full h-48">
                          <Image
                            src={fileItem.preview}
                            alt={fileName}
                            fill
                            unoptimized
                            className="object-contain"
                          />
                        </div>
                      ) : isPdf || fileItem.preview.startsWith("pdf:") ? (
                        <div className="flex items-center justify-center w-full h-32 bg-red-50 dark:bg-red-900/20">
                          <FileText className="h-12 w-12 text-red-600 dark:text-red-400" />
                        </div>
                      ) : (
                        <div className="flex items-center justify-center w-full h-32 bg-muted">
                          <File className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                      <div className="p-3 border-t">
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">
                              {fileName}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              {fileSize && (
                                <span>{formatFileSize(fileSize)}</span>
                              )}
                              {fileSize && <span>•</span>}
                              <span>{getFileExtension(fileName)}</span>
                              {fileItem.isExisting && fileItem.url && (
                                <>
                                  <span>•</span>
                                  <a
                                    href={fileItem.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline inline-flex items-center gap-1"
                                  >
                                    View <ExternalLink className="h-3 w-3" />
                                  </a>
                                </>
                              )}
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              handleRemoveFile(fileItem.id, onChange)
                            }
                            className="h-8 w-8 shrink-0 cursor-pointer"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                }

                // Multiple files - compact cards in flex row
                return (
                  <div
                    key={fileItem.id}
                    className="relative flex flex-col border rounded-lg bg-muted/10 overflow-hidden w-36 shrink-0"
                  >
                    {/* Remove Button */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveFile(fileItem.id, onChange)}
                      className="absolute top-1 right-1 h-6 w-6 bg-background/80 hover:bg-background cursor-pointer z-10"
                    >
                      <X className="h-3 w-3" />
                    </Button>

                    {/* Preview/Icon */}
                    {isImage && !fileItem.preview.startsWith("pdf:") ? (
                      <div className="relative w-full h-24 bg-muted">
                        <Image
                          src={fileItem.preview}
                          alt={fileName}
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      </div>
                    ) : isPdf || fileItem.preview.startsWith("pdf:") ? (
                      <div className="flex items-center justify-center w-full h-24 bg-red-50 dark:bg-red-900/20">
                        <FileText className="h-8 w-8 text-red-600 dark:text-red-400" />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center w-full h-24 bg-muted">
                        <File className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}

                    {/* File Info */}
                    <div className="p-2 border-t">
                      <p
                        className="text-xs font-medium truncate"
                        title={fileName}
                      >
                        {fileName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {fileSize
                          ? formatFileSize(fileSize)
                          : getFileExtension(fileName)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Max files info */}
          {multiple && files.length >= effectiveMaxFiles && (
            <p className="text-sm text-muted-foreground text-center py-2">
              Maximum {effectiveMaxFiles} files reached. Remove a file to add
              more.
            </p>
          )}

          {/* Error */}
          {error && "message" in error && error.message && (
            <p className="text-sm text-destructive">{error.message}</p>
          )}
        </div>
        );
      }}
    />
  );
};
