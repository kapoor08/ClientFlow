"use client";

import { Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import type { Control, FieldError, FieldValues, Path } from "react-hook-form";
import { Controller } from "react-hook-form";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getInitials } from "@/utils/getInitilals";

interface IProps<T extends FieldValues> {
  name: Path<T>;
  control: Control<T>;
  label?: string;
  description?: string;
  currentImage?: string | null;
  userName: string;
  maxSize?: number; // in MB
  acceptedFormats?: string[];
  error?: FieldError;
  onImageChange?: (file: File | null, preview: string | null) => void;
}

export const ControlledAvatarInput = <T extends FieldValues>({
  name,
  control,
  label = "Profile Picture",
  description = "JPG, PNG or GIF. Max size 5MB.",
  currentImage,
  userName,
  maxSize = 5,
  acceptedFormats = ["image/jpeg", "image/png", "image/gif", "image/webp"],
  error,
  onImageChange,
}: IProps<T>) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentImage || null);

  // Get user initials for avatar fallback

  // Handle avatar file selection
  const handleAvatarChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    onChange: (value: File | null) => void
  ) => {
    const file = e.target.files?.[0];

    if (file) {
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

      // Set file value in react-hook-form
      onChange(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        const previewUrl = reader.result as string;
        setPreview(previewUrl);
        onImageChange?.(file, previewUrl);
      };
      reader.readAsDataURL(file);
    }

    resetFileInput();
  };

  // Remove avatar
  const handleRemoveAvatar = (onChange: (value: File | null) => void) => {
    onChange(null);
    setPreview(null);
    onImageChange?.(null, null);
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
      render={({ field: { onChange } }) => (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pb-2">
          <Avatar className="h-28 w-28 ring-4 ring-muted">
            <AvatarImage src={preview || undefined} alt={userName} />
            <AvatarFallback className="text-3xl font-semibold">
              {getInitials(userName)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-3">
            <div>
              {label && (
                <h3 className="font-semibold text-base mb-1">{label}</h3>
              )}
              {description && (
                <p className="text-sm text-muted-foreground">{description}</p>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Label
                htmlFor={`${name}-upload`}
                className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
              >
                <Upload className="h-4 w-4" />
                Upload Photo
              </Label>
              <Input
                ref={fileInputRef}
                id={`${name}-upload`}
                type="file"
                accept={acceptedFormats.join(",")}
                className="hidden"
                onChange={(e) => handleAvatarChange(e, onChange)}
              />

              {preview && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleRemoveAvatar(onChange)}
                  className="h-10 cursor-pointer"
                >
                  <X className="h-4 w-4 mr-2" />
                  Remove
                </Button>
              )}
            </div>

            {error && <p className="text-sm text-red-500">{error.message}</p>}
          </div>
        </div>
      )}
    />
  );
};
