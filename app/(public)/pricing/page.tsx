import { getPublicPlans } from "@/server/public/plans";
import PricingPage from ".";

export const metadata = {
  title: "Pricing - ClientFlow",
  description:
    "Discover ClientFlow's pricing plans. Choose the best option for your business and start streamlining your client management with our powerful platform today.",
};

export default async function Page() {
  const plans = await getPublicPlans();
  return <PricingPage plans={plans} />;
}
