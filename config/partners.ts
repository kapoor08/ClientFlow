import { DollarSign, BookOpen, Megaphone } from "lucide-react";

export const tiers = [
  {
    icon: Megaphone,
    title: "Referral Partner",
    desc: "Earn commission by referring agencies to ClientFlow. No technical integration required.",
    benefits: [
      "15% recurring commission",
      "Co-branded landing pages",
      "Partner dashboard",
      "Dedicated partner manager",
    ],
  },
  {
    icon: BookOpen,
    title: "Solutions Partner",
    desc: "Offer ClientFlow implementation and consulting services to your clients.",
    benefits: [
      "20% recurring commission",
      "Early access to features",
      "Joint case studies",
      "Priority technical support",
    ],
  },
  {
    icon: DollarSign,
    title: "Technology Partner",
    desc: "Build integrations and apps on the ClientFlow platform.",
    benefits: [
      "Revenue sharing on app sales",
      "API sandbox environment",
      "Marketplace listing",
      "Co-marketing opportunities",
    ],
  },
];
