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
  useFormContext,
} from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export interface ProcessStep {
  id: string;
  title: string;
  subtitle: string;
}

export interface ControlledProcessStepsProps {
  name: string;
  label?: string;
  control: Control<any>;
  error?: FieldError;
  description?: string;
  className?: string;
}

interface SortableStepItemProps {
  control: Control<any>;
  fieldName: string;
  itemId: string;
  index: number;
  onRemove: () => void;
  canRemove: boolean;
}

const SortableStepItem: React.FC<SortableStepItemProps> = ({
  control,
  fieldName,
  itemId,
  index,
  onRemove,
  canRemove,
}) => {
  // Get trigger function from form context
  const { trigger } = useFormContext();

  const { field: titleField, fieldState: titleFieldState } = useController({
    control,
    name: `${fieldName}.title`,
  });

  const { field: subtitleField, fieldState: subtitleFieldState } = useController({
    control,
    name: `${fieldName}.subtitle`,
  });

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: itemId,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card ref={setNodeRef} style={style} className="relative gap-0 py-0">
      <CardHeader className="px-3 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 w-6 cursor-grab p-0 active:cursor-grabbing"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="text-muted-foreground h-3 w-3" />
            </Button>
            <span className="text-muted-foreground text-xs font-medium">Step {index + 1}</span>
          </div>
          {canRemove && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onRemove}
              className="text-destructive hover:text-destructive hover:bg-destructive/10 h-6 w-6 p-0"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2 px-3 pt-0 pb-2">
        <div className="space-y-1">
          <Label htmlFor={`step-${fieldName}-title`} className="text-xs">
            Title *
          </Label>
          <Input
            id={`step-${fieldName}-title`}
            {...titleField}
            onChange={(e) => {
              titleField.onChange(e);
              // Trigger validation on subtitle field when title changes
              setTimeout(() => trigger(`${fieldName}.subtitle`), 0);
            }}
            placeholder="e.g., Signup & Choose a Firm"
            className={`h-8 ${
              titleFieldState.error ? "border-destructive focus-visible:ring-destructive" : ""
            }`}
          />
          {titleFieldState.error && (
            <p className="text-destructive mt-1 text-xs">{titleFieldState.error.message}</p>
          )}
        </div>
        <div className="space-y-1">
          <Label htmlFor={`step-${fieldName}-subtitle`} className="text-xs">
            Subtitle *
          </Label>
          <Textarea
            id={`step-${fieldName}-subtitle`}
            {...subtitleField}
            onChange={(e) => {
              subtitleField.onChange(e);
              // Trigger validation on title field when subtitle changes
              setTimeout(() => trigger(`${fieldName}.title`), 0);
            }}
            placeholder="Describe what happens in this step..."
            rows={2}
            className={`resize-none text-sm ${
              subtitleFieldState.error ? "border-destructive focus-visible:ring-destructive" : ""
            }`}
          />
          {subtitleFieldState.error && (
            <p className="text-destructive mt-1 text-xs">{subtitleFieldState.error.message}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export const ControlledProcessSteps: React.FC<ControlledProcessStepsProps> = ({
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

  const handleAddStep = () => {
    append({
      id: `step-${Date.now()}`,
      title: "",
      subtitle: "",
    } as any);
  };

  const handleRemoveStep = (index: number) => {
    remove(index);
  };

  return (
    <div className={`space-y-2 ${className || ""}`}>
      {label && <Label className="text-sm">{label}</Label>}
      {description && <p className="text-muted-foreground text-xs">{description}</p>}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="gap-0 space-y-2">
          <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
            {fields.map((step, index) => (
              <SortableStepItem
                key={step.id}
                control={control}
                fieldName={`${name}.${index}`}
                itemId={step.id}
                index={index}
                canRemove={fields.length > 1}
                onRemove={() => handleRemoveStep(index)}
              />
            ))}
          </SortableContext>

          <Button
            type="button"
            variant="outline"
            onClick={handleAddStep}
            className="h-8 w-full"
            size="sm"
          >
            <Plus className="mr-1 h-3 w-3" />
            Add Step
          </Button>
        </div>
      </DndContext>

      {error && <p className="text-destructive text-sm">{error.message}</p>}
    </div>
  );
};
