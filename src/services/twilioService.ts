interface TwilioConfig {
  accountSid: string;
  authToken: string;
  apiKey: string;
  apiSecret: string;
  phoneNumber: string;
}

interface EmailRequest {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface SMSRequest {
  to: string;
  message: string;
}

class TwilioService {
  private config: TwilioConfig;
  // TODO: Replace with Redis/external service for production persistence
  private rateLimitMap = new Map<string, number[]>();

  constructor() {
    const accountSid = import.meta.env.VITE_TWILIO_ACCOUNT_SID;
    const authToken = import.meta.env.VITE_TWILIO_AUTH_TOKEN;
    const apiKey = import.meta.env.VITE_TWILIO_API_KEY;
    const apiSecret = import.meta.env.VITE_TWILIO_API_SECRET;
    const phoneNumber = import.meta.env.VITE_TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !apiKey || !apiSecret || !phoneNumber) {
      throw new Error('Missing required Twilio environment variables: VITE_TWILIO_ACCOUNT_SID, VITE_TWILIO_AUTH_TOKEN, VITE_TWILIO_API_KEY, VITE_TWILIO_API_SECRET, VITE_TWILIO_PHONE_NUMBER');
    }

    this.config = {
      accountSid,
      authToken,
      apiKey,
      apiSecret,
      phoneNumber,
    };
  }

  private checkRateLimit(identifier: string, maxRequests: number = 10, windowMs: number = 60000): boolean {
    const now = Date.now();
    const windowStart = now - windowMs;

    if (!this.rateLimitMap.has(identifier)) {
      this.rateLimitMap.set(identifier, []);
    }

    const requests = this.rateLimitMap.get(identifier)!;
    const recentRequests = requests.filter(time => time > windowStart);

    if (recentRequests.length >= maxRequests) {
      return false; // Rate limit exceeded
    }

    recentRequests.push(now);
    this.rateLimitMap.set(identifier, recentRequests);

    return true; // Within rate limit
  }

