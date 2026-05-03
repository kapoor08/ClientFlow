import { Shield, Lock, Eye, Server, FileCheck, Users, Activity, Globe } from "lucide-react";

/**
 * Security practices that ship today. Honest scope - no certifications we
 * haven't actually obtained. GDPR-aligned data handling is documented; SOC 2
 * / ISO 27001 / HIPAA are deliberately omitted because no third-party audit
 * has been performed.
 */
export const practices = [
  {
    icon: Lock,
    title: "Encryption at Rest & In Transit",
    desc: "Data encrypted at rest via Neon Postgres (AES-256). All traffic served over TLS 1.3.",
  },
  {
    icon: Eye,
    title: "Role-Based Access Control",
    desc: "Granular permissions across Owner, Admin, Manager, Member, and Client roles, enforced at every server boundary.",
  },
  {
    icon: Server,
    title: "Tenant Isolation",
    desc: "Every query is scoped by organization ID at the data-access layer. Cross-tenant reads are blocked by construction.",
  },
  {
    icon: FileCheck,
    title: "Audit Logging",
    desc: "Every privileged action writes to an immutable audit log with actor, IP, user-agent, and before/after snapshots.",
  },
  {
    icon: Users,
    title: "Multi-Factor Authentication",
    desc: "TOTP-based two-factor authentication available to every user. Google OAuth sign-in supported.",
  },
  {
    icon: Shield,
    title: "Rate Limiting & Abuse Controls",
    desc: "Upstash-backed sliding-window rate limits on auth, billing, and public endpoints. Cloudflare Turnstile on contact and signup.",
  },
  {
    icon: Globe,
    title: "IP Allowlisting",
    desc: "Owners can restrict dashboard and API access to a specific list of IP ranges from organization security settings.",
  },
  {
    icon: Activity,
    title: "Email Suppression & Bounce Handling",
    desc: "Hard bounces, complaints, and unsubscribes are honored automatically. Critical transactional mail bypasses suppression.",
  },
];

/**
 * Data-handling commitments. Plain-language summary of what we do with
 * customer data - the legal version lives in /legal/privacy and /legal/dpa.
 */
export const dataHandling = [
  {
    label: "Data residency",
    desc: "Primary data stored in Neon Postgres (US region by default). DPA available on request for EU customers.",
  },
  {
    label: "Backups",
    desc: "Continuous point-in-time recovery for the last 7 days via Neon's built-in branching.",
  },
  {
    label: "Sub-processors",
    desc: "Stripe, Resend, Cloudinary, Sentry, Upstash, and Cloudflare. Full list in our DPA.",
  },
  {
    label: "Data export & deletion",
    desc: "Account owners can export organization data at any time and request deletion from billing settings.",
  },
];
