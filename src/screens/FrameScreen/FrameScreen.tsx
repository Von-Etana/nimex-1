import React from "react";
import { HeroSection } from "./sections/HeroSection";
import { PricingSection } from "./sections/PricingSection";
import { RecommendationsSection } from "./sections/RecommendationsSection";

export const FrameScreen = (): JSX.Element => {
  return (
    <div className="flex flex-col w-full">
      <HeroSection />
      <PricingSection />
      <RecommendationsSection />
    </div>
  );
};
