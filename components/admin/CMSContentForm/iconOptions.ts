// Stub — icon options not used in this project
import type { ComponentType } from "react";

export interface IconOption {
  value: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

export const AVAILABLE_ICONS: IconOption[] = [];
