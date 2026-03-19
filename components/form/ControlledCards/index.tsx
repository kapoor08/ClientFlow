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
  Controller,
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
import { IconSelector } from "@/components/form/IconSelector";

export interface FeatureCard {
  id: string;
  title: string;
  subtitle: string;
  icon?: string;
}

export interface ControlledCardsProps {
  name: string;
  label?: string;
  control: Control<any>;
  error?: FieldError;
  description?: string;
  className?: string;
  minCards?: number;
  maxCards?: number;
  disableAdd?: boolean;
  disableRemove?: boolean;
  showIconSelector?: boolean; // Enable icon selection for each card
}

interface SortableCardItemProps {
  control: Control<any>;
  fieldName: string;
  itemId: string;
  index: number;
  onRemove: () => void;
  canRemove: boolean;
  showIconSelector?: boolean;
}

const SortableCardItem: React.FC<SortableCardItemProps> = ({
  control,
  fieldName,
  itemId,
  index,
  onRemove,
  canRemove,
  showIconSelector = false,
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

  const { field: iconField, fieldState: iconFieldState } = useController({
    control,
    name: `${fieldName}.icon`,
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
              Card {index + 1}
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
        {showIconSelector && (
          <IconSelector
            value={iconField.value}
            onChange={iconField.onChange}
            label="Icon"
            placeholder="Select an icon..."
            error={iconFieldState.error?.message}
          />
        )}
        <div className="space-y-1">
          <Label htmlFor={`card-${fieldName}-title`} className="text-xs">
            Title *
          </Label>
          <Input
            id={`card-${fieldName}-title`}
            {...titleField}
            onChange={(e) => {
              titleField.onChange(e);
              // Trigger validation on subtitle field when title changes
              setTimeout(() => trigger(`${fieldName}.subtitle`), 0);
            }}
            placeholder="e.g., Trade Instantly"
            className={`h-8 ${
              titleFieldState.error
                ? "border-destructive focus-visible:ring-destructive"
                : ""
            }`}
          />
          {titleFieldState.error && (
            <p className="text-xs text-destructive mt-1">
              {titleFieldState.error.message}
            </p>
          )}
        </div>
        <div className="space-y-1">
          <Label htmlFor={`card-${fieldName}-subtitle`} className="text-xs">
            Description *
          </Label>
          <Textarea
            id={`card-${fieldName}-subtitle`}
            {...subtitleField}
            onChange={(e) => {
              subtitleField.onChange(e);
              // Trigger validation on title field when subtitle changes
              setTimeout(() => trigger(`${fieldName}.title`), 0);
            }}
            placeholder="Describe this feature or benefit..."
            rows={2}
            className={`text-sm resize-none ${
              subtitleFieldState.error
                ? "border-destructive focus-visible:ring-destructive"
                : ""
            }`}
          />
          {subtitleFieldState.error && (
            <p className="text-xs text-destructive mt-1">
              {subtitleFieldState.error.message}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export const ControlledCards: React.FC<ControlledCardsProps> = ({
  name,
  label,
  control,
  error,
  description,
  className,
  minCards = 1,
  maxCards,
  disableAdd = false,
  disableRemove = false,
  showIconSelector = false,
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

  const handleAddCard = () => {
    const newCard: any = {
      id: `card-${Date.now()}`,
      title: "",
      subtitle: "",
    };
    if (showIconSelector) {
      newCard.icon = "";
    }
    append(newCard);
  };

  const handleRemoveCard = (index: number) => {
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
            {fields.map((card, index) => (
              <SortableCardItem
                key={card.id}
                control={control}
                fieldName={`${name}.${index}`}
                itemId={card.id}
                index={index}
                canRemove={!disableRemove && fields.length > minCards}
                onRemove={() => handleRemoveCard(index)}
                showIconSelector={showIconSelector}
              />
            ))}
          </SortableContext>

          {!disableAdd && (!maxCards || fields.length < maxCards) && (
            <Button
              type="button"
              variant="outline"
              onClick={handleAddCard}
              className="w-full h-8"
              size="sm"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Card
            </Button>
          )}
        </div>
      </DndContext>

      {error && <p className="text-sm text-destructive">{error.message}</p>}
    </div>
  );
};
