import { contactMethods } from "@/config/contact";

/** The "other ways to reach us" column on the public contact page. */
export function ContactMethods() {
  return (
    <div>
      <h2 className="font-display text-foreground text-lg font-bold">Other ways to reach us</h2>
      <div className="mt-5 space-y-3">
        {contactMethods.map((m) => (
          <div
            key={m.title}
            className="border-border bg-card hover:border-primary/30 flex gap-3 rounded-xl border p-4 transition-all"
          >
            <div className="bg-primary/8 text-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
              <m.icon size={18} />
            </div>
            <div>
              <h3 className="font-display text-foreground text-[13px] font-semibold">{m.title}</h3>
              <p className="text-primary text-[13px] font-medium">{m.value}</p>
              <p className="text-muted-foreground text-[11px]">{m.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
