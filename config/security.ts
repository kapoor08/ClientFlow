import { Shield, Lock, Eye, Server, FileCheck, Users } from "lucide-react";

export const certifications = [
  {
    label: "SOC 2 Type II",
    desc: "Annual audit by independent third-party assessors.",
  },
  {
    label: "GDPR Compliant",
    desc: "Full data protection regulation compliance for EU customers.",
  },
  {
    label: "ISO 27001",
    desc: "Information security management system certification.",
  },
  {
    label: "HIPAA Ready",
    desc: "Available for healthcare-adjacent agencies on Enterprise plans.",
  },
];

export const practices = [
  {
    icon: Lock,
    title: "Encryption at Rest & In Transit",
    desc: "AES-256 encryption for stored data. TLS 1.3 for all network communication.",
  },
  {
    icon: Eye,
    title: "Role-Based Access Control",
    desc: "Granular permissions with Owner, Admin, Manager, Member, and Client roles.",
  },
  {
    icon: Server,
    title: "Tenant Isolation",
    desc: "Strict data isolation between organizations with row-level security policies.",
  },
  {
    icon: FileCheck,
    title: "Audit Logging",
    desc: "Immutable, timestamped audit trail for every action across your organization.",
  },
  {
    icon: Users,
    title: "SSO & MFA",
    desc: "SAML 2.0 single sign-on and multi-factor authentication on all paid plans.",
  },
  {
    icon: Shield,
    title: "Vulnerability Management",
    desc: "Continuous scanning, dependency monitoring, and responsible disclosure program.",
  },
];
