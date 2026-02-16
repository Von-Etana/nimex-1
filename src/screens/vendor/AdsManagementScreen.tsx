import React, { useState } from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import {
  Plus,
  Eye,
  BarChart2,
  DollarSign,
  MousePointer,
  TrendingUp,
  Edit,
  Trash2,
} from 'lucide-react';

interface AdCampaign {
  id: string;
  title: string;
  image: string;
  status: 'active' | 'paused' | 'ended';
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  ctr: number;
  conversions: number;
  startDate: string;
  endDate: string;
}

export const AdsManagementScreen: React.FC = () => {
  const [ads] = useState<AdCampaign[]>([]);

  const totalBudget = ads.reduce((sum, ad) => sum + ad.budget, 0);
  const totalSpent = ads.reduce((sum, ad) => sum + ad.spent, 0);
  const totalImpressions = ads.reduce((sum, ad) => sum + ad.impressions, 0);
  const totalClicks = ads.reduce((sum, ad) => sum + ad.clicks, 0);
  const averageCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  const totalConversions = ads.reduce((sum, ad) => sum + ad.conversions, 0);

  const getStatusColor = (status: AdCampaign['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700';
      case 'paused':
        return 'bg-yellow-100 text-yellow-700';
      case 'ended':
        return 'bg-neutral-100 text-neutral-700';
      default:
        return 'bg-neutral-100 text-neutral-700';
    }
  };

  return (
    <div className="flex flex-col w-full min-h-screen bg-neutral-50">
      <div className="w-full max-w-7xl mx-auto px-3 md:px-6 py-4 md:py-8">
        <div className="flex flex-col gap-4 md:gap-6">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h1 className="font-heading font-bold text-neutral-900 text-lg md:text-3xl">
                Ads
              </h1>
              <p className="font-sans text-neutral-600 text-xs md:text-sm mt-0.5 md:mt-1">
                Manage campaigns
              </p>
            </div>
            <Button className="bg-green-700 hover:bg-green-800 text-white px-3 py-2 md:px-6 md:py-2 rounded-lg flex items-center gap-1 md:gap-2 text-xs md:text-sm">
              <Plus className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden sm:inline">Create Campaign</span>
              <span className="sm:hidden">New</span>
            </Button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <Card className="border border-neutral-200 shadow-sm">
              <CardContent className="p-3 md:p-6">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col gap-1 md:gap-2">
                    <span className="font-sans text-xs md:text-sm text-neutral-600">
                      Budget
                    </span>
                    <span className="font-heading font-bold text-neutral-900 text-base md:text-2xl">
                      ₦{(totalBudget / 1000).toFixed(0)}K
                    </span>
                    <span className="font-sans text-xs text-neutral-500">
                      ₦{(totalSpent / 1000).toFixed(0)}K spent
                    </span>
                  </div>
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <DollarSign className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-neutral-200 shadow-sm">
              <CardContent className="p-3 md:p-6">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col gap-1 md:gap-2">
                    <span className="font-sans text-xs md:text-sm text-neutral-600">
                      Impressions
                    </span>
                    <span className="font-heading font-bold text-neutral-900 text-base md:text-2xl">
                      {(totalImpressions / 1000).toFixed(1)}K
                    </span>
                    <span className="font-sans text-xs text-green-600">
                      +12.5%
                    </span>
                  </div>
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Eye className="w-4 h-4 md:w-5 md:h-5 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-neutral-200 shadow-sm">
              <CardContent className="p-3 md:p-6">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col gap-1 md:gap-2">
                    <span className="font-sans text-xs md:text-sm text-neutral-600">
                      Clicks
                    </span>
                    <span className="font-heading font-bold text-neutral-900 text-base md:text-2xl">
                      {(totalClicks / 1000).toFixed(1)}K
                    </span>
                    <span className="font-sans text-xs text-neutral-500">
                      {averageCTR.toFixed(2)}% CTR
                    </span>
                  </div>
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                    <MousePointer className="w-4 h-4 md:w-5 md:h-5 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-neutral-200 shadow-sm">
              <CardContent className="p-3 md:p-6">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col gap-1 md:gap-2">
                    <span className="font-sans text-xs md:text-sm text-neutral-600">
                      Conversions
                    </span>
                    <span className="font-heading font-bold text-neutral-900 text-base md:text-2xl">
                      {totalConversions}
                    </span>
                    <span className="font-sans text-xs text-green-600">
                      +8.3%
                    </span>
                  </div>
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {ads.length === 0 ? (
            <div className="hidden md:flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-neutral-200">
              <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
                <BarChart2 className="w-8 h-8 text-neutral-400" />
              </div>
              <h3 className="font-heading font-bold text-lg text-neutral-900 mb-2">No campaigns yet</h3>
              <p className="font-sans text-sm text-neutral-500 mb-4 text-center max-w-sm">
                Create your first ad campaign to boost your product visibility and reach more customers.
              </p>
              <Button className="bg-green-700 hover:bg-green-800 text-white px-6 py-2 rounded-lg flex items-center gap-2 text-sm">
                <Plus className="w-4 h-4" />
                Create Campaign
              </Button>
            </div>
          ) : (
            <div className="hidden md:block">
              <Card className="border border-neutral-200 shadow-sm">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-neutral-50 border-b border-neutral-200">
                        <tr>
                          <th className="text-left px-6 py-4 font-sans text-sm font-semibold text-neutral-700">
                            Campaign
                          </th>
                          <th className="text-left px-6 py-4 font-sans text-sm font-semibold text-neutral-700">
                            Status
                          </th>
                          <th className="text-left px-6 py-4 font-sans text-sm font-semibold text-neutral-700">
                            Budget
                          </th>
                          <th className="text-left px-6 py-4 font-sans text-sm font-semibold text-neutral-700">
                            Impressions
                          </th>
                          <th className="text-left px-6 py-4 font-sans text-sm font-semibold text-neutral-700">
                            Clicks
                          </th>
                          <th className="text-left px-6 py-4 font-sans text-sm font-semibold text-neutral-700">
                            CTR
                          </th>
                          <th className="text-left px-6 py-4 font-sans text-sm font-semibold text-neutral-700">
                            Conversions
                          </th>
                          <th className="text-left px-6 py-4 font-sans text-sm font-semibold text-neutral-700">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {ads.map((ad) => (
                          <tr
                            key={ad.id}
                            className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <img
                                  src={ad.image}
                                  alt={ad.title}
                                  className="w-12 h-12 rounded-lg object-cover"
                                />
                                <div className="flex flex-col">
                                  <span className="font-sans font-semibold text-neutral-900 text-sm">
                                    {ad.title}
                                  </span>
                                  <span className="font-sans text-xs text-neutral-500">
                                    {ad.startDate} - {ad.endDate}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                  ad.status
                                )}`}
                              >
                                {ad.status.charAt(0).toUpperCase() + ad.status.slice(1)}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col">
                                <span className="font-sans text-sm text-neutral-900">
                                  ₦{(ad.budget / 1000).toFixed(0)}K
                                </span>
                                <span className="font-sans text-xs text-neutral-500">
                                  ₦{(ad.spent / 1000).toFixed(0)}K spent
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="font-sans text-sm text-neutral-900">
                                {(ad.impressions / 1000).toFixed(1)}K
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="font-sans text-sm text-neutral-900">
                                {(ad.clicks / 1000).toFixed(1)}K
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="font-sans text-sm text-neutral-900">
                                {ad.ctr.toFixed(2)}%
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="font-sans text-sm text-neutral-900">
                                {ad.conversions}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <button className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
                                  <BarChart2 className="w-4 h-4 text-neutral-600" />
                                </button>
                                <button className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
                                  <Edit className="w-4 h-4 text-neutral-600" />
                                </button>
                                <button className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
                                  <Trash2 className="w-4 h-4 text-red-600" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {ads.length === 0 ? (
            <div className="md:hidden flex flex-col items-center justify-center py-12 bg-white rounded-xl border border-neutral-200 mx-3">
              <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mb-3">
                <BarChart2 className="w-6 h-6 text-neutral-400" />
              </div>
              <h3 className="font-heading font-bold text-base text-neutral-900 mb-1">No campaigns</h3>
              <p className="font-sans text-xs text-neutral-500 mb-3 text-center px-4">
                Create your first ad campaign to boost visibility.
              </p>
              <Button className="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-xs">
                <Plus className="w-3 h-3" />
                Create Campaign
              </Button>
            </div>
          ) : (
            <div className="md:hidden space-y-3">
              {ads.map((ad) => (
                <Card key={ad.id} className="border border-neutral-200 shadow-sm">
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3 mb-3">
                      <img
                        src={ad.image}
                        alt={ad.title}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-1">
                          <h3 className="font-sans font-semibold text-sm text-neutral-900">
                            {ad.title}
                          </h3>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                              ad.status
                            )}`}
                          >
                            {ad.status.charAt(0).toUpperCase() + ad.status.slice(1)}
                          </span>
                        </div>
                        <p className="font-sans text-xs text-neutral-500">
                          {ad.startDate} - {ad.endDate}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div>
                        <p className="font-sans text-xs text-neutral-600">Budget</p>
                        <p className="font-sans text-sm font-semibold text-neutral-900">
                          ₦{(ad.budget / 1000).toFixed(0)}K
                        </p>
                        <p className="font-sans text-xs text-neutral-500">
                          ₦{(ad.spent / 1000).toFixed(0)}K spent
                        </p>
                      </div>
                      <div>
                        <p className="font-sans text-xs text-neutral-600">Performance</p>
                        <p className="font-sans text-sm font-semibold text-neutral-900">
                          {(ad.impressions / 1000).toFixed(1)}K views
                        </p>
                        <p className="font-sans text-xs text-neutral-500">
                          {(ad.clicks / 1000).toFixed(1)}K clicks
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-neutral-200">
                      <div className="flex items-center gap-3">
                        <div className="text-center">
                          <p className="font-sans text-xs text-neutral-600">CTR</p>
                          <p className="font-sans text-sm font-semibold text-neutral-900">
                            {ad.ctr.toFixed(1)}%
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="font-sans text-xs text-neutral-600">Conversions</p>
                          <p className="font-sans text-sm font-semibold text-neutral-900">
                            {ad.conversions}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
                          <BarChart2 className="w-4 h-4 text-neutral-600" />
                        </button>
                        <button className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
                          <Edit className="w-4 h-4 text-neutral-600" />
                        </button>
                        <button className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
