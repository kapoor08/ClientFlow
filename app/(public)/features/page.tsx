import { buildMetadata } from "@/lib/seo";
import FeaturesPage from ".";

export const revalidate = 86_400;

export const metadata = buildMetadata({
  title: "Features",
  description:
    "Discover the powerful features of ClientFlow that help you streamline client management, enhance customer relationships, and grow your business.",
  path: "/features",
});

export default FeaturesPage;
