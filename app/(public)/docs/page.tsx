import { buildMetadata } from "@/lib/seo";
import DocsPage from ".";

export const revalidate = 86_400;

export const metadata = buildMetadata({
  title: "Documentation",
  description:
    "Access comprehensive documentation for ClientFlow. Learn how to use our platform, integrate with our API, and get the most out of our features.",
  path: "/docs",
});

export default DocsPage;
