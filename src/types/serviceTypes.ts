export interface NormalizedPaymentRequest {
  amountNaira: number;
  reference: string;
  customerEmail: string;
  customerPhone?: string;
  orderId: string;
  metadata?: Record<string, any>;
  callbackUrl?: string;
}

export interface ServiceError {
  code: 'NETWORK_ERROR' | 'AUTH_FAILED' | 'INVALID_INPUT' | 'RATE_LIMITED' | 'UPSTREAM_ERROR' | 'UNKNOWN_ERROR';
  message: string;
  retryable: boolean;
}
