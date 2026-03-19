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
import { GripVertical, Plus, Trash2 } from "lucide-react";
import type * as React from "react";
import {
  type Control,
  type FieldError,
  useController,
  useFieldArray,
  useWatch,
} from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface LinkWithType {
  id: string;
  label: string;
  link: string;
  linkType: "internal" | "external";
}

export interface ControlledLinksWithTypeProps {
  name: string;
  label?: string;
  control: Control<any>;
  error?: FieldError;
  description?: string;
  className?: string;
}

interface SortableLinkItemProps {
  control: Control<any>;
  fieldName: string;
  index: number;
  onRemove: () => void;
  canRemove: boolean;
}

const SortableLinkItem: React.FC<SortableLinkItemProps> = ({
  control,
  fieldName,
  index,
  onRemove,
  canRemove,
}) => {
  const {
    field: labelField,
    fieldState: { error: labelError },
  } = useController({
    control,
    name: `${fieldName}.label`,
  });

  const {
    field: linkField,
    fieldState: { error: linkError },
  } = useController({
    control,
    name: `${fieldName}.link`,
  });

  const {
    field: linkTypeField,
    fieldState: { error: linkTypeError },
  } = useController({
    control,
    name: `${fieldName}.linkType`,
  });

  // Watch the linkType and link fields to generate prepared code
  const linkType = useWatch({
    control,
    name: `${fieldName}.linkType`,
  });

  const link = useWatch({
    control,
    name: `${fieldName}.link`,
  });

  const label = useWatch({
    control,
    name: `${fieldName}.label`,
  });

  // Generate prepared code based on link type
  const getPreparedCode = () => {
    if (!link || !label) return "";

    if (linkType === "internal") {
      return `<Link href="${link}">${label}</Link>`;
    } else {
      return `<a href="${link}" target="_blank" rel="noopener noreferrer">${label}</a>`;
    }
  };

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: fieldName,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card ref={setNodeRef} style={style} className="relative py-0 gap-0">
      <CardHeader className="pt-2 px-3">
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
              Link {index + 1}
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
        <div className="space-y-1">
          <Label htmlFor={`link-${fieldName}-label`} className="text-xs">
            Label *
          </Label>
          <Input
            id={`link-${fieldName}-label`}
            {...labelField}
            placeholder="e.g., Home"
            className={`h-8 ${labelError ? "border-destructive focus-visible:ring-destructive" : ""}`}
          />
          {labelError && (
            <p className="text-xs text-destructive">{labelError.message}</p>
          )}
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Link Type & URL *</Label>
          <div className="flex gap-2">
            <Select
              value={linkTypeField.value || "internal"}
              onValueChange={linkTypeField.onChange}
            >
              <SelectTrigger
                className={`h-8 w-32 ${linkTypeError ? "border-destructive focus-visible:ring-destructive" : ""}`}
              >
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="internal">Internal</SelectItem>
                <SelectItem value="external">External</SelectItem>
              </SelectContent>
            </Select>
            <Input
              {...linkField}
              placeholder={
                linkType === "internal"
                  ? "e.g., /about"
                  : "e.g., https://example.com"
              }
              className={`h-8 flex-1 ${linkError ? "border-destructive focus-visible:ring-destructive" : ""}`}
            />
          </div>
          {(linkTypeError || linkError) && (
            <p className="text-xs text-destructive">
              {linkTypeError?.message || linkError?.message}
            </p>
          )}
        </div>
        {link && label && (
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">
              Prepared Code (for frontend rendering)
            </Label>
            <div className="text-xs font-mono bg-muted p-2 rounded border break-all">
              {getPreparedCode()}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export const ControlledLinksWithType: React.FC<
  ControlledLinksWithTypeProps
> = ({ name, label, control, error, description, className }) => {
  const { fields, append, remove, move } = useFieldArray({
    control,
    name,
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
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

  const handleAddLink = () => {
    append({
      id: `link-${Date.now()}`,
      label: "",
      link: "",
      linkType: "internal",
    } as any);
  };

  const handleRemoveLink = (index: number) => {
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
            {fields.map((link, index) => (
              <SortableLinkItem
                key={link.id}
                control={control}
                fieldName={`${name}.${index}`}
                index={index}
                canRemove={fields.length > 1}
                onRemove={() => handleRemoveLink(index)}
              />
            ))}
          </SortableContext>

          <Button
            type="button"
            variant="outline"
            onClick={handleAddLink}
            className="w-full h-8"
            size="sm"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Link
          </Button>
        </div>
      </DndContext>

      {error && <p className="text-sm text-destructive">{error.message}</p>}
    </div>
  );
};
