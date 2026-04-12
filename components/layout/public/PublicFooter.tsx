import { footerColumns } from "@/config/footer";
import Image from "next/image";
import Link from "next/link";
import { Twitter, Linkedin, Github } from "lucide-react";

const socialLinks = [
  { icon: Twitter, href: "https://twitter.com/clientflow", label: "Twitter" },
  { icon: Linkedin, href: "https://linkedin.com/company/clientflow", label: "LinkedIn" },
  { icon: Github, href: "https://github.com/clientflow", label: "GitHub" },
];

const PublicFooter = () => {
  return (
    <footer className="bg-brand-900">
      <div className="container py-16">
        <div className="flex flex-col gap-12 md:flex-row">
          {/* Left: Brand */}
          <div className="w-full shrink-0 md:w-64">
            <Image
              src="/app-logo.png"
              alt="ClientFlow"
              width={130}
              height={28}
              className="h-auto w-auto brightness-0 invert"
              priority
            />
            <p className="mt-4 text-[13px] leading-relaxed text-white/55">
              The all-in-one platform for agencies to manage clients, projects,
              and billing.
            </p>
            <p className="mt-3 text-[11px] text-white/30">
              SOC 2 Type II compliant. GDPR ready.
            </p>
            <div className="mt-5 flex gap-2">
              {socialLinks.map(({ icon: Icon, href, label }) => (
                <Link
                  key={label}
                  href={href}
                  aria-label={label}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white/50 transition-colors hover:bg-white/15 hover:text-white"
                >
                  <Icon size={14} />
                </Link>
              ))}
            </div>
          </div>

          {/* Right: Nav columns */}
          <div className="grid flex-1 grid-cols-2 gap-8 sm:grid-cols-4">
            {footerColumns.map((col) => (
              <div key={col.title}>
                <h4 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/40">
                  {col.title}
                </h4>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-[13px] text-white/55 transition-colors hover:text-white"
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
      </div>

      <div className="border-t border-white/10">
        <div className="container flex flex-col items-center gap-1 py-5 text-center text-[11px] text-white/30">
          <span>&copy; {new Date().getFullYear()} ClientFlow, Inc. All rights reserved.</span>
          <span>support@clientflow.io · Response within 24 hours</span>
        </div>
      </div>
    </footer>
  );
};

export default PublicFooter;