  async sendEmail(request: EmailRequest): Promise<{ success: boolean; error?: string }> {
    // Rate limiting check
    if (!this.checkRateLimit(`email-${request.to}`, 5, 60000)) { // 5 emails per minute per recipient
      return {
        success: false,
        error: 'Rate limit exceeded. Please wait before sending another email.',
      };
    }

    // Input validation
    if (!request.to || !request.subject || !request.html) {
      return {
        success: false,
        error: 'Missing required fields: to, subject, and html are required',
      };
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(request.to)) {
      return {
        success: false,
        error: 'Invalid email address format',
      };
    }

    // Subject length validation
    if (request.subject.length > 78) {
      return {
        success: false,
        error: 'Email subject too long. Maximum 78 characters allowed.',
      };
    }

    const sendEmailWithRetry = async (attempt: number = 1): Promise<{ success: boolean; error?: string }> => {
      try {
        const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiSecret}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            personalizations: [{
              to: [{ email: request.to }],
              subject: request.subject,
            }],
            from: { email: 'noreply@nimex.ng' },
            content: [
              {
                type: 'text/html',
                value: request.html,
              },
              ...(request.text ? [{
                type: 'text/plain',
                value: request.text,
              }] : []),
            ],
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
          throw new Error(`SendGrid API error: ${errorData.message || response.statusText}`);
        }

        return { success: true };
      } catch (error) {
        console.error(`Email send attempt ${attempt} failed:`, error);

        // Retry up to 3 times with exponential backoff
        if (attempt < 3) {
          const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
          await new Promise(resolve => setTimeout(resolve, delay));
          return sendEmailWithRetry(attempt + 1);
        }

        // Log failure for monitoring (without sensitive data)
        console.error('Email delivery failed after retries:', {
          to: request.to,
          subject: request.subject,
          timestamp: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Unknown error'
        });

        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to send email',
        };
      }
    };

    return sendEmailWithRetry();
  }

  async sendSMS(request: SMSRequest): Promise<{ success: boolean; error?: string }> {
    // Rate limiting check
    if (!this.checkRateLimit(`sms-${request.to}`, 3, 60000)) { // 3 SMS per minute per recipient
      return {
        success: false,
        error: 'Rate limit exceeded. Please wait before sending another SMS.',
      };
    }

    // Input validation
    if (!request.to || !request.message) {
      return {
        success: false,
        error: 'Missing required fields: to and message are required',
      };
    }

    // Basic phone number validation (E.164 format)
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(request.to)) {
      return {
        success: false,
        error: 'Invalid phone number format. Must be in E.164 format (e.g., +1234567890)',
      };
    }

    // Message length validation
    if (request.message.length > 1600) {
      return {
        success: false,
        error: 'Message too long. Maximum 1600 characters allowed',
      };
    }

    // Message content validation
    if (request.message.trim().length === 0) {
      return {
        success: false,
        error: 'Message cannot be empty',
      };
    }

    const sendSMSWithRetry = async (attempt: number = 1): Promise<{ success: boolean; error?: string }> => {
      try {
        const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${this.config.accountSid}/Messages.json`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${btoa(`${this.config.apiKey}:${this.config.apiSecret}`)}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            To: request.to,
            From: this.config.phoneNumber,
            Body: request.message,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
          throw new Error(`Twilio API error: ${errorData.message || response.statusText}`);
        }

        return { success: true };
      } catch (error) {
        console.error(`SMS send attempt ${attempt} failed:`, error);

        // Retry up to 3 times with exponential backoff
        if (attempt < 3) {
          const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
          await new Promise(resolve => setTimeout(resolve, delay));
          return sendSMSWithRetry(attempt + 1);
        }

        // Log failure for monitoring (without sensitive data)
        console.error('SMS delivery failed after retries:', {
          to: request.to,
          timestamp: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Unknown error'
        });

        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to send SMS',
        };
      }
    };

    return sendSMSWithRetry();
  }

  async sendOrderConfirmationEmail(email: string, orderDetails: {
    orderNumber: string;
    totalAmount: number;
    items: Array<{ title: string; quantity: number; price: number }>;
  }): Promise<{ success: boolean; error?: string }> {
    // Sanitize inputs to prevent XSS
    const sanitizeHtml = (str: string) => str.replace(/[&<>"']/g, (match) => ({
      '&': '&',
      '<': '<',
      '>': '>',
      '"': '"',
      "'": '&#x27;'
    }[match] || match));

    const sanitizedOrderNumber = sanitizeHtml(orderDetails.orderNumber);
    const sanitizedItems = orderDetails.items.map(item => ({
      title: sanitizeHtml(item.title),
      quantity: item.quantity,
      price: item.price
    }));

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #15803d;">Order Confirmation - NIMEX</h2>
        <p>Thank you for your order! Here are the details:</p>

        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Order #${sanitizedOrderNumber}</h3>
          <p><strong>Total: ₦${orderDetails.totalAmount.toLocaleString()}</strong></p>
        </div>

        <h4>Items Ordered:</h4>
        <ul>
          ${sanitizedItems.map(item => `
            <li>${item.title} (x${item.quantity}) - ₦${(item.price * item.quantity).toLocaleString()}</li>
          `).join('')}
        </ul>

        <p>You can track your order status in your dashboard.</p>
        <p>Thank you for shopping with NIMEX!</p>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject: `Order Confirmation - ${sanitizedOrderNumber}`,
      html,
    });
  }

  async sendVendorNotificationSMS(phone: string, message: string): Promise<{ success: boolean; error?: string }> {
    return this.sendSMS({
      to: phone,
      message: `NIMEX: ${message}`,
    });
  }

  async sendKYCApprovalEmail(email: string, vendorName: string): Promise<{ success: boolean; error?: string }> {
    // Sanitize inputs to prevent XSS
    const sanitizeHtml = (str: string) => str.replace(/[&<>"']/g, (match) => ({
      '&': '&',
      '<': '<',
      '>': '>',
      '"': '"',
      "'": '&#x27;'
    }[match] || match));

    const sanitizedVendorName = sanitizeHtml(vendorName);

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #15803d;">KYC Approved - NIMEX</h2>
        <p>Dear ${sanitizedVendorName},</p>
        <p>Congratulations! Your KYC verification has been approved.</p>
        <p>You can now:</p>
        <ul>
          <li>Create and manage your product listings</li>
          <li>Receive payments through our escrow system</li>
          <li>Access vendor analytics and reports</li>
        </ul>
        <p>Welcome to the NIMEX marketplace!</p>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject: 'KYC Verification Approved',
      html,
    });
  }
}

export const twilioService = new TwilioService();

export type { EmailRequest, SMSRequest };