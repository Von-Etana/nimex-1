import { describe, it, expect } from 'vitest';

export function calculateOrderTotals(
  items: Array<{ unitPrice: number; quantity: number }>,
  deliveryCost: number
) {
  const subtotal = items.reduce((sum, item) => {
    if (item.unitPrice < 0 || item.quantity < 0) {
      throw new Error('Prices and quantities must be non-negative');
    }
    return sum + item.unitPrice * item.quantity;
  }, 0);

  const escrowFee = 0;
  const totalAmount = subtotal + deliveryCost + escrowFee;

  return {
    subtotal,
    deliveryCost,
    escrowFee,
    totalAmount,
  };
}

export function calculateProductSavings(price: number, originalPrice?: number) {
  if (!originalPrice || originalPrice <= price || originalPrice <= 0) {
    return {
      hasDiscount: false,
      savingsAmount: 0,
      discountPercentage: 0,
    };
  }

  const savingsAmount = originalPrice - price;
  const discountPercentage = Math.round((savingsAmount / originalPrice) * 100);

  return {
    hasDiscount: true,
    savingsAmount,
    discountPercentage,
  };
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'disputed'
  | 'completed'
  | 'refunded'
  | 'cancelled';

export const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'shipped', 'cancelled', 'disputed'],
  processing: ['shipped', 'cancelled', 'disputed'],
  shipped: ['delivered', 'disputed'],
  delivered: ['completed', 'disputed'],
  disputed: ['refunded', 'completed'],
  completed: [],
  refunded: [],
  cancelled: [],
};

export function isValidOrderTransition(current: OrderStatus, next: OrderStatus): boolean {
  return ALLOWED_TRANSITIONS[current]?.includes(next) ?? false;
}

export function resolveDisputeOutcome(
  currentStatus: OrderStatus,
  outcome: 'refund_buyer' | 'release_vendor'
): { nextStatus: OrderStatus; disputeStatus: string; escrowStatus: string } {
  if (currentStatus !== 'disputed') {
    throw new Error('Can only resolve disputes for orders in "disputed" status');
  }

  if (outcome === 'refund_buyer') {
    return {
      nextStatus: 'refunded',
      disputeStatus: 'resolved_refunded',
      escrowStatus: 'refunded',
    };
  }

  return {
    nextStatus: 'completed',
    disputeStatus: 'resolved_released',
    escrowStatus: 'released',
  };
}

describe('Escrow & Checkout Financial Integrity Tests', () => {
  it('calculates order total with zero hidden escrow fees', () => {
    const items = [
      { unitPrice: 5000, quantity: 2 },
      { unitPrice: 2500, quantity: 1 },
    ];
    const deliveryCost = 1500;

    const result = calculateOrderTotals(items, deliveryCost);

    expect(result.subtotal).toBe(12500);
    expect(result.deliveryCost).toBe(1500);
    expect(result.escrowFee).toBe(0);
    expect(result.totalAmount).toBe(14000);
  });

  it('rejects negative prices or quantities', () => {
    expect(() => calculateOrderTotals([{ unitPrice: -100, quantity: 1 }], 500)).toThrow();
    expect(() => calculateOrderTotals([{ unitPrice: 100, quantity: -2 }], 500)).toThrow();
  });

  it('handles empty carts gracefully', () => {
    const result = calculateOrderTotals([], 1000);
    expect(result.subtotal).toBe(0);
    expect(result.totalAmount).toBe(1000);
  });
});

describe('Product Discount & Savings Badge Calculations', () => {
  it('calculates discount percentage and savings when original price is higher', () => {
    const price = 8000;
    const originalPrice = 10000;

    const result = calculateProductSavings(price, originalPrice);

    expect(result.hasDiscount).toBe(true);
    expect(result.savingsAmount).toBe(2000);
    expect(result.discountPercentage).toBe(20);
  });

  it('returns no discount if original price is equal to or less than price', () => {
    expect(calculateProductSavings(5000, 5000).hasDiscount).toBe(false);
    expect(calculateProductSavings(6000, 5000).hasDiscount).toBe(false);
    expect(calculateProductSavings(5000, undefined).hasDiscount).toBe(false);
  });
});

describe('Order & Escrow State Machine Lifecycle', () => {
  it('allows valid normal delivery flow transitions', () => {
    expect(isValidOrderTransition('pending', 'confirmed')).toBe(true);
    expect(isValidOrderTransition('confirmed', 'shipped')).toBe(true);
    expect(isValidOrderTransition('shipped', 'delivered')).toBe(true);
    expect(isValidOrderTransition('delivered', 'completed')).toBe(true);
  });

  it('allows transitioning to disputed from active fulfillment states', () => {
    expect(isValidOrderTransition('confirmed', 'disputed')).toBe(true);
    expect(isValidOrderTransition('processing', 'disputed')).toBe(true);
    expect(isValidOrderTransition('shipped', 'disputed')).toBe(true);
    expect(isValidOrderTransition('delivered', 'disputed')).toBe(true);
  });

  it('rejects invalid or backwards transitions', () => {
    expect(isValidOrderTransition('completed', 'pending')).toBe(false);
    expect(isValidOrderTransition('refunded', 'shipped')).toBe(false);
    expect(isValidOrderTransition('cancelled', 'delivered')).toBe(false);
    expect(isValidOrderTransition('pending', 'delivered')).toBe(false);
  });

  it('correctly resolves dispute rulings into terminal states', () => {
    const refundResult = resolveDisputeOutcome('disputed', 'refund_buyer');
    expect(refundResult.nextStatus).toBe('refunded');
    expect(refundResult.disputeStatus).toBe('resolved_refunded');
    expect(refundResult.escrowStatus).toBe('refunded');

    const releaseResult = resolveDisputeOutcome('disputed', 'release_vendor');
    expect(releaseResult.nextStatus).toBe('completed');
    expect(releaseResult.disputeStatus).toBe('resolved_released');
    expect(releaseResult.escrowStatus).toBe('released');
  });

  it('throws error when trying to resolve dispute on non-disputed order', () => {
    expect(() => resolveDisputeOutcome('shipped', 'refund_buyer')).toThrow();
  });
});
