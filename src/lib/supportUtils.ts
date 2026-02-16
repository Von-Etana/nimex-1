import { SUPPORT_CONSTANTS, SUPPORT_MESSAGES } from '../constants/support';
import { TicketStatus, TicketPriority, TicketStats, SupportTicket } from '../types/support';
import { logger } from './logger';
import { FirebaseStorageService } from '../services/firebaseStorage.service';
import { STORAGE_PATHS } from './collections';

// Debounce utility for real-time updates
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// File validation utilities
export const validateFile = (file: File): { isValid: boolean; error?: string } => {
  // Check file size
  if (file.size > SUPPORT_CONSTANTS.MAX_ATTACHMENT_SIZE) {
    return {
      isValid: false,
      error: SUPPORT_MESSAGES.ERRORS.FILE_TOO_LARGE
    };
  }

  // Check file type
  if (!SUPPORT_CONSTANTS.ALLOWED_FILE_TYPES.includes(file.type as any)) {
    return {
      isValid: false,
      error: SUPPORT_MESSAGES.ERRORS.INVALID_FILE_TYPE
    };
  }

  return { isValid: true };
};

export const validateFiles = (files: File[]): { isValid: boolean; error?: string } => {
  if (files.length > SUPPORT_CONSTANTS.MAX_ATTACHMENTS) {
    return {
      isValid: false,
      error: SUPPORT_MESSAGES.ERRORS.MAX_ATTACHMENTS_EXCEEDED
    };
  }

  for (const file of files) {
    const validation = validateFile(file);
    if (!validation.isValid) {
      return validation;
    }
  }

  return { isValid: true };
};

// Status and priority utilities
export const getStatusColor = (status: TicketStatus): string => {
  switch (status) {
    case 'open':
      return 'bg-blue-100 text-blue-700';
    case 'assigned':
      return 'bg-yellow-100 text-yellow-700';
    case 'in_progress':
      return 'bg-orange-100 text-orange-700';
    case 'waiting_customer':
      return 'bg-purple-100 text-purple-700';
    case 'resolved':
      return 'bg-green-100 text-green-700';
    case 'closed':
      return 'bg-neutral-100 text-neutral-700';
    default:
      return 'bg-neutral-100 text-neutral-700';
  }
};

export const getPriorityColor = (priority: TicketPriority): string => {
  switch (priority) {
    case 'low':
      return 'bg-green-100 text-green-700';
    case 'medium':
      return 'bg-yellow-100 text-yellow-700';
    case 'high':
      return 'bg-orange-100 text-orange-700';
    case 'urgent':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-neutral-100 text-neutral-700';
  }
};

export const getStatusStats = (tickets: SupportTicket[]): TicketStats => {
  const stats: TicketStats = {
    open: 0,
    assigned: 0,
    in_progress: 0,
    waiting_customer: 0,
    resolved: 0,
    closed: 0
  };

  tickets.forEach(ticket => {
    stats[ticket.status]++;
  });

  return stats;
};

// Ticket number generation
export const generateTicketNumber = (): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 5).toUpperCase();
  return `TICK-${timestamp}-${random}`;
};

// Error handling utilities
export const handleSupportError = (error: any, context: string): string => {
  logger.error(`${context}: ${error?.message || 'Unknown error'}`, error);

  // Return user-friendly error message
  if (error?.code === 'permission-denied') {
    return SUPPORT_MESSAGES.ERRORS.UNAUTHORIZED;
  }

  if (error?.message?.includes('network')) {
    return SUPPORT_MESSAGES.ERRORS.NETWORK_ERROR;
  }

  return SUPPORT_MESSAGES.ERRORS.TICKET_CREATION_FAILED;
};

// Filter utilities
export const filterTickets = (
  tickets: SupportTicket[],
  searchQuery: string,
  statusFilter: 'all' | TicketStatus,
  priorityFilter: 'all' | TicketPriority
): SupportTicket[] => {
  return tickets.filter((ticket) => {
    const matchesSearch =
      ticket.ticket_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.user?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });
};

// File upload utilities
export const uploadSupportAttachment = async (
  file: File,
  userId: string
): Promise<{ url: string } | { error: string }> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
    // Use STORAGE_PATHS.SUPPORT_ATTACHMENTS if available, or fallback
    const basePath = STORAGE_PATHS.SUPPORT_ATTACHMENTS || 'support/attachments';
    const filePath = `${basePath}/${fileName}`;

    const url = await FirebaseStorageService.uploadFile(file, filePath);

    return { url };
  } catch (error) {
    logger.error('Error uploading support attachment', error);
    return { error: SUPPORT_MESSAGES.ERRORS.TICKET_CREATION_FAILED };
  }
};

export const uploadSupportAttachments = async (
  files: File[],
  userId: string
): Promise<{ urls: string[] } | { error: string }> => {
  const urls: string[] = [];

  for (const file of files) {
    const result = await uploadSupportAttachment(file, userId);
    if ('error' in result) {
      return { error: result.error };
    }
    urls.push(result.url);
  }

  return { urls };
};