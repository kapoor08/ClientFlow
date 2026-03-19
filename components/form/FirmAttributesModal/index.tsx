"use client";

import { Plus, Trash2, Package } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { type Control, useController, useFieldArray } from "react-hook-form";

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
import { Modal } from "@/common/Modal";
import { Tabs, type Tab } from "@/common/Tabs";
import { FormSection } from "../FormSection";

interface FirmAttributesModalProps {
  // biome-ignore lint/suspicious/noExplicitAny: Dynamic field paths require flexible control type
  control: Control<any>;
  fieldName: string;
  keyOptions: { value: string; label: string }[];
  // New form sections
  keySpecifications: Array<{ key: string; value: string }>;
  onAddKeySpecification: () => void;
  onRemoveKeySpecification: (index: number) => void;
  onUpdateKeySpecification: (
    index: number,
    field: "key" | "value",
    value: string
  ) => void;

  keyInformation: Array<{ key: string; value: string }>;
  onAddKeyInfo: () => void;
  onRemoveKeyInfo: (index: number) => void;
  onUpdateKeyInfo: (index: number, field: "key" | "value", value: string) => void;

  tradingConditions: Array<{ key: string; value: string }>;
  onAddTradingCondition: () => void;
  onRemoveTradingCondition: (index: number) => void;
  onUpdateTradingCondition: (
    index: number,
    field: "key" | "value",
    value: string
  ) => void;

  challengeRules: Array<{ key: string; value: string }>;
  onAddChallengeRule: () => void;
  onRemoveChallengeRule: (index: number) => void;
  onUpdateChallengeRule: (
    index: number,
    field: "key" | "value",
    value: string
  ) => void;

  ratingsReviews: Array<{ key: string; value: string }>;
  onAddRatingReview: () => void;
  onRemoveRatingReview: (index: number) => void;
  onUpdateRatingReview: (
    index: number,
    field: "key" | "value",
    value: string
  ) => void;

  paymentCosts: Array<{ key: string; value: string }>;
  onAddPaymentCost: () => void;
  onRemovePaymentCost: (index: number) => void;
  onUpdatePaymentCost: (
    index: number,
    field: "key" | "value",
    value: string
  ) => void;
}

// Group attributes by category for tabbed interface
const ATTRIBUTE_CATEGORIES = [
  {
    id: "hero",
    label: "Hero Section",
    keys: [
      "hero_offer",
      "hero_subtext",
      "hero_logo_title",
      "hero_logo_subtitle",
    ],
  },
  {
    id: "basic",
    label: "Basic Features",
    keys: [
      "support",
      "demo_account",
      "mobile_app",
      "api_available",
      "copy_trading",
    ],
  },
  {
    id: "trading",
    label: "Trading Settings",
    keys: [
      "instruments",
      "liquidity_provider",
      "trading_environment",
      "max_leverage",
    ],
  },
  {
    id: "accounts",
    label: "Accounts & Bonus",
    keys: ["account_types", "bonus_available"],
  },
  {
    id: "compliance",
    label: "Compliance",
    keys: ["regulation", "broker_type", "payment_methods"],
  },
  {
    id: "specifications",
    label: "Specifications",
    keys: ["complete_specifications"],
  },
  {
    id: "programs",
    label: "Programs",
    keys: ["programs", "trading_rules"],
  },
  {
    id: "payouts",
    label: "Payouts",
    keys: ["payout_info", "consistency_rules", "restricted_countries"],
  },
];

