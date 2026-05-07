import { LayoutDashboard, Lock, Bolt, Bell } from "lucide-react";

const features = [
  {
    icon: LayoutDashboard,
    title: "Dedicated workspace",
    body: "ClientFlow lives in its own window — no fighting tabs with personal browsing or losing the URL bar to autocomplete.",
  },
  {
    icon: Bolt,
    title: "Faster cold starts",
    body: "Skips the browser launch and tab restore. Click the icon, you're in.",
  },
  {
    icon: Lock,
    title: "Native sign-in",
    body: "One-click Google sign-in via your real browser, then handed back to the desktop app — no embedded browser warnings.",
  },
  {
    icon: Bell,
    title: "Stays in sync",
    body: "Same data, same accounts. Switch between web and desktop without reauthenticating or losing context.",
  },
];

const DesktopFeatures = () => {
  return (
    <section className="container py-16 md:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
          Why install the desktop app?
        </h2>
        <p className="text-muted-foreground mt-4">
          The web app is great. The desktop app is great in a different way.
        </p>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {features.map(({ icon: Icon, title, body }) => (
          <div key={title} className="border-border bg-card rounded-2xl border p-6">
            <div className="bg-brand-100 text-brand-700 mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg">
              <Icon size={18} />
            </div>
            <h3 className="text-base font-semibold">{title}</h3>
            <p className="text-muted-foreground mt-2 text-[13px] leading-relaxed">{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default DesktopFeatures;
