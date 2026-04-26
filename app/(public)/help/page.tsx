import { buildMetadata } from "@/lib/seo";
import HelpPage from ".";

export const metadata = buildMetadata({
  title: "Help Center",
  description:
    "Find answers to your questions and get support with ClientFlow. Explore our help center for guides, FAQs, and resources to use our platform effectively.",
  path: "/help",
});

export default HelpPage;
