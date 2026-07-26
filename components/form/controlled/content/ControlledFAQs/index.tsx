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
import { type Control, type FieldError, useController, useFieldArray } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export interface FAQ {
  id: string;
  question: string;
  answer: string;
}

export interface ControlledFAQsProps {
  name: string;
  label?: string;
  control: Control<any>;
  error?: FieldError;
  description?: string;
  className?: string;
}

interface SortableFAQItemProps {
  control: Control<any>;
  fieldName: string;
  itemId: string;
  index: number;
  onRemove: () => void;
  canRemove: boolean;
}

const SortableFAQItem: React.FC<SortableFAQItemProps> = ({
  control,
  fieldName,
  itemId,
  index,
  onRemove,
  canRemove,
}) => {
  const {
    field: questionField,
    fieldState: { error: questionError },
  } = useController({
    control,
    name: `${fieldName}.question`,
  });

  const {
    field: answerField,
    fieldState: { error: answerError },
  } = useController({
    control,
    name: `${fieldName}.answer`,
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
      <CardHeader className="px-3 pt-2 pb-1">
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
            <span className="text-muted-foreground text-xs font-medium">FAQ {index + 1}</span>
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
          <Label htmlFor={`faq-${fieldName}-question`} className="text-xs">
            Question *
          </Label>
          <Input
            id={`faq-${fieldName}-question`}
            {...questionField}
            placeholder="e.g., How does the cashback system work?"
            className={`h-8 ${questionError ? "border-destructive focus-visible:ring-destructive" : ""}`}
          />
          {questionError && (
            <p className="text-destructive mt-1 text-xs">{questionError.message}</p>
          )}
        </div>
        <div className="space-y-1">
          <Label htmlFor={`faq-${fieldName}-answer`} className="text-xs">
            Answer *
          </Label>
          <Textarea
            id={`faq-${fieldName}-answer`}
            {...answerField}
            placeholder="Provide a detailed answer to this question..."
            rows={3}
            className={`resize-none text-sm ${answerError ? "border-destructive focus-visible:ring-destructive" : ""}`}
          />
          {answerError && <p className="text-destructive mt-1 text-xs">{answerError.message}</p>}
        </div>
      </CardContent>
    </Card>
  );
};

export const ControlledFAQs: React.FC<ControlledFAQsProps> = ({
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

  const handleAddFAQ = () => {
    append({
      id: `faq-${Date.now()}`,
      question: "",
      answer: "",
    } as any);
  };

  const handleRemoveFAQ = (index: number) => {
    remove(index);
  };

  return (
    <div className={`space-y-2 ${className || ""}`}>
      {label && <Label className="text-sm">{label}</Label>}
      {description && <p className="text-muted-foreground text-xs">{description}</p>}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="gap-0 space-y-2">
          <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
            {fields.map((faq, index) => (
              <SortableFAQItem
                key={faq.id}
                control={control}
                fieldName={`${name}.${index}`}
                itemId={faq.id}
                index={index}
                canRemove={fields.length > 1}
                onRemove={() => handleRemoveFAQ(index)}
              />
            ))}
          </SortableContext>

          <Button
            type="button"
            variant="outline"
            onClick={handleAddFAQ}
            className="h-8 w-full"
            size="sm"
          >
            <Plus className="mr-1 h-3 w-3" />
            Add FAQ
          </Button>
        </div>
      </DndContext>

      {error && <p className="text-destructive text-sm">{error.message}</p>}
    </div>
  );
};
