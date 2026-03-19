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
import { ControlledCheckbox } from "@/components/form/ControlledCheckbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface ChallengeCategory {
  id: string;
  name: string;
  order: number;
  options: ChallengeCategoryOption[];
}

export interface ChallengeCategoryOption {
  id: string;
  label: string;
  badge?: string;
  badgeColor?: string;
}

export interface FirmChallenge {
  id: string;
  name: string;
  accountSize?: string;
  price: string;
  profitTarget?: string;
  maxDailyLoss?: string;
  maxLoss?: string;
  minTradingDays?: string;
  isMostPopular?: boolean;
  buyUrl?: string;
  categoryTags?: Record<string, string>;
}

export interface FirmChallengesProps {
  name: string;
  label?: string;
  control: Control<any>;
  error?: FieldError;
  description?: string;
  className?: string;
  challengeCategories?: ChallengeCategory[];
  onChallengesCategoriesChange?: (categories: ChallengeCategory[]) => void;
}

interface SortableChallengeItemProps {
  control: Control<any>;
  fieldName: string;
  itemId: string;
  index: number;
  onRemove: () => void;
  canRemove: boolean;
  categories: ChallengeCategory[];
}

const SortableChallengeItem: React.FC<SortableChallengeItemProps> = ({
  control,
  fieldName,
  itemId,
  index,
  onRemove,
  canRemove,
  categories,
}) => {
  const {
    field: nameField,
    fieldState: { error: nameError },
  } = useController({
    control,
    name: `${fieldName}.${index}.name`,
  });

  const {
    field: accountSizeField,
    fieldState: { error: accountSizeError },
  } = useController({
    control,
    name: `${fieldName}.${index}.accountSize`,
  });

  const {
    field: priceField,
    fieldState: { error: priceError },
  } = useController({
    control,
    name: `${fieldName}.${index}.price`,
  });

  const {
    field: profitTargetField,
    fieldState: { error: profitTargetError },
  } = useController({
    control,
    name: `${fieldName}.${index}.profitTarget`,
  });

  const {
    field: maxDailyLossField,
    fieldState: { error: maxDailyLossError },
  } = useController({
    control,
    name: `${fieldName}.${index}.maxDailyLoss`,
  });

  const {
    field: maxLossField,
    fieldState: { error: maxLossError },
  } = useController({
    control,
    name: `${fieldName}.${index}.maxLoss`,
  });

  const {
    field: minTradingDaysField,
    fieldState: { error: minTradingDaysError },
  } = useController({
    control,
    name: `${fieldName}.${index}.minTradingDays`,
  });

  const {
    field: buyUrlField,
    fieldState: { error: buyUrlError },
  } = useController({
    control,
    name: `${fieldName}.${index}.buyUrl`,
  });

  const {
    field: categoryTagsField,
  } = useController({
    control,
    name: `${fieldName}.${index}.categoryTags`,
    defaultValue: {},
  });

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: itemId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleCategoryTagChange = (categoryId: string, optionId: string) => {
    const current = categoryTagsField.value || {};
    categoryTagsField.onChange({
      ...current,
      [categoryId]: optionId === "__none__" ? undefined : optionId,
    });
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
        {/* Challenge Name */}
        <div className="space-y-1">
          <Label htmlFor={`challenge-${fieldName}-name`} className="text-xs">
            Challenge Name *
          </Label>
          <Input
            id={`challenge-${fieldName}-name`}
            {...nameField}
            placeholder="e.g., 10K FTMO Classic"
            className={`h-8 ${
              nameError
                ? "border-destructive focus-visible:ring-destructive"
                : ""
            }`}
          />
          {nameError && (
            <p className="text-xs text-destructive">{nameError.message}</p>
          )}
        </div>

        {/* Account Size & Price */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label
              htmlFor={`challenge-${fieldName}-accountSize`}
              className="text-xs"
            >
              Account Size
            </Label>
            <Input
              id={`challenge-${fieldName}-accountSize`}
              {...accountSizeField}
              placeholder="e.g., $10,000"
              className={`h-8 ${
                accountSizeError
                  ? "border-destructive focus-visible:ring-destructive"
                  : ""
              }`}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`challenge-${fieldName}-price`} className="text-xs">
              Price *
            </Label>
            <Input
              id={`challenge-${fieldName}-price`}
              {...priceField}
              placeholder="e.g., $199"
              className={`h-8 ${
                priceError
                  ? "border-destructive focus-visible:ring-destructive"
                  : ""
              }`}
            />
            {priceError && (
              <p className="text-xs text-destructive">{priceError.message}</p>
            )}
          </div>
        </div>

        {/* Profit Target & Max Daily Loss */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label
              htmlFor={`challenge-${fieldName}-profitTarget`}
              className="text-xs"
            >
              Profit Target
            </Label>
            <Input
              id={`challenge-${fieldName}-profitTarget`}
              {...profitTargetField}
              placeholder="e.g., 10%"
              className={`h-8 ${
                profitTargetError
                  ? "border-destructive focus-visible:ring-destructive"
                  : ""
              }`}
            />
          </div>
          <div className="space-y-1">
            <Label
              htmlFor={`challenge-${fieldName}-maxDailyLoss`}
              className="text-xs"
            >
              Max Daily Loss
            </Label>
            <Input
              id={`challenge-${fieldName}-maxDailyLoss`}
              {...maxDailyLossField}
              placeholder="e.g., 3%"
              className={`h-8 ${
                maxDailyLossError
                  ? "border-destructive focus-visible:ring-destructive"
                  : ""
              }`}
            />
          </div>
        </div>

        {/* Max Loss & Min Trading Days */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label
              htmlFor={`challenge-${fieldName}-maxLoss`}
              className="text-xs"
            >
              Max Loss
            </Label>
            <Input
              id={`challenge-${fieldName}-maxLoss`}
              {...maxLossField}
              placeholder="e.g., 6%"
              className={`h-8 ${
                maxLossError
                  ? "border-destructive focus-visible:ring-destructive"
                  : ""
              }`}
            />
          </div>
          <div className="space-y-1">
            <Label
              htmlFor={`challenge-${fieldName}-minTradingDays`}
              className="text-xs"
            >
              Min Trading Days
            </Label>
            <Input
              id={`challenge-${fieldName}-minTradingDays`}
              {...minTradingDaysField}
              placeholder="e.g., 40"
              className={`h-8 ${
                minTradingDaysError
                  ? "border-destructive focus-visible:ring-destructive"
                  : ""
              }`}
            />
          </div>
        </div>

        {/* Buy URL */}
        <div className="space-y-1">
          <Label htmlFor={`challenge-${fieldName}-buyUrl`} className="text-xs">
            Buy URL (Affiliate Link)
          </Label>
          <Input
            id={`challenge-${fieldName}-buyUrl`}
            {...buyUrlField}
            placeholder="e.g., https://firm.com/ref?partner=yourplatform"
            className={`h-8 ${
              buyUrlError ? "border-destructive focus-visible:ring-destructive" : ""
            }`}
          />
          {buyUrlError && (
            <p className="text-xs text-destructive">{buyUrlError.message}</p>
          )}
        </div>

        {/* Category Tags */}
        {categories.length > 0 && (
          <div className="space-y-2 border-t pt-2 mt-2">
            <Label className="text-xs font-semibold text-muted-foreground">Category Tags</Label>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((cat) => (
                <div key={cat.id} className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">{cat.name}</Label>
                  <Select
                    value={(categoryTagsField.value || {})[cat.id] || "__none__"}
                    onValueChange={(val) => handleCategoryTagChange(cat.id, val)}
                  >
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">-- None --</SelectItem>
                      {cat.options.map((opt) => (
                        <SelectItem key={opt.id} value={opt.id}>
                          {opt.label}{opt.badge ? ` (${opt.badge})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Most Popular Checkbox */}
        <div className="pt-1">
          <ControlledCheckbox
            name={`${fieldName}.${index}.isMostPopular` as any}
            label="Mark as Most Popular"
            control={control}
            className="pt-1"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export const FirmChallenges: React.FC<FirmChallengesProps> = ({
  name,
  label = "Firm Challenges",
  control,
  error,
  description,
  className = "pt-0",
  challengeCategories = [],
  onChallengesCategoriesChange,
}) => {
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

  const handleAddChallenge = () => {
    append({
      id: `card-${Date.now()}`,
      name: "",
      accountSize: "",
      price: "",
      profitTarget: "",
      maxDailyLoss: "",
      maxLoss: "",
      minTradingDays: "",
      buyUrl: "",
      isMostPopular: false,
      categoryTags: {},
    } as FirmChallenge);
  };

  return (
    <Card className={className}>
      <CardContent className="pt-6 space-y-4">
        {label && <Label className="text-sm">{label}</Label>}
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}

        {/* Challenge Category Manager */}
        {onChallengesCategoriesChange && (
          <ChallengeCategoryManager
            categories={challengeCategories}
            onChange={onChallengesCategoriesChange}
          />
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
              {fields.map((field, index) => (
                <SortableChallengeItem
                  key={field.id}
                  control={control}
                  fieldName={name}
                  itemId={field.id}
                  index={index}
                  onRemove={() => remove(index)}
                  canRemove={fields.length > 1}
                  categories={challengeCategories}
                />
              ))}
            </SortableContext>

            <Button
              type="button"
              variant="outline"
              onClick={handleAddChallenge}
              className="w-full h-8 cursor-pointer"
              size="sm"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Challenge
            </Button>
          </div>
        </DndContext>

        {error && <p className="text-sm text-destructive">{error.message}</p>}
      </CardContent>
    </Card>
  );
};

// ─── Challenge Category Manager ─────────────────────────────────────────────

interface ChallengeCategoryManagerProps {
  categories: ChallengeCategory[];
  onChange: (categories: ChallengeCategory[]) => void;
}

const ChallengeCategoryManager: React.FC<ChallengeCategoryManagerProps> = ({
  categories,
  onChange,
}) => {
  const handleAddCategory = () => {
    onChange([
      ...categories,
      {
        id: `cat-${Date.now()}`,
        name: "",
        order: categories.length + 1,
        options: [],
      },
    ]);
  };

  const handleRemoveCategory = (catIndex: number) => {
    onChange(categories.filter((_, i) => i !== catIndex));
  };

  const handleCategoryNameChange = (catIndex: number, name: string) => {
    const updated = [...categories];
    updated[catIndex] = { ...updated[catIndex], name };
    onChange(updated);
  };

  const handleAddOption = (catIndex: number) => {
    const updated = [...categories];
    updated[catIndex] = {
      ...updated[catIndex],
      options: [
        ...updated[catIndex].options,
        { id: `opt-${Date.now()}`, label: "", badge: "", badgeColor: "" },
      ],
    };
    onChange(updated);
  };

  const handleRemoveOption = (catIndex: number, optIndex: number) => {
    const updated = [...categories];
    updated[catIndex] = {
      ...updated[catIndex],
      options: updated[catIndex].options.filter((_, i) => i !== optIndex),
    };
    onChange(updated);
  };

  const handleOptionChange = (
    catIndex: number,
    optIndex: number,
    field: keyof ChallengeCategoryOption,
    value: string
  ) => {
    const updated = [...categories];
    updated[catIndex] = {
      ...updated[catIndex],
      options: updated[catIndex].options.map((opt, i) =>
        i === optIndex ? { ...opt, [field]: value } : opt
      ),
    };
    onChange(updated);
  };

  return (
    <div className="space-y-3 border rounded-lg p-3 bg-muted/30">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold">
          Challenge Categories (Filters)
        </Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddCategory}
          className="h-6 text-[10px] px-2"
        >
          <Plus className="h-3 w-3 mr-1" />
          Add Category
        </Button>
      </div>
      <p className="text-[10px] text-muted-foreground">
        Define filter categories (e.g., Account Type, Account Size, Platform). Then tag each challenge card with the appropriate options.
      </p>

      {categories.map((cat, catIndex) => (
        <div
          key={cat.id}
          className="border rounded-md p-2 space-y-2 bg-background"
        >
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground font-medium w-5">
              {catIndex + 1}.
            </span>
            <Input
              value={cat.name}
              onChange={(e) =>
                handleCategoryNameChange(catIndex, e.target.value)
              }
              placeholder="Category name (e.g., Account Type)"
              className="h-7 text-xs flex-1"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleRemoveCategory(catIndex)}
              className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>

          {/* Options */}
          <div className="pl-5 space-y-1.5">
            {cat.options.map((opt, optIndex) => (
              <div key={opt.id} className="flex items-center gap-1.5">
                <Input
                  value={opt.label}
                  onChange={(e) =>
                    handleOptionChange(catIndex, optIndex, "label", e.target.value)
                  }
                  placeholder="Label (e.g., Growth)"
                  className="h-6 text-[10px] flex-1"
                />
                <Input
                  value={opt.badge || ""}
                  onChange={(e) =>
                    handleOptionChange(catIndex, optIndex, "badge", e.target.value)
                  }
                  placeholder="Badge (e.g., Instant Funding)"
                  className="h-6 text-[10px] flex-1"
                />
                <Select
                  value={opt.badgeColor || "gray"}
                  onValueChange={(val) =>
                    handleOptionChange(catIndex, optIndex, "badgeColor", val)
                  }
                >
                  <SelectTrigger className="h-6 text-[10px] w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gray">Gray</SelectItem>
                    <SelectItem value="green">Green</SelectItem>
                    <SelectItem value="blue">Blue</SelectItem>
                    <SelectItem value="orange">Orange</SelectItem>
                    <SelectItem value="gold">Gold</SelectItem>
                    <SelectItem value="red">Red</SelectItem>
                    <SelectItem value="purple">Purple</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveOption(catIndex, optIndex)}
                  className="h-5 w-5 p-0 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-2.5 w-2.5" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleAddOption(catIndex)}
              className="h-5 text-[10px] px-1.5 text-muted-foreground"
            >
              <Plus className="h-2.5 w-2.5 mr-0.5" />
              Add Option
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};
