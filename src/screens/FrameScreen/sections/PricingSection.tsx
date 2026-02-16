import React from "react";
import { Link } from "react-router-dom";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { Check } from "lucide-react";
import { SUBSCRIPTION_TIERS } from "../../../services/subscriptionService";

export const PricingSection = (): JSX.Element => {
  return (
    <section className="w-full bg-white py-16 md:py-24">
      <div className="w-full max-w-7xl mx-auto px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="[font-family:'Poppins',Helvetica] font-bold text-[#19191f] text-3xl md:text-4xl tracking-[0] leading-tight mb-4">
            Choose Your Plan
          </h2>
          <p className="[font-family:'Inter',Helvetica] font-normal text-[#19191f] text-lg opacity-80 max-w-2xl mx-auto">
            Start selling on NIMEX with flexible subscription plans designed for businesses of all sizes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {SUBSCRIPTION_TIERS.map((tier, index) => (
            <Card
              key={tier.plan}
              className={`relative ${
                tier.plan === 'quarterly'
                  ? 'border-2 border-[#f97316] shadow-lg scale-105'
                  : 'border border-gray-200'
              }`}
            >
              {tier.plan === 'quarterly' && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-[#f97316] text-white px-3 py-1 text-xs font-medium">
                  Most Popular
                </Badge>
              )}

              <CardHeader className="text-center pb-4">
                <CardTitle className="[font-family:'Poppins',Helvetica] font-semibold text-[#19191f] text-xl mb-2">
                  {tier.name}
                </CardTitle>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="[font-family:'Poppins',Helvetica] font-bold text-[#19191f] text-3xl">
                    ₦{tier.price.toLocaleString()}
                  </span>
                  <span className="[font-family:'Inter',Helvetica] font-normal text-[#19191f] text-sm opacity-60">
                    /{tier.duration} month{tier.duration > 1 ? 's' : ''}
                  </span>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <ul className="space-y-3 mb-6">
                  {tier.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-3">
                      <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="[font-family:'Inter',Helvetica] font-normal text-[#19191f] text-sm leading-5">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link to="/signup" className="block">
                  <Button
                    className={`w-full h-11 ${
                      tier.plan === 'quarterly'
                        ? 'bg-[#f97316] hover:bg-[#ea580c] text-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-[#323742]'
                    } rounded-lg [font-family:'Inter',Helvetica] font-medium text-sm`}
                    variant={tier.plan === 'quarterly' ? 'default' : 'secondary'}
                  >
                    Get Started
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="[font-family:'Inter',Helvetica] font-normal text-[#19191f] text-sm opacity-60">
            All plans include secure payments, escrow protection, and delivery tracking.
            <br />
            Cancel or change your plan anytime.
          </p>
        </div>

        <div className="mt-16 p-8 bg-gradient-to-br from-blue-50 to-green-50 rounded-2xl border border-blue-200">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1 text-center md:text-left">
              <h3 className="[font-family:'Poppins',Helvetica] font-bold text-[#19191f] text-2xl mb-2">
                Become a NIMEX Marketer
              </h3>
              <p className="[font-family:'Inter',Helvetica] font-normal text-[#19191f] text-base opacity-80">
                Earn commissions by referring vendors to our platform. Join our marketing partner program today!
              </p>
            </div>
            <div className="flex-shrink-0">
              <Link to="/marketer/register">
                <Button className="bg-primary-500 hover:bg-primary-600 text-white px-8 h-12 rounded-lg [font-family:'Inter',Helvetica] font-semibold">
                  Register as Marketer
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};