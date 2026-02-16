import React from 'react';
import { Card, CardContent } from '../ui/card';
import { MessageSquare, Eye, Clock, CheckCircle, XCircle, AlertTriangle, User } from 'lucide-react';

interface SupportStats {
  open: number;
  assigned: number;
  in_progress: number;
  waiting_customer: number;
  resolved: number;
  closed: number;
}

interface SupportStatsCardsProps {
  stats: SupportStats;
}

export const SupportStatsCards: React.FC<SupportStatsCardsProps> = ({ stats }) => {
  const statItems = [
    {
      label: 'Open',
      value: stats.open,
      icon: MessageSquare,
      color: 'text-blue-600'
    },
    {
      label: 'Assigned',
      value: stats.assigned,
      icon: Clock,
      color: 'text-yellow-600'
    },
    {
      label: 'In Progress',
      value: stats.in_progress,
      icon: AlertTriangle,
      color: 'text-orange-600'
    },
    {
      label: 'Waiting',
      value: stats.waiting_customer,
      icon: User,
      color: 'text-purple-600'
    },
    {
      label: 'Resolved',
      value: stats.resolved,
      icon: CheckCircle,
      color: 'text-green-600'
    },
    {
      label: 'Closed',
      value: stats.closed,
      icon: XCircle,
      color: 'text-neutral-600'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
      {statItems.map((item) => (
        <Card key={item.label} className="border border-neutral-200 shadow-sm">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <item.icon className={`w-4 h-4 ${item.color}`} />
              <div>
                <p className="font-sans text-xs text-neutral-600">{item.label}</p>
                <p className="font-heading font-bold text-lg text-neutral-900">
                  {item.value}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};