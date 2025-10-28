import React from "react";
import { HeroSection } from "./sections/HeroSection";
import { RecommendationsSection } from "./sections/RecommendationsSection";

export const FrameScreen = (): JSX.Element => {
  return (
    <div className="flex flex-col w-full">
      <HeroSection />
      <RecommendationsSection />
    </div>
  );
};
