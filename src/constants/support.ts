export const SUPPORT_CONSTANTS = {
  MAX_ATTACHMENTS: 5,
  MAX_ATTACHMENT_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'text/plain'] as const,
  ALLOWED_FILE_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.webp', '.pdf', '.txt'] as const,
  TICKET_SUBJECT_MAX_LENGTH: 100,
  TICKET_DESCRIPTION_MAX_LENGTH: 2000,
  DEBOUNCE_DELAY: 500, // ms for real-time updates
  TICKET_CATEGORIES: [
    'Account Issues',
    'Order Problems',
    'Payment Issues',
    'Product Concerns',
    'Vendor Disputes',
    'Technical Support',
    'General Inquiry',
    'Other'
  ] as const,
  TICKET_PRIORITIES: ['low', 'medium', 'high', 'urgent'] as const,
  TICKET_STATUSES: [
    'open',
    'assigned',
    'in_progress',
    'waiting_customer',
    'resolved',
    'closed'
  ] as const
} as const;

export const SUPPORT_MESSAGES = {
  ERRORS: {
    MAX_ATTACHMENTS_EXCEEDED: `Maximum ${SUPPORT_CONSTANTS.MAX_ATTACHMENTS} attachments allowed`,
    FILE_TOO_LARGE: `File size exceeds ${SUPPORT_CONSTANTS.MAX_ATTACHMENT_SIZE / (1024 * 1024)}MB limit`,
    INVALID_FILE_TYPE: `File type not supported. Allowed types: ${SUPPORT_CONSTANTS.ALLOWED_FILE_EXTENSIONS.join(', ')}`,
    TICKET_CREATION_FAILED: 'Failed to create support ticket. Please try again.',
    TICKET_UPDATE_FAILED: 'Failed to update ticket status. Please try again.',
    NETWORK_ERROR: 'Network error. Please check your connection and try again.',
    UNAUTHORIZED: 'You are not authorized to perform this action.',
    TICKET_NOT_FOUND: 'Ticket not found.',
    INVALID_INPUT: 'Please check your input and try again.'
  },
  SUCCESS: {
    TICKET_CREATED: 'Support ticket created successfully!',
    TICKET_UPDATED: 'Ticket status updated successfully!',
    ATTACHMENT_UPLOADED: 'Attachment uploaded successfully!'
  },
  INFO: {
    LOADING_TICKETS: 'Loading support tickets...',
    NO_TICKETS: 'No support tickets found',
    CREATE_FIRST_TICKET: 'Create your first ticket to get help'
  }
} as const;