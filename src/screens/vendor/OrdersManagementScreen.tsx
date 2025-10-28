import React, { useState } from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Search, ChevronDown } from 'lucide-react';

interface Order {
  id: string;
  customer: string;
  date: string;
  items: number;
  total: number;
  status: 'pending' | 'in_progress' | 'completed' | 'disputed';
}

type FilterStatus = 'all' | 'pending' | 'in_progress' | 'completed' | 'disputed';

const mockOrders: Order[] = [
  {
    id: 'NIMX-00101',
    customer: 'Aisha Adebayo',
    date: '2024-07-20',
    items: 3,
    total: 15000,
    status: 'pending',
  },
  {
    id: 'NIMX-00100',
    customer: 'Chike Okoro',
    date: '2024-07-19',
    items: 2,
    total: 8500,
    status: 'in_progress',
  },
  {
    id: 'NIMX-00099',
    customer: 'Fatima Musa',
    date: '2024-07-18',
    items: 5,
    total: 22300,
    status: 'completed',
  },
  {
    id: 'NIMX-00098',
    customer: 'Emeka Obi',
    date: '2024-07-17',
    items: 1,
    total: 4250,
    status: 'disputed',
  },
  {
    id: 'NIMX-00097',
    customer: 'Zainab Ahmed',
    date: '2024-07-16',
    items: 4,
    total: 18900,
    status: 'in_progress',
  },
  {
    id: 'NIMX-00096',
    customer: 'Kunle Fasina',
    date: '2024-07-15',
    items: 2,
    total: 9800,
    status: 'completed',
  },
  {
    id: 'NIMX-00095',
    customer: 'Ngozi Eze',
    date: '2024-07-14',
    items: 3,
    total: 12000,
    status: 'pending',
  },
];

export const OrdersManagementScreen: React.FC = () => {
  const [orders] = useState<Order[]>(mockOrders);
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-neutral-200 text-neutral-700';
      case 'in_progress':
        return 'bg-yellow-500 text-neutral-900';
      case 'completed':
        return 'bg-green-600 text-white';
      case 'disputed':
        return 'bg-red-500 text-white';
      default:
        return 'bg-neutral-200 text-neutral-700';
    }
  };

  const getStatusLabel = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'in_progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      case 'disputed':
        return 'Disputed';
      default:
        return status;
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesFilter = activeFilter === 'all' || order.status === activeFilter;
    const matchesSearch =
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const filters: { label: string; value: FilterStatus }[] = [
    { label: 'All', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'In Progress', value: 'in_progress' },
    { label: 'Completed', value: 'completed' },
    { label: 'Disputed', value: 'disputed' },
  ];

  return (
    <div className="flex flex-col w-full min-h-screen bg-neutral-50">
      <div className="w-full max-w-7xl mx-auto px-3 md:px-6 py-4 md:py-8">
        <div className="flex flex-col gap-4 md:gap-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <h1 className="font-heading font-bold text-neutral-900 text-lg md:text-3xl">
              Orders
            </h1>

            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-neutral-400" />
              <input
                type="text"
                placeholder="Search orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 md:pl-10 pr-3 md:pr-4 py-2 border border-neutral-200 rounded-lg font-sans text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-green-700 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3 overflow-x-auto pb-2 -mx-3 px-3 md:mx-0 md:px-0">
            {filters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setActiveFilter(filter.value)}
                className={`px-3 md:px-6 py-1.5 md:py-2 rounded-lg font-sans text-xs md:text-sm font-medium transition-colors whitespace-nowrap ${
                  activeFilter === filter.value
                    ? 'bg-green-700 text-white'
                    : 'bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-50'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="hidden md:block">
            <Card className="border border-neutral-200 shadow-sm">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-neutral-50 border-b border-neutral-200">
                      <tr>
                        <th className="text-left px-6 py-4 font-sans text-sm font-semibold text-neutral-700">
                          Order ID
                        </th>
                        <th className="text-left px-6 py-4 font-sans text-sm font-semibold text-neutral-700">
                          Customer
                        </th>
                        <th className="text-left px-6 py-4 font-sans text-sm font-semibold text-neutral-700">
                          Date
                        </th>
                        <th className="text-left px-6 py-4 font-sans text-sm font-semibold text-neutral-700">
                          Items
                        </th>
                        <th className="text-left px-6 py-4 font-sans text-sm font-semibold text-neutral-700">
                          Total
                        </th>
                        <th className="text-left px-6 py-4 font-sans text-sm font-semibold text-neutral-700">
                          Status
                        </th>
                        <th className="text-left px-6 py-4 font-sans text-sm font-semibold text-neutral-700">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.length === 0 ? (
                        <tr>
                          <td
                            colSpan={7}
                            className="px-6 py-12 text-center text-neutral-500 font-sans text-sm"
                          >
                            No orders found
                          </td>
                        </tr>
                      ) : (
                        filteredOrders.map((order) => (
                          <tr
                            key={order.id}
                            className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors"
                          >
                            <td className="px-6 py-4">
                              <span className="font-sans text-sm text-neutral-900 font-medium">
                                {order.id}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="font-sans text-sm text-neutral-900">
                                {order.customer}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="font-sans text-sm text-neutral-700">
                                {order.date}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="font-sans text-sm text-neutral-700">
                                {order.items}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="font-sans text-sm text-neutral-900 font-semibold">
                                ₦{(order.total/1000).toFixed(1)}K
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`px-4 py-1.5 rounded-full text-xs font-semibold ${getStatusColor(
                                  order.status
                                )}`}
                              >
                                {getStatusLabel(order.status)}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <button className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
                                <ChevronDown className="w-5 h-5 text-neutral-600" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="md:hidden space-y-3">
            {filteredOrders.length === 0 ? (
              <Card className="border border-neutral-200 shadow-sm">
                <CardContent className="p-8 text-center">
                  <p className="font-sans text-sm text-neutral-500">No orders found</p>
                </CardContent>
              </Card>
            ) : (
              filteredOrders.map((order) => (
                <Card key={order.id} className="border border-neutral-200 shadow-sm">
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-sans font-semibold text-sm text-neutral-900">
                          {order.id}
                        </h3>
                        <p className="font-sans text-xs text-neutral-600 mt-0.5">
                          {order.customer}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {getStatusLabel(order.status)}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 py-3 border-t border-neutral-200">
                      <div>
                        <p className="font-sans text-xs text-neutral-600">Date</p>
                        <p className="font-sans text-sm text-neutral-900 mt-0.5">
                          {order.date}
                        </p>
                      </div>
                      <div>
                        <p className="font-sans text-xs text-neutral-600">Items</p>
                        <p className="font-sans text-sm text-neutral-900 mt-0.5">
                          {order.items}
                        </p>
                      </div>
                      <div>
                        <p className="font-sans text-xs text-neutral-600">Total</p>
                        <p className="font-sans text-sm font-semibold text-neutral-900 mt-0.5">
                          ₦{(order.total/1000).toFixed(1)}K
                        </p>
                      </div>
                    </div>

                    <button className="w-full mt-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 rounded-lg font-sans text-sm transition-colors">
                      View Details
                    </button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {filteredOrders.length > 0 && (
            <div className="flex items-center justify-between">
              <p className="font-sans text-xs md:text-sm text-neutral-600">
                Showing {filteredOrders.length} of {orders.length} orders
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
