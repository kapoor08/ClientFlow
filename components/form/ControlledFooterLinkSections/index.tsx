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
import { ChevronDown, ChevronUp, GripVertical, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import type * as React from "react";
import {
  type Control,
  type FieldError,
  useController,
  useFieldArray,
} from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface FooterLinkSection {
  id: string;
  title: string;
  links?: Array<{
    id: string;
    label: string;
    href?: string;
  }>;
}

export interface ControlledFooterLinkSectionsProps {
  name: string;
  label?: string;
  control: Control<any>;
  error?: FieldError;
  description?: string;
  className?: string;
}

interface SortableSectionItemProps {
  control: Control<any>;
  fieldName: string;
  index: number;
  onRemove: () => void;
  canRemove: boolean;
}

const SortableSectionItem: React.FC<SortableSectionItemProps> = ({
  control,
  fieldName,
  index,
  onRemove,
  canRemove,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const {
    field: titleField,
    fieldState: { error: titleError },
  } = useController({
    control,
    name: `${fieldName}.title`,
  });

  // Field array for links within this section
  const { fields: linkFields, append: appendLink, remove: removeLink } = useFieldArray({
    control,
    name: `${fieldName}.links`,
  });

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

  const handleAddLink = () => {
    appendLink({
      id: `link-${Date.now()}`,
      label: "",
      link: "",
    });
  };

  return (
    <Card ref={setNodeRef} style={style} className="relative py-0 gap-0">
      <CardHeader className="pt-2 px-3 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1">
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
              Section {index + 1}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-6 w-6 p-0"
            >
              {isExpanded ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </Button>
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
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0 pb-3 px-3 space-y-3">
          {/* Section Title */}
          <div className="space-y-1">
            <Label htmlFor={`section-${fieldName}-title`} className="text-xs">
              Section Title *
            </Label>
            <Input
              id={`section-${fieldName}-title`}
              {...titleField}
              placeholder="e.g., Company"
              className={`h-8 ${titleError ? "border-destructive focus-visible:ring-destructive" : ""}`}
            />
            {titleError && (
              <p className="text-xs text-destructive">{titleError.message}</p>
            )}
          </div>

          {/* Links within this section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Links</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddLink}
                className="h-7 text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Link
              </Button>
            </div>

            {linkFields.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-2">
                No links yet. Click "Add Link" to create one.
              </p>
            ) : (
              <div className="space-y-2">
                {linkFields.map((link, linkIndex) => (
                  <LinkItem
                    key={link.id}
                    control={control}
                    fieldName={`${fieldName}.links.${linkIndex}`}
                    onRemove={() => removeLink(linkIndex)}
                  />
                ))}
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
};

interface LinkItemProps {
  control: Control<any>;
  fieldName: string;
  onRemove: () => void;
}

const LinkItem: React.FC<LinkItemProps> = ({ control, fieldName, onRemove }) => {
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

  return (
    <div className="border rounded-lg p-2 bg-muted/30">
      <div className="flex items-start gap-2">
        <div className="flex-1 grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Input
              {...labelField}
              placeholder="Label (e.g., Explore)"
              className={`h-7 text-xs ${labelError ? "border-destructive" : ""}`}
            />
            {labelError && (
              <p className="text-xs text-destructive">{labelError.message}</p>
            )}
          </div>
          <div className="space-y-1">
            <Input
              {...linkField}
              placeholder="/about or https://example.com"
              className={`h-7 text-xs ${linkError ? "border-destructive" : ""}`}
            />
            {linkError && (
              <p className="text-xs text-destructive">{linkError.message}</p>
            )}
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
};

export const ControlledFooterLinkSections: React.FC<
  ControlledFooterLinkSectionsProps
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

  const handleAddSection = () => {
    append({
      id: `section-${Date.now()}`,
      title: "",
      links: [],
    } as any);
  };

  const handleRemoveSection = (index: number) => {
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
            {fields.map((section, index) => (
              <SortableSectionItem
                key={section.id}
                control={control}
                fieldName={`${name}.${index}`}
                index={index}
                canRemove={fields.length > 1}
                onRemove={() => handleRemoveSection(index)}
              />
            ))}
          </SortableContext>

          <Button
            type="button"
            variant="outline"
            onClick={handleAddSection}
            className="w-full h-8"
            size="sm"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Section
          </Button>
        </div>
      </DndContext>

      {error && <p className="text-sm text-destructive">{error.message}</p>}
    </div>
  );
};
