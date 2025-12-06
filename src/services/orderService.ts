import { FirestoreService } from './firestore.service';
import { COLLECTIONS } from '../lib/collections';
import { logger } from '../lib/logger';
import { Timestamp } from 'firebase/firestore';
import type { Order, OrderItem, Vendor } from '../types/firestore';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5001/anima-project/us-central1'; // Default to local emulator for dev, or cloud url


interface CreateOrderRequest {
  buyerId: string;
  vendorId: string;
  items: Array<{
    productId: string;
    productTitle: string;
    productImage: string;
    quantity: number;
    unitPrice: number;
  }>;
  deliveryAddressId: string;
  deliveryType: 'standard' | 'express' | 'same_day';
  deliveryCost: number;
  notes?: string;
}

interface OrderResponse {
  success: boolean;
  data?: {
    orderId: string;
    orderNumber: string;
  };
  error?: string;
}

interface ConfirmDeliveryRequest {
  orderId: string;
  buyerId: string;
}

interface ReleaseEscrowRequest {
  orderId: string;
  releaseType: 'auto_delivery' | 'manual_buyer' | 'admin_override' | 'dispute_resolution';
  releaseBy: string;
  notes?: string;
}

class OrderService {
  async createOrder(request: CreateOrderRequest): Promise<OrderResponse> {
    try {
      const subtotal = request.items.reduce(
        (sum, item) => sum + item.unitPrice * item.quantity,
        0
      );
      const totalAmount = subtotal + request.deliveryCost;
      const orderNumber = `NIMEX-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

      // Generate IDs
      const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Use transaction to create order and items
      await FirestoreService.runTransaction(async (transaction) => {
        // Create order
        await FirestoreService.setDocument(COLLECTIONS.ORDERS, orderId, {
          order_number: orderNumber,
          buyer_id: request.buyerId,
          vendor_id: request.vendorId,
          delivery_address_id: request.deliveryAddressId, // Note: This field needs to be in Order type if we use it
          status: 'pending',
          subtotal,
          shipping_fee: request.deliveryCost,
          total_amount: totalAmount,
          payment_status: 'pending',
          notes: request.notes || null,
          created_at: Timestamp.now(),
          updated_at: Timestamp.now(),
        });

        // Create order items
        for (const item of request.items) {
          const itemId = `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          await FirestoreService.setDocument(COLLECTIONS.ORDER_ITEMS, itemId, {
            order_id: orderId,
            product_id: item.productId,
            product_title: item.productTitle,
            product_image: item.productImage,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            total_price: item.unitPrice * item.quantity,
            created_at: Timestamp.now(),
            updated_at: Timestamp.now(),
          });
        }
      });

      return {
        success: true,
        data: {
          orderId,
          orderNumber,
        },
      };
    } catch (error) {
      logger.error('Failed to create order', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create order',
      };
    }
  }

  async updateOrderPaymentStatus(
    orderId: string,
    paymentStatus: 'paid' | 'refunded',
    paymentReference: string,
    paymentMethod: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await FirestoreService.updateDocument(COLLECTIONS.ORDERS, orderId, {
        payment_status: paymentStatus,
        payment_reference: paymentReference,
        payment_method: paymentMethod,
        status: paymentStatus === 'paid' ? 'confirmed' : 'cancelled',
      });

      return { success: true };
    } catch (error) {
      logger.error('Failed to update payment status', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update payment status',
      };
    }
  }

  async confirmDelivery(request: ConfirmDeliveryRequest): Promise<{ success: boolean; error?: string }> {
    try {
      // Find delivery record
      const deliveries = await FirestoreService.getDocuments(COLLECTIONS.DELIVERIES, {
        filters: [
          { field: 'order_id', operator: '==', value: request.orderId },
          { field: 'buyer_id', operator: '==', value: request.buyerId }
        ],
        limitCount: 1
      });

      if (deliveries.length === 0) {
        throw new Error('Delivery record not found');
      }

      const delivery = deliveries[0];

      await FirestoreService.runTransaction(async (transaction) => {
        // Update delivery status
        await FirestoreService.updateDocument(COLLECTIONS.DELIVERIES, delivery.id, {
          delivery_status: 'delivered',
          actual_delivery_date: Timestamp.now(),
        });

        // Create escrow release record
        const releaseId = `release_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await FirestoreService.setDocument('escrow_releases', releaseId, {
          escrow_transaction_id: delivery.id, // Assuming delivery ID is linked to escrow? Or should check escrow_transactions table logic
          release_type: 'manual_buyer',
          buyer_confirmed_delivery: true,
          delivery_confirmed_at: Timestamp.now(),
          release_requested_by: request.buyerId,
        });
      });

      return { success: true };
    } catch (error) {
      logger.error('Failed to confirm delivery', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to confirm delivery',
      };
    }
  }

  async releaseEscrow(request: ReleaseEscrowRequest): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${API_URL}/releaseEscrow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: request.orderId,
          releaseType: request.releaseType,
          notes: request.notes,
          performedByUserId: request.releaseBy,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to release escrow');
      }

      return { success: true };
    } catch (error) {
      logger.error('Failed to release escrow', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to release escrow',
      };
    }
  }

  async refundEscrow(orderId: string, reason: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${API_URL}/refundEscrow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          reason,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to refund escrow');
      }

      return { success: true };
    } catch (error) {
      logger.error('Failed to refund escrow', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to refund escrow',
      };
    }
  }

  async createDispute(
    orderId: string,
    filedBy: string,
    filedByType: 'buyer' | 'vendor',
    disputeType: string,
    description: string,
    evidenceUrls: string[]
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const order = await FirestoreService.getDocument(COLLECTIONS.ORDERS, orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      const escrowTransactions = await FirestoreService.getDocuments(COLLECTIONS.ESCROW_TRANSACTIONS, {
        filters: [{ field: 'order_id', operator: '==', value: orderId }],
        limitCount: 1
      });
      const escrowTransaction = escrowTransactions.length > 0 ? escrowTransactions[0] : null;

      await FirestoreService.runTransaction(async (transaction) => {
        // Create dispute
        const disputeId = `dispute_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await FirestoreService.setDocument(COLLECTIONS.DISPUTES, disputeId, {
          order_id: orderId,
          escrow_transaction_id: escrowTransaction?.id,
          filed_by: filedBy,
          filed_by_type: filedByType,
          dispute_type: disputeType,
          description,
          evidence_urls: evidenceUrls,
          status: 'open',
          created_at: Timestamp.now(),
        });

        // Update escrow status
        if (escrowTransaction) {
          await FirestoreService.updateDocument(COLLECTIONS.ESCROW_TRANSACTIONS, escrowTransaction.id, {
            status: 'disputed'
          });
        }

        // Update order status
        await FirestoreService.updateDocument(COLLECTIONS.ORDERS, orderId, {
          status: 'disputed'
        });
      });

      return { success: true };
    } catch (error) {
      logger.error('Failed to create dispute', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create dispute',
      };
    }
  }
}

export const orderService = new OrderService();

export type {
  CreateOrderRequest,
  OrderResponse,
  ConfirmDeliveryRequest,
  ReleaseEscrowRequest,
};
