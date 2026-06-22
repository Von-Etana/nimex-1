import { FirestoreService } from './firestore.service';
import { COLLECTIONS } from '../lib/collections';
import { logger } from '../lib/logger';
import { Timestamp } from 'firebase/firestore';
import type { Order, OrderItem, Vendor } from '../types/firestore';
import { notificationService } from './notificationService';
import { auth, db } from '../lib/firebase.config';
import { doc } from 'firebase/firestore';

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
      const orderNumber = `NIMEX-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;
      const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      let totalAmount = 0;

      logger.info('Starting transaction for order creation', { itemCount: request.items.length });

      await FirestoreService.runTransaction(async (transaction) => {
        let calculatedSubtotal = 0;
        const productDocs = [];

        // 1. Read all products first (transactions require all reads before writes)
        for (const item of request.items) {
          const productRef = doc(db, COLLECTIONS.PRODUCTS, item.productId);
          const productSnap = await transaction.get(productRef);
          if (!productSnap.exists()) {
            throw new Error(`Product not found: ${item.productTitle}`);
          }
          productDocs.push({ item, ref: productRef, data: productSnap.data() });
        }

        // 2. Validate prices and compute subtotal (HIGH-10)
        for (const p of productDocs) {
          const { item, data } = p;
          
          // Use the price from the database instead of trusting the client
          const dbPrice = data.price || item.unitPrice;
          if (item.unitPrice !== dbPrice) {
            console.warn(`[OrderService] Price mismatch for ${item.productTitle}. Client: ${item.unitPrice}, DB: ${dbPrice}. Using DB price.`);
            item.unitPrice = dbPrice;
          }
          
          // Verify stock before proceeding
          if ((data.stock_quantity || 0) < item.quantity) {
             throw new Error(`Insufficient stock for ${item.productTitle}. Available: ${data.stock_quantity || 0}, Requested: ${item.quantity}`);
          }

          calculatedSubtotal += dbPrice * item.quantity;
        }

        const calculatedTotal = calculatedSubtotal + request.deliveryCost;
        totalAmount = calculatedTotal;

        // 3. Write Order Document
        const orderRef = doc(db, COLLECTIONS.ORDERS, orderId);
        transaction.set(orderRef, {
          order_number: orderNumber,
          buyer_id: request.buyerId,
          vendor_id: request.vendorId,
          delivery_address_id: request.deliveryAddressId,
          status: 'pending',
          subtotal: calculatedSubtotal,
          shipping_fee: request.deliveryCost,
          total_amount: calculatedTotal,
          payment_status: 'pending',
          notes: request.notes || null,
          created_at: Timestamp.now(),
          updated_at: Timestamp.now(),
        });

        // 4. Write Order Items and Decrement Stock atomically (HIGH-05)
        for (const p of productDocs) {
          const { item, ref, data } = p;
          const itemId = `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const itemRef = doc(db, COLLECTIONS.ORDER_ITEMS, itemId);
          
          transaction.set(itemRef, {
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

          // Atomic Stock Decrement
          const newStock = Math.max(0, (data.stock_quantity || 0) - item.quantity);
          transaction.update(ref, {
            stock_quantity: newStock,
            updated_at: Timestamp.now(),
          });
        }
      });

      console.log('[OrderService] Order transaction completed successfully:', orderId);

      // Notify vendor about new order (non-blocking)
      try {
        await notificationService.notifyVendorNewOrder(
          request.vendorId,
          orderId,
          orderNumber,
          totalAmount
        );
      } catch (notifyError) {
        logger.warn('Failed to notify vendor about new order, but order was created successfully', notifyError);
      }

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
      // Get order to fetch buyer_id and details for escrow
      const order = await FirestoreService.getDocument<any>(COLLECTIONS.ORDERS, orderId);

      if (!order) {
        throw new Error('Order not found');
      }

      // Prevent duplicate escrow creation or processing if already paid
      if (order.payment_status === 'paid' && paymentStatus === 'paid') {
        logger.info('Order is already marked as paid. Skipping escrow creation.', { orderId });
        return { success: true };
      }

      await FirestoreService.runTransaction(async (transaction) => {
        // Update order status
        const orderRef = doc(db, COLLECTIONS.ORDERS, orderId);
        transaction.update(orderRef, {
          payment_status: paymentStatus,
          payment_reference: paymentReference,
          payment_method: paymentMethod,
          status: paymentStatus === 'paid' ? 'confirmed' : 'cancelled',
          updated_at: Timestamp.now(),
        });

        // Create Escrow Transaction if paid
        if (paymentStatus === 'paid') {
          const escrowId = `escrow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const platformFeeRecord = await FirestoreService.getDocuments(COLLECTIONS.COMMISSION_SETTINGS, {
            filters: [{ field: 'type', operator: '==', value: 'default_platform_fee' }],
            limitCount: 1
          });

          let platformFeePercentage = 0.05; // Default 5%
          if (platformFeeRecord.length > 0) {
            platformFeePercentage = (platformFeeRecord[0] as any).commission_amount / 100;
          }

          const platformFee = Math.round(order.total_amount * platformFeePercentage);
          const vendorAmount = order.total_amount - platformFee;

          const escrowRef = doc(db, COLLECTIONS.ESCROW_TRANSACTIONS, escrowId);
          transaction.set(escrowRef, {
            order_id: orderId,
            buyer_id: order.buyer_id,
            vendor_id: order.vendor_id,
            amount: order.total_amount,
            platform_fee: platformFee,
            vendor_amount: vendorAmount,
            status: 'held',
            held_at: Timestamp.now(),
            created_at: Timestamp.now(),
            updated_at: Timestamp.now(),
          });
        }
      });

      // Notify buyer about order confirmation
      if (paymentStatus === 'paid') {
        await notificationService.notifyOrderStatusChange(
          order.buyer_id,
          orderId,
          order.order_number,
          'confirmed'
        );
      }

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
      // Delegate to releaseEscrow secure cloud function which performs all updates atomically
      return await this.releaseEscrow({
        orderId: request.orderId,
        releaseType: 'manual_buyer',
        releaseBy: request.buyerId,
        notes: 'Delivery confirmed by buyer'
      });
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
      // CRIT-04 FIX: Obtain current user's ID token and send it in the Authorization header.
      // The backend must verify this token — never trust client-supplied user identity.
      const currentUser = auth.currentUser;
      if (!currentUser) {
        return { success: false, error: 'User not authenticated' };
      }
      const idToken = await currentUser.getIdToken();

      const response = await fetch(`${API_URL}/releaseEscrow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          orderId: request.orderId,
          releaseType: request.releaseType,
          notes: request.notes,
          // performedByUserId removed — backend derives identity from the verified token
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
      // CRIT-04 FIX: Obtain current user's ID token
      const currentUser = auth.currentUser;
      if (!currentUser) {
        return { success: false, error: 'User not authenticated' };
      }
      const idToken = await currentUser.getIdToken();

      const response = await fetch(`${API_URL}/refundEscrow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
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
        const disputeRef = doc(db, COLLECTIONS.DISPUTES, disputeId);
        transaction.set(disputeRef, {
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
          const escrowRef = doc(db, COLLECTIONS.ESCROW_TRANSACTIONS, escrowTransaction.id);
          transaction.update(escrowRef, {
            status: 'disputed'
          });
        }

        // Update order status
        const orderRef = doc(db, COLLECTIONS.ORDERS, orderId);
        transaction.update(orderRef, {
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
