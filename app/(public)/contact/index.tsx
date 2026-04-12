"use client";

import { useActionState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  ControlledInput,
  ControlledSelect,
  ControlledTextarea,
} from "@/components/form";
import { Button } from "@/components/ui/button";
import { contactMethods } from "@/config/contact";
import { type ContactActionState, submitContactFormAction } from "@/server/actions/contact";

const SUBJECT_OPTIONS = [
  { value: "General Inquiry", label: "General Inquiry" },
  { value: "Request a Demo", label: "Request a Demo" },
  { value: "Sales / Enterprise", label: "Sales / Enterprise" },
  { value: "Partnership", label: "Partnership" },
  { value: "Support", label: "Support" },
];

const contactFormSchema = z.object({
  name: z.string().trim().min(2, "Enter a valid name."),
  email: z.string().trim().email("Enter a valid email address."),
  company: z.string().trim().optional(),
  subject: z.string().trim().min(1, "Select a subject."),
  message: z.string().trim().min(10, "Add a bit more detail so we can help."),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

const ContactPage = () => {
  const initialState: ContactActionState = {
    status: "idle",
    message: "",
  };
  const [state, formAction, isPending] = useActionState(
    submitContactFormAction,
    initialState,
  );
  const submitted = state.status === "success";

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      company: "",
      subject: "General Inquiry",
      message: "",
    },
  });

  const onSubmit = (values: ContactFormValues) => {
    const formData = new FormData();
    formData.set("name", values.name);
    formData.set("email", values.email);
    formData.set("company", values.company ?? "");
    formData.set("subject", values.subject);
    formData.set("message", values.message);
    formAction(formData);
  };

  return (
    <>
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 dot-grid dot-grid-fade opacity-40" />
        <div
          className="absolute inset-0"
          style={{ background: "var(--cf-hero-gradient)" }}
        />
        <div className="container relative py-14 md:py-20">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mx-auto max-w-3xl text-center"
          >
            <h1 className="font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl">
              Get in <span className="text-primary text-glow">touch</span>
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
              Have a question, want a demo, or ready to start? We&apos;d love to
              hear from you.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="container">
          <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-2">
            <div>
              <h2 className="font-display text-lg font-bold text-foreground">
                Send us a message
              </h2>
              {submitted ? (
                <div className="mt-5 rounded-xl border border-border bg-card p-8 text-center">
                  <h3 className="font-display text-base font-semibold text-foreground">
                    Thank you!
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    We&apos;ll get back to you within 24 hours.
                  </p>
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit(onSubmit)}
                  className="mt-5 space-y-4"
                >
                  {state.status === "error" ? (
                    <div className="rounded-xl border border-error-border bg-error-surface px-4 py-3 text-sm text-error">
                      {state.message}
                    </div>
                  ) : null}

                  <div className="grid gap-3 sm:grid-cols-2">
                    <ControlledInput
                      name="name"
                      label="Full Name*"
                      control={control}
                      error={errors.name}
                      placeholder="Jane Doe"
                      autoComplete="name"
                      disabled={isPending}
                      className="mt-1"
                      labelClassName="text-[13px]"
                    />
                    <ControlledInput
                      name="email"
                      label="Work Email*"
                      type="email"
                      control={control}
                      error={errors.email}
                      placeholder="jane@agency.com"
                      autoComplete="email"
                      disabled={isPending}
                      className="mt-1"
                      labelClassName="text-[13px]"
                    />
                  </div>

                  <ControlledInput
                    name="company"
                    label="Company"
                    control={control}
                    error={errors.company}
                    placeholder="Acme Agency"
                    autoComplete="organization"
                    disabled={isPending}
                    className="mt-1"
                    labelClassName="text-[13px]"
                  />

                  <ControlledSelect
                    name="subject"
                    label="Subject"
                    control={control}
                    error={errors.subject}
                    options={SUBJECT_OPTIONS}
                    disabled={isPending}
                  />

                  <ControlledTextarea
                    name="message"
                    label="Message*"
                    control={control}
                    error={errors.message}
                    placeholder="Tell us how we can help..."
                    rows={4}
                    disabled={isPending}
                    className="mt-1"
                  />

                  <Button
                    type="submit"
                    size="sm"
                    className="cursor-pointer"
                    disabled={isPending}
                  >
                    {isPending ? (
                      <>
                        <LoaderCircle
                          size={14}
                          className="mr-1.5 animate-spin"
                        />
                        Sending...
                      </>
                    ) : (
                      "Send Message"
                    )}
                  </Button>
                </form>
              )}
            </div>

            <div>
              <h2 className="font-display text-lg font-bold text-foreground">
                Other ways to reach us
              </h2>
              <div className="mt-5 space-y-3">
                {contactMethods.map((m) => (
                  <div
                    key={m.title}
                    className="flex gap-3 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/30"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/8 text-primary">
                      <m.icon size={18} />
                    </div>
                    <div>
                      <h3 className="font-display text-[13px] font-semibold text-foreground">
                        {m.title}
                      </h3>
                      <p className="text-[13px] font-medium text-primary">
                        {m.value}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {m.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default ContactPage;
