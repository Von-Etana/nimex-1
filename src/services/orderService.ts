import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';

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

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          buyer_id: request.buyerId,
          vendor_id: request.vendorId,
          delivery_address_id: request.deliveryAddressId,
          status: 'pending',
          subtotal,
          shipping_fee: request.deliveryCost,
          total_amount: totalAmount,
          payment_status: 'pending',
          notes: request.notes,
        })
        .select()
        .single();

      if (orderError || !order) {
        throw new Error(orderError?.message || 'Failed to create order');
      }

      const orderItems = request.items.map((item) => ({
        order_id: order.id,
        product_id: item.productId,
        product_title: item.productTitle,
        product_image: item.productImage,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total_price: item.unitPrice * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        await supabase.from('orders').delete().eq('id', order.id);
        throw new Error(itemsError.message);
      }

      return {
        success: true,
        data: {
          orderId: order.id,
          orderNumber: order.order_number,
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
      const { error } = await supabase
        .from('orders')
        .update({
          payment_status: paymentStatus,
          payment_reference: paymentReference,
          payment_method: paymentMethod,
          status: paymentStatus === 'paid' ? 'confirmed' : 'cancelled',
        })
        .eq('id', orderId);

      if (error) {
        throw new Error(error.message);
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
      const { data: delivery, error: deliveryError } = await supabase
        .from('deliveries')
        .update({
          delivery_status: 'delivered',
          actual_delivery_date: new Date().toISOString(),
        })
        .eq('order_id', request.orderId)
        .eq('buyer_id', request.buyerId)
        .select()
        .single();

      if (deliveryError) {
        throw new Error(deliveryError.message);
      }

      const { error: releaseError } = await supabase
        .from('escrow_releases')
        .insert({
          escrow_transaction_id: delivery.id,
          release_type: 'manual_buyer',
          buyer_confirmed_delivery: true,
          delivery_confirmed_at: new Date().toISOString(),
          release_requested_by: request.buyerId,
        });

      if (releaseError) {
        throw new Error(releaseError.message);
      }

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
      const { data: escrowTransaction, error: escrowError } = await supabase
        .from('escrow_transactions')
        .select('*')
        .eq('order_id', request.orderId)
        .single();

      if (escrowError || !escrowTransaction) {
        throw new Error('Escrow transaction not found');
      }

      if (escrowTransaction.status !== 'held') {
        throw new Error('Escrow already released or refunded');
      }

      const { error: updateError } = await supabase
        .from('escrow_transactions')
        .update({
          status: 'released',
          released_at: new Date().toISOString(),
          release_reason: request.notes || 'Delivery confirmed',
        })
        .eq('id', escrowTransaction.id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      const { data: vendor, error: vendorError } = await supabase
        .from('vendors')
        .select('wallet_balance')
        .eq('id', escrowTransaction.vendor_id)
        .single();

      if (vendorError || !vendor) {
        throw new Error('Vendor not found');
      }

      const newBalance = vendor.wallet_balance + escrowTransaction.vendor_amount;

      const { error: walletError } = await supabase
        .from('vendors')
        .update({ wallet_balance: newBalance })
        .eq('id', escrowTransaction.vendor_id);

      if (walletError) {
        throw new Error(walletError.message);
      }

      const { error: transactionError } = await supabase
        .from('wallet_transactions')
        .insert({
          vendor_id: escrowTransaction.vendor_id,
          type: 'sale',
          amount: escrowTransaction.vendor_amount,
          balance_after: newBalance,
          reference: `ESCROW-${escrowTransaction.id}`,
          description: `Sale payment for order ${request.orderId}`,
          status: 'completed',
        });

      if (transactionError) {
        throw new Error(transactionError.message);
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
      const { data: escrowTransaction, error: escrowError } = await supabase
        .from('escrow_transactions')
        .select('*')
        .eq('order_id', orderId)
        .single();

      if (escrowError || !escrowTransaction) {
        throw new Error('Escrow transaction not found');
      }

      if (escrowTransaction.status !== 'held') {
        throw new Error('Escrow already released or refunded');
      }

      const { error: updateError } = await supabase
        .from('escrow_transactions')
        .update({
          status: 'refunded',
          released_at: new Date().toISOString(),
          release_reason: reason,
        })
        .eq('id', escrowTransaction.id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      const { error: orderError } = await supabase
        .from('orders')
        .update({
          status: 'cancelled',
          payment_status: 'refunded',
        })
        .eq('id', orderId);

      if (orderError) {
        throw new Error(orderError.message);
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
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (orderError || !order) {
        throw new Error('Order not found');
      }

      const { data: escrowTransaction } = await supabase
        .from('escrow_transactions')
        .select('id')
        .eq('order_id', orderId)
        .single();

      const { error: disputeError } = await supabase
        .from('disputes')
        .insert({
          order_id: orderId,
          escrow_transaction_id: escrowTransaction?.id,
          filed_by: filedBy,
          filed_by_type: filedByType,
          dispute_type: disputeType,
          description,
          evidence_urls: evidenceUrls,
          status: 'open',
        });

      if (disputeError) {
        throw new Error(disputeError.message);
      }

      const { error: escrowUpdateError } = await supabase
        .from('escrow_transactions')
        .update({ status: 'disputed' })
        .eq('order_id', orderId);

      if (escrowUpdateError) {
        throw new Error(escrowUpdateError.message);
      }

      const { error: orderUpdateError } = await supabase
        .from('orders')
        .update({ status: 'disputed' })
        .eq('id', orderId);

      if (orderUpdateError) {
        throw new Error(orderUpdateError.message);
      }

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