export function FirmAttributesModal({
  control,
  fieldName,
  keyOptions,
  keySpecifications,
  onAddKeySpecification,
  onRemoveKeySpecification,
  onUpdateKeySpecification,
  keyInformation,
  onAddKeyInfo,
  onRemoveKeyInfo,
  onUpdateKeyInfo,
  tradingConditions,
  onAddTradingCondition,
  onRemoveTradingCondition,
  onUpdateTradingCondition,
  challengeRules,
  onAddChallengeRule,
  onRemoveChallengeRule,
  onUpdateChallengeRule,
  ratingsReviews,
  onAddRatingReview,
  onRemoveRatingReview,
  onUpdateRatingReview,
  paymentCosts,
  onAddPaymentCost,
  onRemovePaymentCost,
  onUpdatePaymentCost,
}: FirmAttributesModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  const { fields, append, remove } = useFieldArray({
    control,
    name: fieldName,
  });

  // Memoize tabs to prevent recreating on every render
  const allTabs = useMemo<Tab[]>(() => {
    // Create tabs for all sections
    const attributeTabs: Tab[] = ATTRIBUTE_CATEGORIES.map((category) => ({
      label: category.label,
      value: category.id,
    }));

    const detailsTabs: Tab[] = [
      { label: "Key Specifications", value: "key-specs" },
      { label: "Key Information", value: "key-info" },
      { label: "Trading Conditions", value: "trading-cond" },
      { label: "Challenge Rules", value: "challenge-rules" },
      { label: "Ratings & Reviews", value: "ratings-reviews" },
      { label: "Payment Costs", value: "payment-costs" },
    ];

    return [...attributeTabs, ...detailsTabs];
  }, []);

  const handleAddAttribute = (keyValue: string) => {
    append({
      key: keyValue,
      values: [""],
    });
  };

  const renderKeyValueSection = (
    items: Array<{ key: string; value: string }>,
    onAdd: () => void,
    onRemove: (index: number) => void,
    onUpdate: (index: number, field: "key" | "value", value: string) => void,
    keyLabel: string,
    valueLable: string
  ) => {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="cursor-pointer"
            onClick={onAdd}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </div>

        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={index} className="space-y-2">
              <div className="flex gap-3 items-start">
                <div className="grid gap-2 flex-1">
                  <Label htmlFor={`key-${index}`} className="text-sm">
                    {keyLabel}
                  </Label>
                  <Input
                    id={`key-${index}`}
                    placeholder={`e.g., ${keyLabel}`}
                    value={item.key}
                    onChange={(e) => onUpdate(index, "key", e.target.value)}
                  />
                </div>
                <div className="grid gap-2 flex-1">
                  <Label htmlFor={`value-${index}`} className="text-sm">
                    {valueLable}
                  </Label>
                  <Input
                    id={`value-${index}`}
                    placeholder={`e.g., Value`}
                    value={item.value}
                    onChange={(e) => onUpdate(index, "value", e.target.value)}
                  />
                </div>
                <div className="grid gap-2 pt-6">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemove(index)}
                    disabled={items.length === 1}
                    className="h-9 w-9 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 rounded cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Button Bar */}
      <FormSection
        title="Firm Details"
        description="Manage all firm attributes, specifications, trading conditions, and other details"
      >
        <div className="flex items-center justify-between gap-4 bg-emerald-50/50 rounded-lg p-4 border border-emerald-200">
          <div>
            <p className="text-sm font-medium text-emerald-900">
              Manage Firm Information
            </p>
            <p className="text-xs text-emerald-700 mt-1">
              Configure attributes, specifications, and other firm details
            </p>
          </div>
          <Button
            type="button"
            variant="default"
            size="sm"
            className="cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => setIsOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Manage Details
          </Button>
        </div>
      </FormSection>

      {/* Modal with Tabbed Interface */}
      <Modal
        open={isOpen}
        onOpenChange={setIsOpen}
        title="Manage Firm Details"
        size="full"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="cursor-pointer"
            >
              Done
            </Button>
          </div>
        }
      >
        <Tabs
          tabs={allTabs}
          defaultTab="basic"
          variant="pills"
          contentClassName="py-4"
          animate={false}
        >
          {(selectedTab) => {
            // Handle attribute categories
            const category = ATTRIBUTE_CATEGORIES.find(
              (c) => c.id === selectedTab.value
            );

            if (category) {
              // Get attributes for this category
              const categoryFieldIndices = fields
                .map((field, idx) => {
                  const f = field as unknown as {
                    key: string;
                    values: string[];
                  };
                  return category.keys.includes(f.key) ? idx : -1;
                })
                .filter((idx) => idx !== -1);

              const categoryKeyOptions = keyOptions.filter((opt) =>
                category.keys.includes(opt.value)
              );

              // Get available keys (not yet used in this category)
              const usedKeys = categoryFieldIndices.map((idx) => {
                const f = fields[idx] as unknown as {
                  key: string;
                  values: string[];
                };
                return f.key;
              });
              const availableKeys = categoryKeyOptions.filter(
                (opt) => !usedKeys.includes(opt.value)
              );

              return (
                <div className="space-y-4">
                  {/* Existing Attributes in Category */}
                  {categoryFieldIndices.length > 0 ? (
                    <>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold text-sm">
                              Attributes in this category
                            </h4>
                            <p className="text-xs text-muted-foreground mt-1">
                              {categoryFieldIndices.length} attribute
                              {categoryFieldIndices.length !== 1 ? "s" : ""}{" "}
                              configured
                            </p>
                          </div>
                        </div>
                        <div className="space-y-3 mt-4">
                          {categoryFieldIndices.map((fieldIndex) => {
                            const field = fields[fieldIndex] as unknown as {
                              id?: string;
                              key: string;
                              values: string[];
                            };
                            const stableKey =
                              field.id || `${fieldIndex}-${field.key}`;
                            return (
                              <AttributeItem
                                key={stableKey}
                                fieldIndex={fieldIndex}
                                control={control}
                                fieldName={fieldName}
                                keyOptions={categoryKeyOptions}
                                onRemove={() => remove(fieldIndex)}
                              />
                            );
                          })}
                        </div>
                      </div>

                      {/* Add New Attribute - Only when there are existing attributes */}
                      {availableKeys.length > 0 && (
                        <div className="border-t pt-6 mt-6">
                          <div className="bg-emerald-50/50 rounded-lg border border-emerald-200 p-4">
                            <Label className="text-sm font-semibold text-emerald-900 block mb-3">
                              Add Another Attribute
                            </Label>
                            <Select
                              key={`${category.id}-${fields.length}`}
                              onValueChange={handleAddAttribute}
                            >
                              <SelectTrigger className="bg-white border-emerald-300 cursor-pointer">
                                <SelectValue placeholder="Select an attribute type..." />
                              </SelectTrigger>
                              <SelectContent>
                                {availableKeys.map((opt) => (
                                  <SelectItem
                                    key={opt.value}
                                    value={opt.value}
                                    className="cursor-pointer"
                                  >
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}

                      {/* No More Keys Available */}
                      {availableKeys.length === 0 && (
                        <div className="bg-emerald-50/50 border border-emerald-200 rounded-lg p-4 text-sm text-emerald-800">
                          <div className="flex items-start gap-2">
                            <div className="text-lg">✓</div>
                            <div>
                              <p className="font-medium">All configured</p>
                              <p className="text-xs mt-1">
                                All available attributes in this category have
                                been added.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    // Empty State - Only when there are NO attributes
                    <div className="flex flex-col items-center justify-center py-12">
                      <div className="rounded-full bg-muted p-4 mb-4">
                        <Package className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">
                        No Attributes Yet
                      </h3>
                      <p className="text-sm text-muted-foreground mb-6 max-w-xs">
                        Start by selecting an attribute type from the dropdown
                        below
                      </p>
                      {availableKeys.length > 0 && (
                        <div className="w-full max-w-xs">
                          <Select
                            key={`${category.id}-empty-${fields.length}`}
                            onValueChange={handleAddAttribute}
                          >
                            <SelectTrigger className="w-full cursor-pointer">
                              <SelectValue placeholder="Select attribute type..." />
                            </SelectTrigger>
                            <SelectContent>
                              {availableKeys.map((opt) => (
                                <SelectItem
                                  key={opt.value}
                                  value={opt.value}
                                  className="cursor-pointer"
                                >
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      {availableKeys.length === 0 && (
                        <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 w-full max-w-xs">
                          <p className="text-xs text-amber-800">
                            All available attributes in this category have been
                            added.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            }

            // Handle detail sections
            switch (selectedTab.value) {
              case "key-specs":
                return renderKeyValueSection(
                  keySpecifications,
                  onAddKeySpecification,
                  onRemoveKeySpecification,
                  onUpdateKeySpecification,
                  "Specification Name",
                  "Value"
                );
              case "key-info":
                return renderKeyValueSection(
                  keyInformation,
                  onAddKeyInfo,
                  onRemoveKeyInfo,
                  onUpdateKeyInfo,
                  "Information Label",
                  "Value"
                );
              case "trading-cond":
                return renderKeyValueSection(
                  tradingConditions,
                  onAddTradingCondition,
                  onRemoveTradingCondition,
                  onUpdateTradingCondition,
                  "Condition Type",
                  "Value"
                );
              case "challenge-rules":
                return renderKeyValueSection(
                  challengeRules,
                  onAddChallengeRule,
                  onRemoveChallengeRule,
                  onUpdateChallengeRule,
                  "Rule Name",
                  "Value"
                );
              case "ratings-reviews":
                return renderKeyValueSection(
                  ratingsReviews,
                  onAddRatingReview,
                  onRemoveRatingReview,
                  onUpdateRatingReview,
                  "Rating Type",
                  "Value"
                );
              case "payment-costs":
                return renderKeyValueSection(
                  paymentCosts,
                  onAddPaymentCost,
                  onRemovePaymentCost,
                  onUpdatePaymentCost,
                  "Payment Method",
                  "Cost/Fee"
                );
              default:
                return null;
            }
          }}
        </Tabs>
      </Modal>
    </>
  );
}

// Attribute Item Component
interface AttributeItemProps {
  fieldIndex: number;
  // biome-ignore lint/suspicious/noExplicitAny: Dynamic field paths require flexible control type
  control: Control<any>;
  fieldName: string;
  keyOptions: { value: string; label: string }[];
  onRemove: () => void;
}

function AttributeItem({
  fieldIndex,
  control,
  fieldName,
  keyOptions,
  onRemove,
}: AttributeItemProps) {
  const { field: keyField } = useController({
    control,
    name: `${fieldName}.${fieldIndex}.key`,
  });

  const {
    fields: valueFields,
    append: appendValue,
    remove: removeValue,
  } = useFieldArray({
    control,
    name: `${fieldName}.${fieldIndex}.values`,
  });

  const keyLabel = keyOptions.find(
    (opt) => opt.value === keyField.value
  )?.label;

  // Ensure there's always at least one value field
  useEffect(() => {
    if (valueFields.length === 0) {
      appendValue("");
    }
  }, [valueFields.length, appendValue]);

  return (
    <Card className="py-0 gap-0 border-l-4 border-l-emerald-500 bg-linear-to-r from-emerald-50/20 to-transparent">
      <CardHeader className="pt-4 pb-3 px-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-emerald-900">
            {keyLabel || keyField.value}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 rounded cursor-pointer"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0 pb-4 px-4 space-y-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold text-gray-700">
              Values *
            </Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => appendValue("")}
              className="h-7 text-xs bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 cursor-pointer"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Value
            </Button>
          </div>

          <div className="space-y-2">
            {valueFields.map((field, index) => (
              <ValueItem
                key={field.id}
                fieldName={`${fieldName}.${fieldIndex}.values`}
                index={index}
                control={control}
                onRemove={removeValue}
                canRemove={valueFields.length > 1}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Value Item Component
interface ValueItemProps {
  fieldName: string;
  index: number;
  // biome-ignore lint/suspicious/noExplicitAny: Dynamic field paths require flexible control type
  control: Control<any>;
  onRemove: (index: number) => void;
  canRemove: boolean;
}

function ValueItem({
  fieldName,
  index,
  control,
  onRemove,
  canRemove,
}: ValueItemProps) {
  const {
    field: valueField,
    fieldState: { error: valueError },
  } = useController({
    control,
    name: `${fieldName}.${index}`,
  });

  return (
    <div
      className={`border rounded-md p-3 bg-white flex items-start gap-2 transition-colors ${
        valueError
          ? "border-red-400 bg-red-50"
          : "border-gray-300 hover:border-emerald-300"
      }`}
    >
      <div className="flex-1">
        <Input
          {...valueField}
          placeholder="e.g., PayPal, Stripe, UPI"
          className={`h-8 text-sm px-3 ${
            valueError
              ? "border-red-500 focus:border-red-500 focus:ring-red-200"
              : "border-gray-300"
          }`}
        />
        {valueError && (
          <p className="text-xs text-red-600 mt-1.5">{valueError.message}</p>
        )}
      </div>
      {canRemove && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onRemove(index)}
          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-100 rounded mt-0.5 shrink-0 cursor-pointer"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
