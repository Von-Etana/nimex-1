import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '../../components/ui/button';
import { Search } from 'lucide-react';
import { FirestoreService } from '../../services/firestore.service';
import { logger } from '../../lib/logger';
import { SupportTicket, TicketStatus, TicketPriority, TicketStats } from '../../types/support';
import { SUPPORT_CONSTANTS, SUPPORT_MESSAGES } from '../../constants/support';
import { SupportStatsCards } from '../../components/admin/SupportStatsCards';
import { SupportTicketTable } from '../../components/admin/SupportTicketTable';
import { SupportTicketModal } from '../../components/admin/SupportTicketModal';
import {
  getStatusStats,
  filterTickets,
  handleSupportError,
  debounce
} from '../../lib/supportUtils';

export const AdminSupportScreen: React.FC = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | SupportTicket['status']>('all');
  const [filterPriority, setFilterPriority] = useState<'all' | SupportTicket['priority']>('all');
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const debouncedLoadTickets = useCallback(
    debounce(() => {
      loadTickets();
    }, SUPPORT_CONSTANTS.DEBOUNCE_DELAY),
    []
  );

  useEffect(() => {
    loadTickets();
    // Real-time updates can be implemented with FirestoreService.subscribeToQuery if needed
  }, [debouncedLoadTickets]);

  const loadTickets = async () => {
    try {
      setLoading(true);
      logger.info('Loading all support tickets for admin');

      const ticketsData = await FirestoreService.getDocuments<any>('support_tickets', {
        orderBy: { field: 'created_at', direction: 'desc' }
      });

      if (!ticketsData || ticketsData.length === 0) {
        setTickets([]);
        return;
      }

      // Collect IDs for related data
      const userIds = Array.from(new Set(ticketsData.map(t => t.user_id).filter(Boolean)));
      const assignedIds = Array.from(new Set(ticketsData.map(t => t.assigned_to).filter(Boolean)));
      const orderIds = Array.from(new Set(ticketsData.map(t => t.order_id).filter(Boolean)));

      const profilesMap = new Map();
      const ordersMap = new Map();

      // Fetch Profiles (user_id and assigned_to)
      const allProfileIds = Array.from(new Set([...userIds, ...assignedIds]));
      if (allProfileIds.length > 0) {
        const allProfiles = await FirestoreService.getDocuments('profiles');
        allProfiles.forEach(p => profilesMap.set(p.id, p));
      }

      // Fetch Orders
      if (orderIds.length > 0) {
        const allOrders = await FirestoreService.getDocuments('orders');
        allOrders.forEach(o => ordersMap.set(o.id, o));
      }

      const mappedTickets = ticketsData.map((t: any) => ({
        ...t,
        profiles: profilesMap.get(t.user_id) ? {
          full_name: profilesMap.get(t.user_id).full_name,
          email: profilesMap.get(t.user_id).email
        } : undefined,
        assigned_profiles: profilesMap.get(t.assigned_to) ? {
          full_name: profilesMap.get(t.assigned_to).full_name
        } : undefined,
        orders: ordersMap.get(t.order_id) ? {
          order_number: ordersMap.get(t.order_id).order_number,
          status: ordersMap.get(t.order_id).status
        } : undefined
      }));

      setTickets(mappedTickets);
    } catch (error) {
      logger.error('Error loading support tickets', error);
    } finally {
      setLoading(false);
    }
  };

  const updateTicketStatus = async (ticketId: string, newStatus: TicketStatus) => {
    // Store previous state for rollback
    const previousTickets = [...tickets];
    const previousSelectedTicket = selectedTicket;

    // Optimistic update
    const optimisticUpdateData: any = {
      status: newStatus,
      updated_at: new Date().toISOString()
    };

    if (newStatus === 'resolved') {
      optimisticUpdateData.resolved_at = new Date().toISOString();
    } else if (newStatus === 'closed') {
      optimisticUpdateData.closed_at = new Date().toISOString();
    }

    // Update UI immediately
    setTickets(prevTickets =>
      prevTickets.map(ticket =>
        ticket.id === ticketId ? { ...ticket, ...optimisticUpdateData } : ticket
      )
    );

    if (selectedTicket?.id === ticketId) {
      setSelectedTicket(prev => prev ? { ...prev, ...optimisticUpdateData } : null);
    }

    setUpdatingStatus(ticketId);

    try {
      logger.info(`Updating ticket ${ticketId} status to ${newStatus}`);

      await FirestoreService.updateDocument('support_tickets', ticketId, optimisticUpdateData);

      setSelectedTicket(null);
      logger.info(`Ticket ${ticketId} status updated to ${newStatus}`);
    } catch (error) {
      // Revert optimistic update on error
      setTickets(previousTickets);
      setSelectedTicket(previousSelectedTicket);
      const errorMessage = handleSupportError(error, 'Updating ticket status');
      alert(errorMessage);
    } finally {
      setUpdatingStatus(null);
    }
  };

  const filteredTickets = filterTickets(tickets, searchQuery, filterStatus, filterPriority);
  const stats = getStatusStats(tickets);

  return (
    <div className="w-full min-h-screen bg-neutral-50">
      <div className="w-full max-w-7xl mx-auto px-3 md:px-6 py-4 md:py-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="font-heading font-bold text-2xl md:text-3xl text-neutral-900">
                Support Ticket Management
              </h1>
              <p className="font-sans text-sm text-neutral-600 mt-1">
                Manage customer support tickets and inquiries
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <SupportStatsCards stats={stats} />

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="text"
                placeholder="Search tickets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg font-sans text-sm focus:outline-none focus:ring-2 focus:ring-green-700"
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto">
              {['all', 'open', 'assigned', 'in_progress', 'waiting_customer', 'resolved', 'closed'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status as any)}
                  className={`px-4 py-2 rounded-lg font-sans text-sm font-medium transition-colors whitespace-nowrap ${filterStatus === status
                      ? 'bg-green-700 text-white'
                      : 'bg-white text-neutral-700 border border-neutral-200'
                    }`}
                >
                  {status === 'all' ? 'All Status' : status.replace('_', ' ')}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              {['all', 'low', 'medium', 'high', 'urgent'].map((priority) => (
                <button
                  key={priority}
                  onClick={() => setFilterPriority(priority as any)}
                  className={`px-4 py-2 rounded-lg font-sans text-sm font-medium transition-colors whitespace-nowrap ${filterPriority === priority
                      ? 'bg-red-700 text-white'
                      : 'bg-white text-neutral-700 border border-neutral-200'
                    }`}
                >
                  {priority === 'all' ? 'All Priority' : priority}
                </button>
              ))}
            </div>
          </div>

          {/* Tickets Table */}
          <SupportTicketTable
            tickets={filteredTickets}
            loading={loading}
            onViewTicket={setSelectedTicket}
          />

          {/* Ticket Details Modal */}
          <SupportTicketModal
            ticket={selectedTicket}
            updatingStatus={updatingStatus}
            onClose={() => setSelectedTicket(null)}
            onUpdateStatus={updateTicketStatus}
          />
        </div>
      </div>
    </div>
  );
};