import { z } from "zod";
import {
  PROJECT_PRIORITY_OPTIONS,
  PROJECT_STATUS_OPTIONS,
  type ProjectPriority,
  type ProjectStatus,
} from "@/constants/project";
export { PROJECT_PRIORITY_OPTIONS, PROJECT_STATUS_OPTIONS };

export const BUDGET_TYPE_OPTIONS = [
  {
    value: "fixed",
    label: "Fixed Price",
    description: "One total amount for the entire project",
    amountLabel: "Total Budget (USD)",
    placeholder: "e.g. 5000.00",
  },
  {
    value: "hourly",
    label: "Hourly Rate",
    description: "Billed per hour worked",
    amountLabel: "Hourly Rate (USD/hr)",
    placeholder: "e.g. 75.00",
  },
  {
    value: "milestone",
    label: "Milestone-Based",
    description: "Paid on delivery of defined milestones",
    amountLabel: "Total Budget (USD)",
    placeholder: "e.g. 3000.00",
  },
  {
    value: "retainer",
    label: "Monthly Retainer",
    description: "Recurring monthly fee",
    amountLabel: "Monthly Amount (USD)",
    placeholder: "e.g. 2000.00",
  },
] as const;

export type { ProjectPriority, ProjectStatus };
export type ProjectBudgetType = (typeof BUDGET_TYPE_OPTIONS)[number]["value"];

const projectStatusValues = PROJECT_STATUS_OPTIONS.map((o) => o.value) as [
  ProjectStatus,
  ...ProjectStatus[],
];

const projectPriorityValues = PROJECT_PRIORITY_OPTIONS.map((o) => o.value) as [
  ProjectPriority,
  ...ProjectPriority[],
];

const budgetTypeValues = BUDGET_TYPE_OPTIONS.map((o) => o.value) as [
  ProjectBudgetType,
  ...ProjectBudgetType[],
];

export const projectFormSchema = z.object({
  name: z
    .string()
    .min(1, "Project name is required.")
    .max(255, "Name must be 255 characters or fewer."),
  clientId: z.string().min(1, "Client is required."),
  description: z
    .string()
    .max(5000, "Description must be 5,000 characters or fewer."),
  status: z.enum(projectStatusValues, {
    error: "Select a valid project status.",
  }),
  priority: z.enum(projectPriorityValues, {
    error: "Select a valid priority.",
  }),
  startDate: z.date().nullable(),
  dueDate: z.date().nullable(),
  budgetType: z.enum(budgetTypeValues).or(z.literal("")), // "" = no budget
  budget: z.string(),       // dollar amount as string, "" for none
});

export type ProjectFormValues = z.infer<typeof projectFormSchema>;

export function getDefaultProjectFormValues(): ProjectFormValues {
  return {
    name: "",
    clientId: "",
    description: "",
    status: "planning",
    priority: "medium",
    startDate: null,
    dueDate: null,
    budgetType: "",
    budget: "",
  };
}
