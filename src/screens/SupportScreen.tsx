import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { MessageSquare, Plus, Eye, Upload, XCircle } from 'lucide-react';
import { FirestoreService } from '../services/firestore.service';
import { COLLECTIONS } from '../lib/collections';
import { where, orderBy, onSnapshot, query, collection, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase.config';
import { logger } from '../lib/logger';
import { useAuth } from '../contexts/AuthContext';
import { SupportTicket, TicketStatus, TicketPriority } from '../types/support';
import { SUPPORT_CONSTANTS, SUPPORT_MESSAGES } from '../constants/support';
import { TicketStatusBadge, TicketPriorityBadge } from '../components/support';
import {
  validateFiles,
  generateTicketNumber,
  handleSupportError,
  debounce,
  uploadSupportAttachments
} from '../lib/supportUtils';

export const SupportScreen: React.FC = () => {
  const { user, profile } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

  // Form state
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [orderId, setOrderId] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const loadTickets = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const ticketsData = await FirestoreService.getDocuments<SupportTicket>(COLLECTIONS.SUPPORT_TICKETS, {
        where: [{ field: 'user_id', operator: '==', value: user.uid }],
        orderBy: { field: 'created_at', direction: 'desc' }
      });
      setTickets(ticketsData);
    } catch (error) {
      console.error('Error loading tickets:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const handleCreateTicket = async () => {
    if (!user) return;

    try {
      setSubmitting(true);

      const ticketData = {
        user_id: user.uid,
        ticket_number: generateTicketNumber(),
        subject,
        description,
        category,
        priority,
        status: 'open' as TicketStatus,
        order_id: orderId || null,
        created_at: Timestamp.now(),
        updated_at: Timestamp.now(),
        attachments: [] as string[]
      };

      // Handle file uploads if any
      if (attachments.length > 0) {
        const urls = await uploadSupportAttachments(user.uid, attachments);
        if (urls) ticketData.attachments = urls;
      }

      await FirestoreService.addDocument(COLLECTIONS.SUPPORT_TICKETS, ticketData);

      setSubject('');
      setDescription('');
      setCategory('');
      setPriority('medium');
      setOrderId('');
      setAttachments([]);
      setShowCreateForm(false);

      loadTickets();
      console.log(SUPPORT_MESSAGES.SUCCESS.TICKET_CREATED);
    } catch (error) {
      const errorMessage = handleSupportError(error, 'Creating support ticket');
      alert(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };
  const categories = SUPPORT_CONSTANTS.TICKET_CATEGORIES;

  return (
    <div className="w-full min-h-screen bg-neutral-50">
      <div className="w-full max-w-6xl mx-auto px-3 md:px-6 py-4 md:py-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="font-heading font-bold text-2xl md:text-3xl text-neutral-900">
                Support Center
              </h1>
              <p className="font-sans text-sm text-neutral-600 mt-1">
                Get help with your orders, account, or any issues
              </p>
            </div>
            <Button
              onClick={() => setShowCreateForm(true)}
              className="bg-green-700 hover:bg-green-800 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Support Ticket
            </Button>
          </div>

          {/* Create Ticket Form */}
          {showCreateForm && (
            <Card className="border border-neutral-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Create Support Ticket
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-sans text-sm font-semibold text-neutral-700 mb-2">
                      Subject *
                    </label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Brief description of your issue"
                      className="w-full px-3 py-2 border border-neutral-200 rounded-lg font-sans text-sm focus:outline-none focus:ring-2 focus:ring-green-700"
                      maxLength={100}
                    />
                  </div>
                  <div>
                    <label className="block font-sans text-sm font-semibold text-neutral-700 mb-2">
                      Category *
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-200 rounded-lg font-sans text-sm focus:outline-none focus:ring-2 focus:ring-green-700"
                    >
                      <option value="">Select category</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-sans text-sm font-semibold text-neutral-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Please provide detailed information about your issue..."
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg font-sans text-sm focus:outline-none focus:ring-2 focus:ring-green-700 resize-none"
                    rows={6}
                    maxLength={2000}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-sans text-sm font-semibold text-neutral-700 mb-2">
                      Priority
                    </label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as any)}
                      className="w-full px-3 py-2 border border-neutral-200 rounded-lg font-sans text-sm focus:outline-none focus:ring-2 focus:ring-green-700"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-sans text-sm font-semibold text-neutral-700 mb-2">
                      Related Order (Optional)
                    </label>
                    <input
                      type="text"
                      value={orderId}
                      onChange={(e) => setOrderId(e.target.value)}
                      placeholder="Order ID if related"
                      className="w-full px-3 py-2 border border-neutral-200 rounded-lg font-sans text-sm focus:outline-none focus:ring-2 focus:ring-green-700"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-sans text-sm font-semibold text-neutral-700 mb-2">
                    Attachments (Optional)
                  </label>
                  <input
                    type="file"
                    multiple
                    accept="image/*,.pdf,.doc,.docx"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      if (attachments.length + files.length > 5) {
                        alert('Maximum 5 attachments allowed');
                        return;
                      }
                      setAttachments(prev => [...prev, ...files]);
                    }}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg font-sans text-sm focus:outline-none focus:ring-2 focus:ring-green-700"
                  />
                  {attachments.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {attachments.map((file, index) => (
                        <div key={index} className="flex items-center gap-2 bg-neutral-100 px-2 py-1 rounded">
                          <span className="font-sans text-xs">{file.name}</span>
                          <button
                            onClick={() => setAttachments(prev => prev.filter((_, i) => i !== index))}
                            className="text-red-600 hover:text-red-800"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    onClick={() => setShowCreateForm(false)}
                    variant="outline"
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateTicket}
                    disabled={!subject.trim() || !description.trim() || !category || submitting}
                    className="bg-green-700 hover:bg-green-800 text-white"
                  >
                    {submitting ? 'Creating...' : 'Create Ticket'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tickets List */}
          <div className="hidden md:block">
            <Card className="border border-neutral-200 shadow-sm">
              <CardContent className="p-0">
                <table className="w-full">
                  <thead className="bg-neutral-50 border-b border-neutral-200">
                    <tr>
                      <th className="text-left px-6 py-4 font-sans text-sm font-semibold text-neutral-700">
                        Ticket
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
                        <td colSpan={7} className="px-6 py-12 text-center text-neutral-500">
                          Loading support tickets...
                        </td>
                      </tr>
                    ) : tickets.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-neutral-500">
                          <MessageSquare className="w-12 h-12 mx-auto mb-4 text-neutral-300" />
                          <p className="font-sans text-sm">No support tickets yet</p>
                          <p className="font-sans text-xs text-neutral-400 mt-1">
                            Create your first ticket to get help
                          </p>
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
                            <div className="max-w-xs">
                              <p className="font-sans text-sm text-neutral-900 font-medium truncate">
                                {ticket.subject}
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
                              onClick={() => setSelectedTicket(ticket)}
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
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700 mx-auto"></div>
              </div>
            ) : tickets.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 text-neutral-300" />
                <h3 className="font-heading font-semibold text-lg mb-2">
                  No support tickets
                </h3>
                <p className="font-sans text-sm text-neutral-600">
                  Create your first ticket to get help
                </p>
              </div>
            ) : (
              tickets.map((ticket) => (
                <Card key={ticket.id} className="border border-neutral-200 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-sans font-semibold text-neutral-900">
                          {ticket.ticket_number}
                        </h3>
                        <p className="font-sans text-sm text-neutral-600">
                          {ticket.subject}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <TicketStatusBadge status={ticket.status} />
                        <TicketPriorityBadge priority={ticket.priority} />
                      </div>
                    </div>

                    <div className="space-y-2 mb-3">
                      <p className="font-sans text-sm text-neutral-700">
                        <strong>Category:</strong> {ticket.category}
                      </p>
                      {ticket.order && (
                        <p className="font-sans text-sm text-neutral-700">
                          <strong>Order:</strong> {ticket.order.order_number}
                        </p>
                      )}
                      <p className="font-sans text-sm text-neutral-700">
                        <strong>Created:</strong> {new Date(ticket.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <Button
                      onClick={() => setSelectedTicket(ticket)}
                      variant="outline"
                      className="w-full"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Ticket Details Modal */}
          {selectedTicket && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-heading font-bold text-xl text-neutral-900">
                      Support Ticket Details
                    </h2>
                    <button
                      onClick={() => setSelectedTicket(null)}
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
                          {selectedTicket.ticket_number}
                        </p>
                      </div>
                      <div>
                        <label className="font-sans text-sm font-semibold text-neutral-700">
                          Status
                        </label>
                        <div className="mt-1">
                          <TicketStatusBadge status={selectedTicket.status} />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="font-sans text-sm font-semibold text-neutral-700">
                        Subject
                      </label>
                      <p className="font-sans text-sm text-neutral-900 mt-1">
                        {selectedTicket.subject}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="font-sans text-sm font-semibold text-neutral-700">
                          Category
                        </label>
                        <p className="font-sans text-sm text-neutral-900">
                          {selectedTicket.category}
                        </p>
                      </div>
                      <div>
                        <label className="font-sans text-sm font-semibold text-neutral-700">
                          Priority
                        </label>
                        <div className="mt-1">
                          <TicketPriorityBadge priority={selectedTicket.priority} />
                        </div>
                      </div>
                    </div>

                    {selectedTicket.order && (
                      <div>
                        <label className="font-sans text-sm font-semibold text-neutral-700">
                          Related Order
                        </label>
                        <p className="font-sans text-sm text-neutral-900">
                          {selectedTicket.order.order_number} ({selectedTicket.order.status})
                        </p>
                      </div>
                    )}

                    <div>
                      <label className="font-sans text-sm font-semibold text-neutral-700">
                        Description
                      </label>
                      <p className="font-sans text-sm text-neutral-900 mt-1 whitespace-pre-wrap">
                        {selectedTicket.description}
                      </p>
                    </div>

                    {selectedTicket.attachments && selectedTicket.attachments.length > 0 && (
                      <div>
                        <label className="font-sans text-sm font-semibold text-neutral-700">
                          Attachments
                        </label>
                        <div className="mt-2 space-y-2">
                          {selectedTicket.attachments.map((attachment, index) => (
                            <a
                              key={index}
                              href={attachment}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 p-2 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors"
                            >
                              <Upload className="w-4 h-4 text-neutral-600" />
                              <span className="font-sans text-sm text-neutral-900">
                                Attachment {index + 1}
                              </span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-neutral-200">
                      <div>
                        <label className="font-sans text-sm font-semibold text-neutral-700">
                          Created
                        </label>
                        <p className="font-sans text-sm text-neutral-900">
                          {new Date(selectedTicket.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <label className="font-sans text-sm font-semibold text-neutral-700">
                          Last Updated
                        </label>
                        <p className="font-sans text-sm text-neutral-900">
                          {new Date(selectedTicket.updated_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};