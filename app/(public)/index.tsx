import { HeroSection, FeaturesSection, PricingSection, CTASection } from "@/components/homepage";
import { getPublicPlans, type PublicPlan } from "@/server/public/plans";

const Landing = async () => {
  // The DB is not reachable during `next build` in some environments (e.g. CI).
  // Fall back to no plans so prerendering succeeds; ISR/runtime renders fill in
  // the real data once the database is reachable.
  let plans: PublicPlan[] = [];
  try {
    plans = await getPublicPlans();
  } catch {
    plans = [];
  }
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <PricingSection plans={plans} />
      <CTASection />
    </>
  );
};

export default Landing;
