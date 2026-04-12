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
  useFormContext,
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
import { Textarea } from "@/components/ui/textarea";

export interface CardWithInfo {
  id: string;
  title: string;
  subtitle: string;
  infoType: "email" | "phone" | "link";
  info: string;
  target?: "_blank" | "_self";
}

export interface ControlledCardsWithInfoProps {
  name: string;
  label?: string;
  control: Control<any>;
  error?: FieldError;
  description?: string;
  className?: string;
}

interface SortableCardItemProps {
  control: Control<any>;
  fieldName: string;
  itemId: string;
  index: number;
  onRemove: () => void;
  canRemove: boolean;
}

const SortableCardItem: React.FC<SortableCardItemProps> = ({
  control,
  fieldName,
  itemId,
  index,
  onRemove,
  canRemove,
}) => {
  // Get trigger function from form context
  const { trigger } = useFormContext();

  const {
    field: titleField,
    fieldState: { error: titleError },
  } = useController({
    control,
    name: `${fieldName}.title`,
  });

  const {
    field: subtitleField,
    fieldState: { error: subtitleError },
  } = useController({
    control,
    name: `${fieldName}.subtitle`,
  });

  const {
    field: infoTypeField,
    fieldState: { error: infoTypeError },
  } = useController({
    control,
    name: `${fieldName}.infoType`,
  });

  const {
    field: infoField,
    fieldState: { error: infoError },
  } = useController({
    control,
    name: `${fieldName}.info`,
  });

  const {
    field: targetField,
    fieldState: { error: targetError },
  } = useController({
    control,
    name: `${fieldName}.target`,
  });

  // Watch the infoType, info, and target fields to generate prepared HTML
  const infoType = useWatch({
    control,
    name: `${fieldName}.infoType`,
  });

  const info = useWatch({
    control,
    name: `${fieldName}.info`,
  });

  const target = useWatch({
    control,
    name: `${fieldName}.target`,
  });

  // Generate prepared HTML based on info type, info value, and target
  const getPreparedHtml = () => {
    if (!info) return "";

    const targetAttr = target || "_self";
    const relAttr = targetAttr === "_blank" ? ' rel="noopener noreferrer"' : "";

    switch (infoType) {
      case "email":
        return `<a href="mailto:${info}">${info}</a>`;
      case "phone": {
        const cleanPhone = info.replace(/[^0-9+]/g, "");
        return `<a href="tel:${cleanPhone}">${info}</a>`;
      }
      case "link":
        return `<a href="${info}" target="${targetAttr}"${relAttr}>${info}</a>`;
      default:
        return info;
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
            placeholder="e.g., Email Us"
            className={`h-8 ${titleError ? "border-destructive focus-visible:ring-destructive" : ""}`}
          />
          {titleError && (
            <p className="text-xs text-destructive">{titleError.message}</p>
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
            placeholder="Describe this contact method..."
            rows={2}
            className={`text-sm resize-none ${subtitleError ? "border-destructive focus-visible:ring-destructive" : ""}`}
          />
          {subtitleError && (
            <p className="text-xs text-destructive">{subtitleError.message}</p>
          )}
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Info Type & Info *</Label>
          <div className="flex gap-2 items-center">
            <Select
              value={infoTypeField.value || "email"}
              onValueChange={(value) => {
                infoTypeField.onChange(value);
                infoField.onChange(""); // Clear the info field when type changes
              }}
            >
              <SelectTrigger
                className={`h-8 w-24 ${infoTypeError ? "border-destructive focus-visible:ring-destructive" : ""}`}
              >
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="phone">Phone</SelectItem>
                <SelectItem value="link">Link</SelectItem>
              </SelectContent>
            </Select>
            <Input
              {...infoField}
              onChange={(e) => {
                let value = e.target.value;
                // Filter input based on infoType
                if (infoType === "phone") {
                  // Only allow numbers, spaces, hyphens, parentheses, and + sign
                  value = value.replace(/[^0-9\s\-()+]/g, '');
                }
                infoField.onChange(value);
              }}
              placeholder={
                infoType === "email"
                  ? "e.g., support@example.com"
                  : infoType === "phone"
                    ? "e.g., +1 234 567 8900"
                    : "e.g., https://example.com/chat"
              }
              className={`h-8 flex-1 ${infoError ? "border-destructive focus-visible:ring-destructive" : ""}`}
            />
            {infoType === "link" && (
              <Select
                value={targetField.value || "_blank"}
                onValueChange={targetField.onChange}
              >
                <SelectTrigger
                  className={`h-8 w-48 ${targetError ? "border-destructive focus-visible:ring-destructive" : ""}`}
                >
                  <SelectValue placeholder="Target" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_blank">New tab (_blank)</SelectItem>
                  <SelectItem value="_self">Same tab (_self)</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
          {(infoTypeError || infoError || targetError) && (
            <p className="text-xs text-destructive">
              {infoTypeError?.message || infoError?.message || targetError?.message}
            </p>
          )}
          {infoType === "link" && (
            <p className="text-xs text-muted-foreground">
              Choose whether the link opens in a new tab or the same tab
            </p>
          )}
        </div>
        {info && (
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">
              Prepared HTML (for frontend rendering)
            </Label>
            <div className="text-xs font-mono bg-muted p-2 rounded border break-all">
              {getPreparedHtml()}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export const ControlledCardsWithInfo: React.FC<
  ControlledCardsWithInfoProps
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

  const handleAddCard = () => {
    append({
      id: `card-${Date.now()}`,
      title: "",
      subtitle: "",
      infoType: "email",
      info: "",
      target: "_blank",
    } as any);
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
                canRemove={fields.length > 1}
                onRemove={() => handleRemoveCard(index)}
              />
            ))}
          </SortableContext>

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
        </div>
      </DndContext>

      {error && <p className="text-sm text-destructive">{error.message}</p>}
    </div>
  );
};
