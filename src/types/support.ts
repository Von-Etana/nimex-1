export interface SupportTicket {
  id: string;
  ticket_number: string;
  user_id: string;
  subject: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'assigned' | 'in_progress' | 'waiting_customer' | 'resolved' | 'closed';
  assigned_to?: string;
  order_id?: string;
  attachments: string[];
  tags: string[];
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  closed_at?: string;
  user?: {
    full_name: string;
    email: string;
  };
  assigned_user?: {
    full_name: string;
  };
  order?: {
    order_number: string;
    status: string;
  };
}

export type TicketStatus = SupportTicket['status'];
export type TicketPriority = SupportTicket['priority'];
export type TicketCategory = SupportTicket['category'];

export interface TicketStats {
  open: number;
  assigned: number;
  in_progress: number;
  waiting_customer: number;
  resolved: number;
  closed: number;
}

export interface CreateTicketData {
  subject: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  order_id?: string;
  attachments: File[];
}