/**
 * Notification Service
 * Handles in-app notifications for orders, payments, and system events
 */

import { FirestoreService } from './firestore.service';
import { COLLECTIONS } from '../lib/collections';
import { Timestamp } from 'firebase/firestore';

export type NotificationType =
    | 'order_placed'
    | 'order_confirmed'
    | 'order_shipped'
    | 'order_delivered'
    | 'order_cancelled'
    | 'payment_received'
    | 'escrow_released'
    | 'review_received'
    | 'new_message'
    | 'system';

interface CreateNotificationParams {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    data?: Record<string, any>;
}

class NotificationService {
    /**
     * Create a notification for a user
     */
    async createNotification(params: CreateNotificationParams): Promise<{ success: boolean; id?: string; error?: string }> {
        try {
            const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            await FirestoreService.setDocument(COLLECTIONS.NOTIFICATIONS, notificationId, {
                id: notificationId,
                user_id: params.userId,
                type: params.type,
                title: params.title,
                message: params.message,
                data: params.data || {},
                is_read: false,
                created_at: Timestamp.now(),
            });

            return { success: true, id: notificationId };
        } catch (error) {
            console.error('Error creating notification:', error);
            return { success: false, error: error instanceof Error ? error.message : 'Failed to create notification' };
        }
    }

    /**
     * Notify buyer about order status change
     */
    async notifyOrderStatusChange(
        buyerId: string,
        orderId: string,
        orderNumber: string,
        status: string,
        vendorName?: string
    ): Promise<void> {
        const statusMessages: Record<string, { title: string; message: string; type: NotificationType }> = {
            confirmed: {
                type: 'order_confirmed',
                title: 'Order Confirmed! 🎉',
                message: `Your order #${orderNumber} has been confirmed${vendorName ? ` by ${vendorName}` : ''}. It will be processed soon.`,
            },
            processing: {
                type: 'order_confirmed',
                title: 'Order Being Prepared 📦',
                message: `Your order #${orderNumber} is being prepared for shipment.`,
            },
            shipped: {
                type: 'order_shipped',
                title: 'Order Shipped! 🚚',
                message: `Great news! Your order #${orderNumber} has been shipped and is on its way.`,
            },
            delivered: {
                type: 'order_delivered',
                title: 'Order Delivered! ✅',
                message: `Your order #${orderNumber} has been delivered. Please confirm receipt.`,
            },
            cancelled: {
                type: 'order_cancelled',
                title: 'Order Cancelled',
                message: `Your order #${orderNumber} has been cancelled. Any payment will be refunded.`,
            },
        };

        const notification = statusMessages[status];
        if (notification) {
            await this.createNotification({
                userId: buyerId,
                type: notification.type,
                title: notification.title,
                message: notification.message,
                data: { orderId, orderNumber, status },
            });
        }
    }

    /**
     * Notify vendor about new order
     */
    async notifyVendorNewOrder(
        vendorId: string,
        orderId: string,
        orderNumber: string,
        totalAmount: number
    ): Promise<void> {
        await this.createNotification({
            userId: vendorId,
            type: 'order_placed',
            title: 'New Order Received! 🛒',
            message: `You have a new order #${orderNumber} worth ₦${totalAmount.toLocaleString()}. Please process it soon.`,
            data: { orderId, orderNumber, totalAmount },
        });
    }

    /**
     * Notify vendor about payment received
     */
    async notifyPaymentReceived(
        vendorId: string,
        orderId: string,
        orderNumber: string,
        amount: number
    ): Promise<void> {
        await this.createNotification({
            userId: vendorId,
            type: 'payment_received',
            title: 'Payment Received! 💰',
            message: `Payment of ₦${amount.toLocaleString()} received for order #${orderNumber}.`,
            data: { orderId, orderNumber, amount },
        });
    }

    /**
     * Notify vendor about new review
     */
    async notifyNewReview(
        vendorId: string,
        productId: string,
        productName: string,
        rating: number,
        reviewerName: string
    ): Promise<void> {
        const stars = '⭐'.repeat(Math.round(rating));
        await this.createNotification({
            userId: vendorId,
            type: 'review_received',
            title: 'New Review! ' + stars,
            message: `${reviewerName} left a ${rating}-star review on "${productName}".`,
            data: { productId, productName, rating },
        });
    }
}

export const notificationService = new NotificationService();
