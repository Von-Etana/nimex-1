import React from 'react';
import { Crown, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { SUBSCRIPTION_TIERS } from '../../services/subscriptionService';
import { CardSkeleton } from '../ui/loading-skeleton';

interface SubscriptionStepProps {
  selectedSubscription: string;
  loading?: boolean;
  onSubscriptionSelect: (plan: string) => void;
}

export const SubscriptionStep: React.FC<SubscriptionStepProps> = ({
  selectedSubscription,
  loading = false,
  onSubscriptionSelect
}) => {
  if (loading) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5" />
            Choose Your Plan
          </CardTitle>
          <p className="text-sm text-neutral-600">
            Select a subscription plan to start selling on NIMEX
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <CardSkeleton key={index} />
            ))}
          </div>
          <CardSkeleton />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="w-5 h-5" />
          Choose Your Plan
        </CardTitle>
        <p className="text-sm text-neutral-600">
          Select a subscription plan to start selling on NIMEX
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {SUBSCRIPTION_TIERS.map((tier) => (
            <div
              key={tier.plan}
              onClick={() => onSubscriptionSelect(tier.plan)}
              className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedSubscription === tier.plan
                ? 'border-primary-500 bg-primary-50'
                : 'border-neutral-200 hover:border-neutral-300'
                }`}
            >
              <div className="text-center mb-4">
                <h3 className="font-bold text-lg">{tier.name}</h3>
                <div className="text-2xl font-bold text-primary-600">
                  ₦{tier.price.toLocaleString()}
                </div>
                <div className="text-sm text-neutral-600">per {tier.duration} month{tier.duration > 1 ? 's' : ''}</div>
              </div>

              <ul className="space-y-1 text-sm">
                {tier.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-900 mb-1">Choose Your Plan</h4>
              <p className="text-sm text-blue-700">
                Select a plan that fits your business needs. You can upgrade or change your plan anytime.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};