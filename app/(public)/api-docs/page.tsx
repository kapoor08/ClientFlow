import { buildMetadata } from "@/lib/seo";
import ApiDocsPage from ".";

export const metadata = buildMetadata({
  title: "API Documentation",
  description:
    "Explore the API documentation for ClientFlow. Learn how to integrate with our platform, access features programmatically, and enhance your applications with our powerful API.",
  path: "/api-docs",
});

export default ApiDocsPage;
