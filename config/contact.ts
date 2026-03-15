import { Mail, MessageSquare, Phone, MapPin } from "lucide-react";

export const contactMethods = [
  {
    icon: Mail,
    title: "Email",
    value: "support@clientflow.io",
    desc: "Response within 24 hours",
  },
  {
    icon: MessageSquare,
    title: "Live Chat",
    value: "In-app chat",
    desc: "Available Mon–Fri, 9am–6pm EST",
  },
  {
    icon: Phone,
    title: "Phone",
    value: "+1 (555) 123-4567",
    desc: "Enterprise plan customers",
  },
  {
    icon: MapPin,
    title: "Office",
    value: "San Francisco, CA",
    desc: "By appointment only",
  },
];
