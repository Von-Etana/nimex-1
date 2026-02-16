/**
 * Email Notification Service
 * Handles transactional emails for orders, referrals, and account notifications
 */

import { logger } from '../lib/logger';

// Email templates
const EMAIL_TEMPLATES = {
    orderConfirmation: (data: OrderConfirmationData) => ({
        subject: `Order Confirmed - #${data.orderNumber}`,
        html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Confirmation</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #006400 0%, #008000 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">NIMEX</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0;">Order Confirmation</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 30px;">
              <h2 style="color: #1e293b; margin: 0 0 20px;">Thank you for your order!</h2>
              
              <div style="background: #f1f5f9; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <p style="margin: 0 0 10px; color: #64748b; font-size: 14px;">Order Number</p>
                <p style="margin: 0; color: #1e293b; font-size: 20px; font-weight: bold;">#${data.orderNumber}</p>
              </div>
              
              <h3 style="color: #1e293b; margin: 0 0 15px;">Order Summary</h3>
              <table style="width: 100%; border-collapse: collapse;">
                ${data.items.map(item => `
                  <tr style="border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 12px 0; color: #475569;">${item.title}</td>
                    <td style="padding: 12px 0; color: #64748b; text-align: center;">x${item.quantity}</td>
                    <td style="padding: 12px 0; color: #1e293b; text-align: right; font-weight: 600;">₦${(item.price * item.quantity).toLocaleString()}</td>
                  </tr>
                `).join('')}
                <tr>
                  <td colspan="2" style="padding: 15px 0; color: #1e293b; font-weight: bold;">Total</td>
                  <td style="padding: 15px 0; color: #006400; text-align: right; font-size: 20px; font-weight: bold;">₦${data.totalAmount.toLocaleString()}</td>
                </tr>
              </table>
              
              <div style="margin-top: 30px; padding: 20px; background: #f0fdf4; border-radius: 8px; border-left: 4px solid #006400;">
                <p style="margin: 0; color: #166534;">Your order is being processed. You'll receive updates as it progresses.</p>
              </div>
              
              <div style="margin-top: 30px; text-align: center;">
                <a href="${data.trackingUrl}" style="display: inline-block; background: #006400; color: white; padding: 14px 30px; border-radius: 8px; text-decoration: none; font-weight: 600;">Track Your Order</a>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="background: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; color: #64748b; font-size: 14px;">Questions? Contact us at support@nimex.ng</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
    }),

    orderStatusUpdate: (data: OrderStatusData) => ({
        subject: `Order Update - #${data.orderNumber} is ${data.status}`,
        html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Order Update</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="background: linear-gradient(135deg, #006400 0%, #008000 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">NIMEX</h1>
            </div>
            
            <div style="padding: 30px; text-align: center;">
              <div style="width: 60px; height: 60px; margin: 0 auto 20px; background: ${getStatusColor(data.status)}; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 28px;">${getStatusEmoji(data.status)}</span>
              </div>
              
              <h2 style="color: #1e293b; margin: 0 0 10px;">Order ${data.status.charAt(0).toUpperCase() + data.status.slice(1)}</h2>
              <p style="color: #64748b; margin: 0 0 20px;">Order #${data.orderNumber}</p>
              
              <p style="color: #475569; margin: 0 0 30px;">${getStatusMessage(data.status)}</p>
              
              <a href="${data.trackingUrl}" style="display: inline-block; background: #006400; color: white; padding: 14px 30px; border-radius: 8px; text-decoration: none; font-weight: 600;">View Order Details</a>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
    }),

    referralNotification: (data: ReferralNotificationData) => ({
        subject: `New Referral! ${data.vendorName} signed up using your link`,
        html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>New Referral</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="background: linear-gradient(135deg, #006400 0%, #008000 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">🎉 New Referral!</h1>
            </div>
            
            <div style="padding: 30px;">
              <h2 style="color: #1e293b; margin: 0 0 20px;">Great news, ${data.marketerName}!</h2>
              
              <p style="color: #475569; margin: 0 0 20px;">
                A new vendor has signed up using your referral link!
              </p>
              
              <div style="background: #f1f5f9; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <p style="margin: 0 0 5px; color: #64748b; font-size: 14px;">Vendor</p>
                <p style="margin: 0; color: #1e293b; font-size: 18px; font-weight: bold;">${data.vendorName}</p>
              </div>
              
              <div style="background: #f0fdf4; border-radius: 8px; padding: 20px; text-align: center;">
                <p style="margin: 0 0 5px; color: #166534; font-size: 14px;">Commission Earned</p>
                <p style="margin: 0; color: #006400; font-size: 28px; font-weight: bold;">₦${data.commissionAmount.toLocaleString()}</p>
              </div>
              
              <div style="margin-top: 30px; text-align: center;">
                <a href="${data.dashboardUrl}" style="display: inline-block; background: #006400; color: white; padding: 14px 30px; border-radius: 8px; text-decoration: none; font-weight: 600;">View Dashboard</a>
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
    }),

    welcomeEmail: (data: WelcomeEmailData) => ({
        subject: `Welcome to NIMEX! Let's get started`,
        html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome to NIMEX</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="background: linear-gradient(135deg, #006400 0%, #008000 100%); padding: 40px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 32px;">Welcome to NIMEX!</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 15px 0 0; font-size: 18px;">Nigeria's Trusted Marketplace</p>
            </div>
            
            <div style="padding: 30px;">
              <h2 style="color: #1e293b; margin: 0 0 20px;">Hi ${data.fullName}! 👋</h2>
              
              <p style="color: #475569; margin: 0 0 20px; line-height: 1.6;">
                Thanks for joining NIMEX! We're excited to have you as part of our growing community of buyers and sellers.
              </p>
              
              <h3 style="color: #1e293b; margin: 20px 0 15px;">What you can do on NIMEX:</h3>
              
              <div style="margin-bottom: 15px; padding: 15px; background: #f8fafc; border-radius: 8px; display: flex; align-items: center;">
                <span style="font-size: 24px; margin-right: 15px;">🛍️</span>
                <div>
                  <strong style="color: #1e293b;">Shop from Verified Vendors</strong>
                  <p style="margin: 5px 0 0; color: #64748b; font-size: 14px;">Browse thousands of products with secure payments</p>
                </div>
              </div>
              
              <div style="margin-bottom: 15px; padding: 15px; background: #f8fafc; border-radius: 8px; display: flex; align-items: center;">
                <span style="font-size: 24px; margin-right: 15px;">💬</span>
                <div>
                  <strong style="color: #1e293b;">Chat with Sellers</strong>
                  <p style="margin: 5px 0 0; color: #64748b; font-size: 14px;">Message vendors directly about products</p>
                </div>
              </div>
              
              <div style="margin-bottom: 15px; padding: 15px; background: #f8fafc; border-radius: 8px; display: flex; align-items: center;">
                <span style="font-size: 24px; margin-right: 15px;">🔒</span>
                <div>
                  <strong style="color: #1e293b;">Secure Escrow Payments</strong>
                  <p style="margin: 5px 0 0; color: #64748b; font-size: 14px;">Your money is protected until you receive your order</p>
                </div>
              </div>
              
              <div style="margin-top: 30px; text-align: center;">
                <a href="${data.loginUrl}" style="display: inline-block; background: #006400; color: white; padding: 16px 40px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">Start Shopping</a>
              </div>
            </div>
            
            <div style="background: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; color: #64748b; font-size: 14px;">Need help? Reply to this email or contact support@nimex.ng</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
    })
};

