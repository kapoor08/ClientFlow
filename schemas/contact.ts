import { z } from "zod";

export const SUBJECT_OPTIONS = [
  { value: "General Inquiry", label: "General Inquiry" },
  { value: "Request a Demo", label: "Request a Demo" },
  { value: "Sales / Enterprise", label: "Sales / Enterprise" },
  { value: "Partnership", label: "Partnership" },
  { value: "Support", label: "Support" },
];

export const contactFormSchema = z.object({
  name: z.string().trim().min(2, "Enter a valid name."),
  email: z.string().trim().email("Enter a valid email address."),
  company: z.string().trim().optional(),
  subject: z.string().trim().min(1, "Select a subject."),
  message: z.string().trim().min(10, "Add a bit more detail so we can help."),
});

export type ContactFormValues = z.infer<typeof contactFormSchema>;
