import { buildMetadata } from "@/lib/seo";
import ChangelogPage from ".";

export const metadata = buildMetadata({
  title: "Changelog",
  description:
    "Stay updated with the latest changes in ClientFlow. Explore new features, improvements, and bug fixes in our changelog.",
  path: "/changelog",
});

export default ChangelogPage;