// Helper functions
function getStatusColor(status: string): string {
    const colors: Record<string, string> = {
        pending: '#fef3c7',
        confirmed: '#dbeafe',
        processing: '#e0e7ff',
        shipped: '#cffafe',
        delivered: '#dcfce7',
        cancelled: '#fee2e2'
    };
    return colors[status] || '#f1f5f9';
}

function getStatusEmoji(status: string): string {
    const emojis: Record<string, string> = {
        pending: '⏳',
        confirmed: '✅',
        processing: '📦',
        shipped: '🚚',
        delivered: '🎉',
        cancelled: '❌'
    };
    return emojis[status] || '📋';
}

function getStatusMessage(status: string): string {
    const messages: Record<string, string> = {
        pending: 'Your order is awaiting confirmation from the vendor.',
        confirmed: 'Great news! The vendor has confirmed your order.',
        processing: 'Your order is being prepared for shipment.',
        shipped: 'Your order is on its way! Track the delivery for updates.',
        delivered: 'Your order has been delivered. Enjoy your purchase!',
        cancelled: 'Your order has been cancelled. Contact support for assistance.'
    };
    return messages[status] || 'Your order status has been updated.';
}

// Type definitions
interface OrderConfirmationData {
    orderNumber: string;
    totalAmount: number;
    items: Array<{ title: string; quantity: number; price: number }>;
    trackingUrl: string;
}

