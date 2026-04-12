"use client";

import { Upload, X } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import type { Control, FieldError, FieldValues, Path } from "react-hook-form";
import { Controller } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface IProps<T extends FieldValues> {
  name: Path<T>;
  control: Control<T>;
  label?: string;
  description?: string;
  currentImage?: string | null;
  maxSize?: number; // in MB
  acceptedFormats?: string[];
  error?: FieldError;
  onImageChange?: (preview: string | null) => void;
}

// Helper to detect if string is base64
function isBase64(str: string): boolean {
  try {
    return btoa(atob(str)) === str;
  } catch {
    return false;
  }
}

// Helper to get preview URL - handles URLs, Google Drive links, and base64
function getPreviewUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  if (value.startsWith("data:")) return value; // base64
  if (value.startsWith("http")) return value; // URL
  // Try to detect if it's base64
  if (isBase64(value)) return `data:image/png;base64,${value}`;
  return null;
}

// Helper to convert Google Drive URL to preview embed URL
function getGoogleDrivePreviewUrl(url: string): string {
  let fileId = url.match(/\/d\/([a-zA-Z0-9_-]+)/)?.[1];
  if (!fileId) {
    fileId = url.match(/[?&]id=([a-zA-Z0-9_-]+)/)?.[1];
  }
  return fileId ? `https://drive.google.com/file/d/${fileId}/preview` : url;
}

// Helper to validate URL
function isValidUrl(str: string): boolean {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

export const ControlledThumbnailInput = <T extends FieldValues>({
  name,
  control,
  label = "Thumbnail",
  description = "JPG, PNG or JPEG. Max size 5MB. Or paste an image URL, Google Drive link, or base64 string (will upload to Cloudinary on form submit).",
  currentImage,
  maxSize = 5,
  acceptedFormats = ["image/jpeg", "image/png", "image/jpeg"],
  error,
  onImageChange,
}: IProps<T>) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(
    getPreviewUrl(currentImage) || null
  );
  const [inputMode, setInputMode] = useState<"upload" | "url">(
    currentImage && isValidUrl(currentImage) ? "url" : "upload"
  );

  // Handle file upload
  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    onChange: (value: string | null) => void
  ) => {
    const file = e.target.files?.[0];

    if (!file) {
      resetFileInput();
      return;
    }

    // Validate file type
    if (!acceptedFormats.includes(file.type)) {
      toast.error(
        `Please select a valid image file (${acceptedFormats
          .map((f) => f.split("/")[1].toUpperCase())
          .join(", ")})`
      );
      resetFileInput();
      return;
    }

    // Validate file size
    const maxSizeBytes = maxSize * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      toast.error(`Image size must be less than ${maxSize}MB`);
      resetFileInput();
      return;
    }

    // Convert to base64 for preview and form storage (will upload to Cloudinary on form submit)
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      onChange(base64String);
      setPreview(base64String);
      onImageChange?.(base64String);
    };
    reader.readAsDataURL(file);

    resetFileInput();
  };

  // Handle URL input
  const handleUrlChange = (
    url: string,
    onChange: (value: string | null) => void
  ) => {
    const trimmedUrl = url.trim();

    if (!trimmedUrl) {
      onChange(null);
      setPreview(null);
      onImageChange?.(null);
      return;
    }

    // Accept base64 strings (will upload to Cloudinary on form submit)
    if (trimmedUrl.startsWith("data:image/")) {
      onChange(trimmedUrl);
      setPreview(trimmedUrl);
      onImageChange?.(trimmedUrl);
      return;
    }

    // Handle regular URLs and Google Drive links
    if (isValidUrl(trimmedUrl) || trimmedUrl.includes("drive.google.com")) {
      onChange(trimmedUrl);
      setPreview(trimmedUrl);
      onImageChange?.(trimmedUrl);
    } else {
      toast.error("Please enter a valid URL, Google Drive link, or base64 image");
    }
  };

  // Remove image
  const handleRemoveImage = (onChange: (value: string | null) => void) => {
    onChange(null);
    setPreview(null);
    onImageChange?.(null);
    resetFileInput();
  };

  // Reset file input
  const resetFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { onChange, value } }) => (
        <div className="space-y-4">
          <div>
            {label && <h3 className="font-semibold text-base mb-1">{label}</h3>}
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>

          <Tabs
            defaultValue={inputMode}
            onValueChange={(v) => setInputMode(v as "upload" | "url")}
          >
            <TabsList>
              <TabsTrigger value="upload">Upload</TabsTrigger>
              <TabsTrigger value="url">URL</TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-3">
              <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50 transition">
                <Label
                  htmlFor={`${name}-upload`}
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    Click to upload or drag and drop
                  </span>
                  <span className="text-xs text-muted-foreground">
                    PNG, JPG or WebP (max {maxSize}MB)
                  </span>
                  <span className="text-xs text-muted-foreground font-medium">
                    Recommended: 1200 × 600 pixels
                  </span>
                </Label>
                <Input
                  ref={fileInputRef}
                  id={`${name}-upload`}
                  type="file"
                  accept={acceptedFormats.join(",")}
                  className="hidden"
                  onChange={(e) => handleFileChange(e, onChange)}
                />
              </div>
            </TabsContent>

            <TabsContent value="url" className="space-y-3">
              <Input
                type="text"
                placeholder="https://example.com/image.jpg or Google Drive link"
                defaultValue={
                  value && isValidUrl(value)
                    ? value
                    : value?.startsWith("data:")
                    ? ""
                    : value || ""
                }
                onChange={(e) => handleUrlChange(e.target.value, onChange)}
                className="w-full"
              />
            </TabsContent>
          </Tabs>

          {/* Thumbnail Preview */}
          {preview && (
            <div className="space-y-2">
              <div className="relative w-full max-w-sm aspect-video rounded-lg overflow-hidden border bg-muted">
                {preview.includes("drive.google.com") ? (
                  <iframe
                    src={getGoogleDrivePreviewUrl(preview)}
                    title="Thumbnail preview"
                    className="w-full h-full border-0"
                    allowFullScreen
                  />
                ) : (
                  <Image
                    src={preview}
                    alt="Thumbnail preview"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleRemoveImage(onChange)}
                className="w-full cursor-pointer"
              >
                <X className="h-4 w-4 mr-2" />
                Remove Image
              </Button>
            </div>
          )}

          {error && <p className="text-sm text-red-500">{error.message}</p>}
        </div>
      )}
    />
  );
};
