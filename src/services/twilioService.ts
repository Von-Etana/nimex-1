import { functions } from '../lib/firebase';
import { httpsCallable } from 'firebase/functions';
import { emailNotificationService } from './emailNotificationService';

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
  async sendEmail(request: EmailRequest): Promise<{ success: boolean; error?: string }> {
    try {
      const sendEmailFn = httpsCallable(functions, 'sendEmail');
      const response = await sendEmailFn(request);
      const result = response.data as { success: boolean };
      
      if (result.success) {
        return { success: true };
      }
      return { success: false, error: 'Failed to send email' };
    } catch (error: any) {
      console.error('Email send failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to send email',
      };
    }
  }

  async sendSMS(request: SMSRequest): Promise<{ success: boolean; error?: string }> {
    try {
      const sendSmsFn = httpsCallable(functions, 'sendTermiiSms');
      const response = await sendSmsFn(request);
      const result = response.data as { success: boolean };
      
      if (result.success) {
        return { success: true };
      }
      return { success: false, error: 'Failed to send SMS' };
    } catch (error: any) {
      console.error('SMS send failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to send SMS',
      };
    }
  }

  async sendOrderConfirmationEmail(email: string, orderDetails: {
    orderNumber: string;
    totalAmount: number;
    items: Array<{ title: string; quantity: number; price: number }>;
  }): Promise<{ success: boolean; error?: string }> {
    const success = await emailNotificationService.sendOrderConfirmation(email, orderDetails.orderNumber, orderDetails.totalAmount, orderDetails.items);
    return { success, error: success ? undefined : 'Failed to send order confirmation email' };
  }

  async sendVendorNotificationSMS(phone: string, message: string): Promise<{ success: boolean; error?: string }> {
    return this.sendSMS({
      to: phone,
      message: `NIMEX: ${message}`,
    });
  }

  async sendKYCApprovalEmail(email: string, vendorName: string): Promise<{ success: boolean; error?: string }> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #15803d;">KYC Approved - NIMEX</h2>
        <p>Dear ${vendorName.replace(/[&<>"']/g, match => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;' })[match] || match)},</p>
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