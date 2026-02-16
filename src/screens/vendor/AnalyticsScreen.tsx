import React from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { TrendingUp, Users, DollarSign, ShoppingBag, BarChart2 } from 'lucide-react';

export const AnalyticsScreen: React.FC = () => {
  return (
    <div className="w-full min-h-screen bg-neutral-50">
      <div className="max-w-7xl mx-auto px-3 md:px-6 py-4 md:py-8">
        <h1 className="font-heading font-bold text-lg md:text-3xl text-neutral-900 mb-6">
          Analytics & Insights
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-green-700" />
                </div>
                <span className="font-sans text-sm text-neutral-600">Revenue</span>
              </div>
              <p className="font-heading font-bold text-2xl text-neutral-900">₦1.5M</p>
              <p className="font-sans text-xs text-green-600 mt-1">+12% from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-blue-700" />
                </div>
                <span className="font-sans text-sm text-neutral-600">Orders</span>
              </div>
              <p className="font-heading font-bold text-2xl text-neutral-900">234</p>
              <p className="font-sans text-xs text-green-600 mt-1">+8% from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-purple-700" />
                </div>
                <span className="font-sans text-sm text-neutral-600">Customers</span>
              </div>
              <p className="font-heading font-bold text-2xl text-neutral-900">1,234</p>
              <p className="font-sans text-xs text-green-600 mt-1">+15% from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-yellow-700" />
                </div>
                <span className="font-sans text-sm text-neutral-600">Conversion</span>
              </div>
              <p className="font-heading font-bold text-2xl text-neutral-900">3.2%</p>
              <p className="font-sans text-xs text-red-600 mt-1">-0.5% from last month</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-12 text-center">
            <BarChart2 className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
            <h3 className="font-heading font-semibold text-lg text-neutral-900 mb-2">
              Detailed Analytics Coming Soon
            </h3>
            <p className="font-sans text-neutral-600">
              Advanced analytics features including sales charts, customer demographics, and product performance metrics are currently in development.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
