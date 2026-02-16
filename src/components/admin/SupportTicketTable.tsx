import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Eye } from 'lucide-react';
import { SupportTicket } from '../../types/support';
import { TicketStatusBadge, TicketPriorityBadge } from '../support';
import { sanitizeText } from '../../lib/sanitization';

interface SupportTicketTableProps {
  tickets: SupportTicket[];
  loading: boolean;
  onViewTicket: (ticket: SupportTicket) => void;
}

export const SupportTicketTable: React.FC<SupportTicketTableProps> = ({
  tickets,
  loading,
  onViewTicket
}) => {
  return (
    <Card className="border border-neutral-200 shadow-sm">
      <CardContent className="p-0">
        <table className="w-full">
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr>
              <th className="text-left px-6 py-4 font-sans text-sm font-semibold text-neutral-700">
                Ticket
              </th>
              <th className="text-left px-6 py-4 font-sans text-sm font-semibold text-neutral-700">
                Customer
              </th>
              <th className="text-left px-6 py-4 font-sans text-sm font-semibold text-neutral-700">
                Subject
              </th>
              <th className="text-left px-6 py-4 font-sans text-sm font-semibold text-neutral-700">
                Category
              </th>
              <th className="text-left px-6 py-4 font-sans text-sm font-semibold text-neutral-700">
                Priority
              </th>
              <th className="text-left px-6 py-4 font-sans text-sm font-semibold text-neutral-700">
                Status
              </th>
              <th className="text-left px-6 py-4 font-sans text-sm font-semibold text-neutral-700">
                Created
              </th>
              <th className="text-left px-6 py-4 font-sans text-sm font-semibold text-neutral-700">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-neutral-500">
                  Loading support tickets...
                </td>
              </tr>
            ) : tickets.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-neutral-500">
                  No support tickets found
                </td>
              </tr>
            ) : (
              tickets.map((ticket) => (
                <tr
                  key={ticket.id}
                  className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors"
                >
                  <td className="px-6 py-4 font-sans text-sm text-neutral-900 font-medium">
                    {ticket.ticket_number}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-sans text-sm text-neutral-900 font-medium">
                        {ticket.user?.full_name || 'Unknown'}
                      </span>
                      <span className="font-sans text-xs text-neutral-600">
                        {ticket.user?.email}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="max-w-xs">
                      <p className="font-sans text-sm text-neutral-900 font-medium truncate">
                        {sanitizeText(ticket.subject)}
                      </p>
                      {ticket.order && (
                        <p className="font-sans text-xs text-neutral-600">
                          Order: {ticket.order.order_number}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-sans text-sm text-neutral-700">
                    {ticket.category}
                  </td>
                  <td className="px-6 py-4">
                    <TicketPriorityBadge priority={ticket.priority} />
                  </td>
                  <td className="px-6 py-4">
                    <TicketStatusBadge status={ticket.status} />
                  </td>
                  <td className="px-6 py-4 font-sans text-sm text-neutral-600">
                    {new Date(ticket.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => onViewTicket(ticket)}
                      className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                      title="View details"
                    >
                      <Eye className="w-5 h-5 text-neutral-600" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
};