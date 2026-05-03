import { HeroSection, FeaturesSection, PricingSection, CTASection } from "@/components/homepage";
import { getPublicPlans } from "@/server/public/plans";

const Landing = async () => {
  const plans = await getPublicPlans();
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
