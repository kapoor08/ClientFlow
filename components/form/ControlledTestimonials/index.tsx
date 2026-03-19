"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, Trash2, Upload, X } from "lucide-react";
import type * as React from "react";
import { useState } from "react";
import {
  type Control,
  Controller,
  type FieldError,
  useController,
  useFieldArray,
} from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
// Removed direct cloudinary import - using API endpoint instead

export interface Testimonial {
  id: string;
  text: string;
  name: string;
  designation: string;
  isVerified: boolean;
  imageUrl?: string;
}

export interface ControlledTestimonialsProps {
  name: string;
  label?: string;
  control: Control<any>;
  error?: FieldError;
  description?: string;
  className?: string;
}

interface SortableTestimonialItemProps {
  control: Control<any>;
  fieldName: string;
  itemId: string;
  index: number;
  onRemove: () => void;
  canRemove: boolean;
}

const SortableTestimonialItem: React.FC<SortableTestimonialItemProps> = ({
  control,
  fieldName,
  itemId,
  index,
  onRemove,
  canRemove,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const { field: textField, fieldState: { error: textError } } = useController({
    control,
    name: `${fieldName}.text`,
  });

  const { field: nameField, fieldState: { error: nameError } } = useController({
    control,
    name: `${fieldName}.name`,
  });

  const { field: designationField, fieldState: { error: designationError } } = useController({
    control,
    name: `${fieldName}.designation`,
  });

  const { field: verifiedField } = useController({
    control,
    name: `${fieldName}.isVerified`,
  });

  const { field: imageUrlField, fieldState: { error: imageUrlError } } = useController({
    control,
    name: `${fieldName}.imageUrl`,
  });

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: itemId,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setUploadError("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("File size must be less than 5MB");
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      // Create FormData for API upload
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "testimonials/avatars");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Upload failed");
      }

      if (result.success && result.data) {
        imageUrlField.onChange(result.data.secureUrl);
      } else {
        throw new Error("Invalid response from upload API");
      }

      setIsUploading(false);
    } catch (error: any) {
      console.error("Upload error:", error);
      setUploadError(
        error.message || "Failed to upload image. Please try again.",
      );
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    imageUrlField.onChange("");
  };

  return (
    <Card ref={setNodeRef} style={style} className="relative py-0 gap-2">
      <CardHeader className="pb-1 pt-2 px-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 cursor-grab active:cursor-grabbing"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-3 w-3 text-muted-foreground" />
            </Button>
            <span className="text-xs font-medium text-muted-foreground">
              Testimonial {index + 1}
            </span>
          </div>
          {canRemove && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onRemove}
              className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0 pb-2 px-3 space-y-2">
        {/* Avatar Upload */}
        <div className="space-y-1">
          <Label className="text-xs">Avatar</Label>
          <div className="flex items-center gap-3">
            {imageUrlField.value ? (
              <div className="relative">
                <img
                  src={imageUrlField.value}
                  alt={nameField.value || "Avatar"}
                  className="w-12 h-12 rounded-full object-cover border-2 border-border"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveImage}
                  className="absolute -top-1 -right-1 h-5 w-5 p-0 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div className="w-12 h-12 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                <Upload className="h-4 w-4 text-muted-foreground" />
              </div>
            )}

            <div className="flex-1">
              <Input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={isUploading}
                className={`h-8 text-xs cursor-pointer ${imageUrlError ? 'border-destructive' : ''}`}
              />
              {imageUrlError && (
                <p className="text-xs text-destructive mt-1">{imageUrlError.message}</p>
              )}
              {uploadError && !imageUrlError && (
                <p className="text-xs text-destructive mt-1">{uploadError}</p>
              )}
              {isUploading && (
                <p className="text-xs text-muted-foreground mt-1">
                  Uploading...
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Testimonial Text */}
        <div className="space-y-1">
          <Label htmlFor={`testimonial-${fieldName}-text`} className="text-xs">
            Testimonial Text *
          </Label>
          <Textarea
            id={`testimonial-${fieldName}-text`}
            {...textField}
            placeholder="Share your experience with our platform..."
            rows={3}
            className={`text-sm resize-none ${textError ? 'border-destructive focus-visible:ring-destructive' : ''}`}
          />
          {textError && (
            <p className="text-xs text-destructive mt-1">{textError.message}</p>
          )}
        </div>

        {/* Name and Designation */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label
              htmlFor={`testimonial-${fieldName}-name`}
              className="text-xs"
            >
              Name *
            </Label>
            <Input
              id={`testimonial-${fieldName}-name`}
              {...nameField}
              placeholder="e.g., Marie Jane"
              className={`h-8 ${nameError ? 'border-destructive focus-visible:ring-destructive' : ''}`}
            />
            {nameError && (
              <p className="text-xs text-destructive mt-1">{nameError.message}</p>
            )}
          </div>
          <div className="space-y-1">
            <Label
              htmlFor={`testimonial-${fieldName}-designation`}
              className="text-xs"
            >
              Designation *
            </Label>
            <Input
              id={`testimonial-${fieldName}-designation`}
              {...designationField}
              placeholder="e.g., CFO at Movix"
              className={`h-8 ${designationError ? 'border-destructive focus-visible:ring-destructive' : ''}`}
            />
            {designationError && (
              <p className="text-xs text-destructive mt-1">{designationError.message}</p>
            )}
          </div>
        </div>

        {/* Verified Switch */}
        <div className="flex items-center gap-4 mt-4 mb-1">
          <Label
            htmlFor={`testimonial-${fieldName}-verified`}
            className="text-xs"
          >
            Verified User
          </Label>
          <Switch
            id={`testimonial-${fieldName}-verified`}
            checked={verifiedField.value || false}
            onCheckedChange={verifiedField.onChange}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export const ControlledTestimonials: React.FC<ControlledTestimonialsProps> = ({
  name,
  label,
  control,
  error,
  description,
  className,
}) => {
  const { fields, append, remove, move } = useFieldArray({
    control,
    name,
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = fields.findIndex((field) => field.id === active.id);
      const newIndex = fields.findIndex((field) => field.id === over?.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        move(oldIndex, newIndex);
      }
    }
  };

  const handleAddTestimonial = () => {
    append({
      id: `testimonial-${Date.now()}`,
      text: "",
      name: "",
      designation: "",
      isVerified: true,
      imageUrl: "",
    } as any);
  };

  const handleRemoveTestimonial = (index: number) => {
    remove(index);
  };

  return (
    <div className={`space-y-2 ${className || ""}`}>
      {label && <Label className="text-sm">{label}</Label>}
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="space-y-2 gap-0">
          <SortableContext
            items={fields.map((f) => f.id)}
            strategy={verticalListSortingStrategy}
          >
            {fields.map((testimonial, index) => (
              <SortableTestimonialItem
                key={testimonial.id}
                control={control}
                fieldName={`${name}.${index}`}
                itemId={testimonial.id}
                index={index}
                canRemove={fields.length > 1}
                onRemove={() => handleRemoveTestimonial(index)}
              />
            ))}
          </SortableContext>

          <Button
            type="button"
            variant="outline"
            onClick={handleAddTestimonial}
            className="w-full h-8"
            size="sm"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Testimonial
          </Button>
        </div>
      </DndContext>

      {error && <p className="text-sm text-destructive">{error.message}</p>}
    </div>
  );
};
