"use client";

import { Upload, X } from "lucide-react";
import Image from "next/image";
import { useRef, useState, useEffect } from "react";
import type { Control, FieldError, FieldValues, Path } from "react-hook-form";
import { Controller } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface IProps<T extends FieldValues> {
  name: Path<T>;
  control: Control<T>;
  label?: string;
  description?: string;
  currentLogo?: string | null;
  maxSize?: number; // in MB
  error?: FieldError;
  onLogoChange?: (file: File | null, preview: string | null, shouldDelete: boolean) => void;
}

export const ControlledLogoUpload = <T extends FieldValues>({
  name,
  control,
  label = "Site Logo",
  description = "PNG, JPG or JPEG. Max size 5MB. Recommended dimensions: 200x60px.",
  currentLogo,
  maxSize = 5,
  error,
  onLogoChange,
}: IProps<T>) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentLogo || null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [shouldDelete, setShouldDelete] = useState(false);

  // Reset preview when currentLogo changes (e.g., after save)
  useEffect(() => {
    if (currentLogo && !pendingFile) {
      setPreview(currentLogo);
      setShouldDelete(false);
    }
  }, [currentLogo, pendingFile]);

  // Handle file selection
  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    onChange: (value: { file: File | null; shouldDelete: boolean }) => void
  ) => {
    const file = e.target.files?.[0];

    if (file) {
      // Validate file type
      const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Please select a PNG, JPG, or JPEG file");
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

      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        const previewUrl = reader.result as string;
        setPreview(previewUrl);
        setPendingFile(file);
        setShouldDelete(false);

        // Update form value
        onChange({ file, shouldDelete: false });
        onLogoChange?.(file, previewUrl, false);

        toast.success("Logo selected. Click 'Save Changes' to upload.");
      };
      reader.readAsDataURL(file);
    }

    resetFileInput();
  };

  // Remove logo (mark for deletion)
  const handleRemoveLogo = (onChange: (value: { file: File | null; shouldDelete: boolean }) => void) => {
    setPreview(null);
    setPendingFile(null);
    setShouldDelete(true);
    resetFileInput();

    // Update form value
    onChange({ file: null, shouldDelete: true });
    onLogoChange?.(null, null, true);

    toast.success("Logo marked for removal. Click 'Save Changes' to confirm.");
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
        <div className="space-y-4">
          <div>
            {label && <Label className="text-base font-semibold">{label}</Label>}
            {description && (
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            )}
          </div>

          {/* Upload Area */}
          {!preview && !shouldDelete && (
            <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50 transition">
              <Label
                htmlFor={`${name}-upload`}
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <Upload className="h-8 w-8 text-muted-foreground" />
                <span className="text-sm font-medium">
                  Click to select logo
                </span>
                <span className="text-xs text-muted-foreground">
                  PNG, JPG or JPEG (max {maxSize}MB)
                </span>
              </Label>
              <Input
                ref={fileInputRef}
                id={`${name}-upload`}
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                className="hidden"
                onChange={(e) => handleFileChange(e, onChange)}
              />
            </div>
          )}

          {/* Logo Preview */}
          {preview && !shouldDelete && (
            <div className="space-y-3">
              <div className="relative w-full max-w-sm rounded-lg overflow-hidden border bg-muted/10 p-6">
                <div className="relative h-20 w-full flex items-center justify-center">
                  <Image
                    src={preview}
                    alt="Site logo preview"
                    width={200}
                    height={60}
                    className="object-contain max-h-20"
                    unoptimized
                  />
                </div>
                {pendingFile && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 text-center">
                    Pending upload - Click "Save Changes" to upload
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Label
                  htmlFor={`${name}-upload`}
                  className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                >
                  <Upload className="h-4 w-4" />
                  Change Logo
                </Label>
                <Input
                  ref={fileInputRef}
                  id={`${name}-upload`}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  className="hidden"
                  onChange={(e) => handleFileChange(e, onChange)}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleRemoveLogo(onChange)}
                  className="cursor-pointer"
                >
                  <X className="h-4 w-4 mr-2" />
                  Remove Logo
                </Button>
              </div>
            </div>
          )}

          {/* Deletion Notice */}
          {shouldDelete && (
            <div className="border border-red-200 dark:border-red-800 rounded-lg p-4 bg-red-50 dark:bg-red-900/10">
              <p className="text-sm text-red-600 dark:text-red-400 mb-3">
                Logo marked for deletion. Click "Save Changes" to confirm removal.
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShouldDelete(false);
                  setPreview(currentLogo || null);
                  onChange({ file: null, shouldDelete: false });
                  onLogoChange?.(null, currentLogo || null, false);
                }}
                className="cursor-pointer"
              >
                Cancel Deletion
              </Button>
            </div>
          )}

          {error && <p className="text-sm text-red-500">{error.message}</p>}
        </div>
      )}
    />
  );
};
