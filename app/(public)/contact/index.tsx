"use client";
import { useActionState } from "react";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { contactMethods } from "@/config/contact";
import {
  type ContactActionState,
  submitContactFormAction,
} from "./actions";

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
                <form action={formAction} className="mt-5 space-y-3">
                  {state.status === "error" ? (
                    <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                      {state.message}
                    </div>
                  ) : null}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="name" className="text-[13px]">
                        Full Name
                      </Label>
                      <Input
                        id="name"
                        name="name"
                        placeholder="Jane Doe"
                        className="mt-1"
                        autoComplete="name"
                        disabled={isPending}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-[13px]">
                        Work Email
                      </Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="jane@agency.com"
                        className="mt-1"
                        autoComplete="email"
                        disabled={isPending}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="company" className="text-[13px]">
                      Company
                    </Label>
                    <Input
                      id="company"
                      name="company"
                      placeholder="Acme Agency"
                      className="mt-1"
                      autoComplete="organization"
                      disabled={isPending}
                    />
                  </div>
                  <div>
                    <Label htmlFor="subject" className="text-[13px]">
                      Subject
                    </Label>
                    <select
                      id="subject"
                      name="subject"
                      className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      defaultValue="General Inquiry"
                      disabled={isPending}
                    >
                      <option>General Inquiry</option>
                      <option>Request a Demo</option>
                      <option>Sales / Enterprise</option>
                      <option>Partnership</option>
                      <option>Support</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="message" className="text-[13px]">
                      Message
                    </Label>
                    <Textarea
                      id="message"
                      name="message"
                      placeholder="Tell us how we can help..."
                      rows={4}
                      className="mt-1"
                      disabled={isPending}
                      required
                    />
                  </div>
                  <Button type="submit" size="sm" disabled={isPending}>
                    {isPending ? (
                      <>
                        <LoaderCircle size={14} className="mr-1.5 animate-spin" />
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
