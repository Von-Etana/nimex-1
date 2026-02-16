import React from 'react';
import { TicketStatus } from '../../types/support';
import { getStatusColor } from '../../lib/supportUtils';

interface TicketStatusBadgeProps {
  status: TicketStatus;
  className?: string;
}

export const TicketStatusBadge: React.FC<TicketStatusBadgeProps> = ({
  status,
  className = ''
}) => {
  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
        status
      )} ${className}`}
    >
      {status.replace('_', ' ')}
    </span>
  );
};