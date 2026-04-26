import { buildMetadata } from "@/lib/seo";
import AboutPage from ".";

export const revalidate = 86_400;

export const metadata = buildMetadata({
  title: "About",
  description:
    "Learn more about ClientFlow, our mission, and our team. Discover how we help businesses streamline their client management and enhance customer relationships.",
  path: "/about",
});

export default AboutPage;
