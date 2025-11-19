import React from 'react';
import { TicketPriority } from '../../types/support';
import { getPriorityColor } from '../../lib/supportUtils';

interface TicketPriorityBadgeProps {
  priority: TicketPriority;
  className?: string;
}

export const TicketPriorityBadge: React.FC<TicketPriorityBadgeProps> = ({
  priority,
  className = ''
}) => {
  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-semibold ${getPriorityColor(
        priority
      )} ${className}`}
    >
      {priority}
    </span>
  );
};