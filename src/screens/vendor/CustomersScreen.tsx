import React from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Users, Search } from 'lucide-react';

export const CustomersScreen: React.FC = () => {
  return (
    <div className="w-full min-h-screen bg-neutral-50">
      <div className="max-w-7xl mx-auto px-3 md:px-6 py-4 md:py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-heading font-bold text-lg md:text-3xl text-neutral-900">
            Customers
          </h1>
        </div>

        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="text"
                placeholder="Search customers..."
                className="w-full h-12 pl-10 pr-4 rounded-lg border border-neutral-200 font-sans text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-12 text-center">
            <Users className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
            <h3 className="font-heading font-semibold text-lg text-neutral-900 mb-2">
              Customer Management Coming Soon
            </h3>
            <p className="font-sans text-neutral-600">
              View and manage your customer relationships, order history, and contact information. This feature is currently in development.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
