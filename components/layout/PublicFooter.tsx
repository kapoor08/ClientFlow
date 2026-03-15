import { footerColumns } from "@/config/footer";
import Link from "next/link";

const PublicFooter = () => {
  return (
    <footer className="border-t border-border bg-card">
      <div className="container py-10">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
                <span className="font-display text-xs font-bold text-primary-foreground">CF</span>
              </div>
              <span className="font-display text-base font-semibold text-foreground">ClientFlow</span>
            </div>
            <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
              The all-in-one platform for agencies to manage clients, projects, and billing.
            </p>
            <p className="mt-3 text-[11px] text-muted-foreground">SOC 2 Type II compliant. GDPR ready.</p>
          </div>

          {footerColumns.map((col) => (
            <div key={col.title}>
              <h4 className="font-display text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground">
                {col.title}
              </h4>
              <ul className="mt-3 space-y-1.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-border">
        <div className="container flex flex-col items-center justify-between gap-2 py-3 text-[11px] text-muted-foreground md:flex-row">
          <span>&copy; {new Date().getFullYear()} ClientFlow, Inc. All rights reserved.</span>
          <span>support@clientflow.io - Response within 24 hours</span>
        </div>
      </div>
    </footer>
  );
};

export default PublicFooter;
