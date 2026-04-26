import { buildMetadata } from "@/lib/seo";
import BlogPage from ".";

export const metadata = buildMetadata({
  title: "Blog",
  description:
    "Read the latest articles, insights, and updates from the ClientFlow team. Stay informed about industry trends, best practices, and tips for optimizing your client management strategies.",
  path: "/blogs",
});

export default BlogPage;
