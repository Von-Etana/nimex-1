import React from 'react';
import { XCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { SupportTicket, TicketStatus } from '../../types/support';
import { TicketStatusBadge, TicketPriorityBadge } from '../support';
import { sanitizeText } from '../../lib/sanitization';

interface SupportTicketModalProps {
  ticket: SupportTicket | null;
  updatingStatus: string | null;
  onClose: () => void;
  onUpdateStatus: (ticketId: string, status: TicketStatus) => void;
}

export const SupportTicketModal: React.FC<SupportTicketModalProps> = ({
  ticket,
  updatingStatus,
  onClose,
  onUpdateStatus
}) => {
  if (!ticket) return null;

  const statusActions = [
    { status: 'assigned' as const, label: 'Assign', show: ticket.status !== 'assigned' },
    { status: 'in_progress' as const, label: 'Start Working', show: ticket.status !== 'in_progress' },
    { status: 'waiting_customer' as const, label: 'Wait for Customer', show: ticket.status !== 'waiting_customer' },
    { status: 'resolved' as const, label: 'Resolve', show: ticket.status !== 'resolved', primary: true },
    { status: 'closed' as const, label: 'Close', show: ticket.status !== 'closed' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-bold text-xl text-neutral-900">
              Support Ticket Details
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-neutral-100 rounded-lg"
            >
              <XCircle className="w-5 h-5 text-neutral-600" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-sans text-sm font-semibold text-neutral-700">
                  Ticket Number
                </label>
                <p className="font-sans text-sm text-neutral-900 font-mono">
                  {ticket.ticket_number}
                </p>
              </div>
              <div>
                <label className="font-sans text-sm font-semibold text-neutral-700">
                  Status
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <TicketStatusBadge status={ticket.status} />
                  {updatingStatus === ticket.id && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-700"></div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-sans text-sm font-semibold text-neutral-700">
                  Customer
                </label>
                <div className="mt-1">
                  <p className="font-sans text-sm text-neutral-900 font-medium">
                    {ticket.user?.full_name || 'Unknown'}
                  </p>
                  <p className="font-sans text-sm text-neutral-600">
                    {ticket.user?.email}
                  </p>
                </div>
              </div>
              <div>
                <label className="font-sans text-sm font-semibold text-neutral-700">
                  Assigned To
                </label>
                <p className="font-sans text-sm text-neutral-900 mt-1">
                  {ticket.assigned_user?.full_name || 'Unassigned'}
                </p>
              </div>
            </div>

            <div>
              <label className="font-sans text-sm font-semibold text-neutral-700">
                Subject
              </label>
              <p className="font-sans text-sm text-neutral-900 mt-1">
                {sanitizeText(ticket.subject)}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="font-sans text-sm font-semibold text-neutral-700">
                  Category
                </label>
                <p className="font-sans text-sm text-neutral-900">
                  {ticket.category}
                </p>
              </div>
              <div>
                <label className="font-sans text-sm font-semibold text-neutral-700">
                  Priority
                </label>
                <div className="mt-1">
                  <TicketPriorityBadge priority={ticket.priority} />
                </div>
              </div>
              <div>
                <label className="font-sans text-sm font-semibold text-neutral-700">
                  Created
                </label>
                <p className="font-sans text-sm text-neutral-900">
                  {new Date(ticket.created_at).toLocaleString()}
                </p>
              </div>
            </div>

            {ticket.order && (
              <div>
                <label className="font-sans text-sm font-semibold text-neutral-700">
                  Related Order
                </label>
                <p className="font-sans text-sm text-neutral-900">
                  {ticket.order.order_number} ({ticket.order.status})
                </p>
              </div>
            )}

            <div>
              <label className="font-sans text-sm font-semibold text-neutral-700">
                Description
              </label>
              <p className="font-sans text-sm text-neutral-900 mt-1 whitespace-pre-wrap">
                {sanitizeText(ticket.description)}
              </p>
            </div>

            {ticket.attachments && ticket.attachments.length > 0 && (
              <div>
                <label className="font-sans text-sm font-semibold text-neutral-700">
                  Attachments
                </label>
                <div className="mt-2 space-y-2">
                  {ticket.attachments.map((attachment, index) => (
                    <a
                      key={index}
                      href={attachment}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors"
                    >
                      <span className="font-sans text-sm text-neutral-900">
                        Attachment {index + 1}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Status Update Actions */}
            <div className="border-t pt-4">
              <label className="font-sans text-sm font-semibold text-neutral-700 block mb-3">
                Update Status
              </label>
              <div className="flex flex-wrap gap-2">
                {statusActions
                  .filter(action => action.show)
                  .map(action => (
                    <Button
                      key={action.status}
                      onClick={() => onUpdateStatus(ticket.id, action.status)}
                      disabled={updatingStatus === ticket.id}
                      variant={action.primary ? "default" : "outline"}
                      size="sm"
                      className={action.primary ? "bg-green-700 hover:bg-green-800 text-white" : ""}
                    >
                      {action.label}
                    </Button>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};