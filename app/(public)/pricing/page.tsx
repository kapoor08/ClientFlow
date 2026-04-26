import { buildMetadata } from "@/lib/seo";
import { softwareApplicationSchema } from "@/lib/jsonLd";
import { getPublicPlans } from "@/server/public/plans";
import PricingPage from ".";

// ISR - pricing rarely changes more than once a day; serve from cache and
// regenerate in the background.
export const revalidate = 86_400;

export const metadata = buildMetadata({
  title: "Pricing",
  description:
    "Simple, transparent pricing for teams of every size. Choose the ClientFlow plan that fits your agency and start managing clients, projects, and billing in one place.",
  path: "/pricing",
});

export default async function Page() {
  const plans = await getPublicPlans();

  const pricedPlans = plans
    .map((p) => p.monthlyPriceCents)
    .filter((c): c is number => c !== null && c > 0);

  const lowPrice = pricedPlans.length ? Math.min(...pricedPlans) / 100 : 0;
  const highPrice = pricedPlans.length ? Math.max(...pricedPlans) / 100 : 0;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: softwareApplicationSchema({ lowPriceUsd: lowPrice, highPriceUsd: highPrice }),
        }}
      />
      <PricingPage plans={plans} />
    </>
  );
}
