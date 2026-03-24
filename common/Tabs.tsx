// Stub — full Tabs implementation not used in this project
import type { ReactNode } from "react";

export interface Tab {
  label: string;
  value: string;
  [key: string]: unknown;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  children?: (tab: Tab) => ReactNode;
  [key: string]: unknown;
}

export function Tabs({ tabs, children, defaultTab }: TabsProps) {
  const active = tabs.find((t) => t.value === defaultTab) ?? tabs[0];
  return <>{active && children ? children(active) : null}</>;
}
