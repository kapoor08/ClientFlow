import { z } from "zod";

export const signInSchema = z.object({
  email: z.string().email({ message: "Enter a valid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});

export type SignInFormValues = z.infer<typeof signInSchema>;

export const signUpSchema = z
  .object({
    firstName: z.string().min(1, { message: "First name is required." }),
    lastName: z.string().min(1, { message: "Last name is required." }),
    email: z.string().email({ message: "Enter a valid email address." }),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters." })
      .refine((v) => /[A-Z]/.test(v), {
        message: "Password must include at least one uppercase letter.",
      })
      .refine((v) => /[a-z]/.test(v), {
        message: "Password must include at least one lowercase letter.",
      })
      .refine((v) => /[0-9]/.test(v), {
        message: "Password must include at least one number.",
      })
      .refine((v) => /[^A-Za-z0-9]/.test(v), {
        message: "Password must include at least one symbol.",
      }),
    confirmPassword: z.string().min(1, { message: "Please confirm your password." }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type SignUpFormValues = z.infer<typeof signUpSchema>;