interface OrderStatusData {
    orderNumber: string;
    status: string;
    trackingUrl: string;
}

interface ReferralNotificationData {
    marketerName: string;
    vendorName: string;
    commissionAmount: number;
    dashboardUrl: string;
}

interface WelcomeEmailData {
    fullName: string;
    loginUrl: string;
}

// Email Notification Service
class EmailNotificationService {
    private baseUrl: string;

    constructor() {
        this.baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://nimex.ng';
    }

    async sendOrderConfirmation(
        email: string,
        orderNumber: string,
        totalAmount: number,
        items: Array<{ title: string; quantity: number; price: number }>
    ): Promise<boolean> {
        try {
            const template = EMAIL_TEMPLATES.orderConfirmation({
                orderNumber,
                totalAmount,
                items,
                trackingUrl: `${this.baseUrl}/orders/${orderNumber}`
            });

            return await this.sendEmail(email, template.subject, template.html);
        } catch (error) {
            logger.error('Failed to send order confirmation email:', error);
            return false;
        }
    }

    async sendOrderStatusUpdate(
        email: string,
        orderNumber: string,
        status: string
    ): Promise<boolean> {
        try {
            const template = EMAIL_TEMPLATES.orderStatusUpdate({
                orderNumber,
                status,
                trackingUrl: `${this.baseUrl}/orders/${orderNumber}`
            });

            return await this.sendEmail(email, template.subject, template.html);
        } catch (error) {
            logger.error('Failed to send order status email:', error);
            return false;
        }
    }

    async sendReferralNotification(
        email: string,
        marketerName: string,
        vendorName: string,
        commissionAmount: number
    ): Promise<boolean> {
        try {
            const template = EMAIL_TEMPLATES.referralNotification({
                marketerName,
                vendorName,
                commissionAmount,
                dashboardUrl: `${this.baseUrl}/marketer/dashboard`
            });

            return await this.sendEmail(email, template.subject, template.html);
        } catch (error) {
            logger.error('Failed to send referral notification email:', error);
            return false;
        }
    }

    async sendWelcomeEmail(email: string, fullName: string): Promise<boolean> {
        try {
            const template = EMAIL_TEMPLATES.welcomeEmail({
                fullName,
                loginUrl: `${this.baseUrl}/login`
            });

            return await this.sendEmail(email, template.subject, template.html);
        } catch (error) {
            logger.error('Failed to send welcome email:', error);
            return false;
        }
    }

    private async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
        try {
            // Use SendGrid API via environment variables
            const apiKey = import.meta.env.VITE_SENDGRID_API_KEY;

            if (!apiKey) {
                logger.warn('SendGrid API key not configured, email not sent');
                return false;
            }

            const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    personalizations: [{ to: [{ email: to }] }],
                    from: { email: 'noreply@nimex.ng', name: 'NIMEX' },
                    subject,
                    content: [{ type: 'text/html', value: html }]
                })
            });

            if (!response.ok) {
                const error = await response.text();
                logger.error('SendGrid API error:', error);
                return false;
            }

            logger.info('Email sent successfully to:', to);
            return true;
        } catch (error) {
            logger.error('Email send error:', error);
            return false;
        }
    }
}

export const emailNotificationService = new EmailNotificationService();
export default emailNotificationService;
