import {
  HeroSection,
  FeaturesSection,
  TestimonialsSection,
  StatsSection,
  PricingSection,
  CTASection,
} from "@/components/homepage";
import { getPublicPlans } from "@/server/public/plans";

const Landing = async () => {
  const plans = await getPublicPlans();
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <TestimonialsSection />
      <StatsSection />
      <PricingSection plans={plans} />
      <CTASection />
    </>
  );
};

export default Landing;
