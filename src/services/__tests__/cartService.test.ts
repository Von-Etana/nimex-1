import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CartService, CartError, ValidationError, AuthenticationError } from '../cartService';
import { supabase } from '../../lib/supabase';
import { logger } from '../../lib/logger';

// Mock supabase and logger
vi.mock('../../lib/supabase', () => ({
    supabase: {
        auth: {
            getUser: vi.fn()
        },
        from: vi.fn()
    }
}));

vi.mock('../../lib/logger', () => ({
    logger: {
        error: vi.fn(),
        warn: vi.fn(),
        info: vi.fn()
    }
}));

describe('CartService', () => {
    const mockUser = { id: 'user-123' };
    const mockProductId = '550e8400-e29b-41d4-a716-446655440000';

    beforeEach(() => {
        vi.clearAllMocks();
        // Default authenticated user
        (supabase.auth.getUser as any).mockResolvedValue({ data: { user: mockUser } });
    });

    describe('getCart', () => {
        it('should return null if user is not authenticated', async () => {
            (supabase.auth.getUser as any).mockResolvedValue({ data: { user: null } });
            const result = await CartService.getCart();
            expect(result).toBeNull();
        });

        it('should return cart with items', async () => {
            const mockCart = {
                id: 'cart-1',
                user_id: 'user-123',
                items: [],
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const mockFrom = vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        single: vi.fn().mockResolvedValue({ data: mockCart, error: null })
                    })
                })
            });

            (supabase.from as any) = mockFrom;

            const result = await CartService.getCart();

            expect(supabase.from).toHaveBeenCalledWith('carts');
            expect(result).toEqual(mockCart);
        });

        it('should throw CartError on database error', async () => {
            const mockFrom = vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        single: vi.fn().mockResolvedValue({
                            data: null,
                            error: { code: 'ERROR', message: 'Database error' }
                        })
                    })
                })
            });

            (supabase.from as any) = mockFrom;

            await expect(CartService.getCart()).rejects.toThrow(CartError);
            expect(logger.error).toHaveBeenCalled();
        });
    });

    describe('addToCart', () => {
        it('should throw AuthenticationError if user not authenticated', async () => {
            (supabase.auth.getUser as any).mockResolvedValue({ data: { user: null } });

            await expect(
                CartService.addToCart(mockProductId, 1)
            ).rejects.toThrow(AuthenticationError);
        });

        it('should throw ValidationError for invalid product ID', async () => {
            await expect(
                CartService.addToCart('invalid-id', 1)
            ).rejects.toThrow(ValidationError);
        });

        it('should throw ValidationError for invalid quantity', async () => {
            await expect(
                CartService.addToCart(mockProductId, 0)
            ).rejects.toThrow(ValidationError);

            await expect(
                CartService.addToCart(mockProductId, -1)
            ).rejects.toThrow(ValidationError);

            await expect(
                CartService.addToCart(mockProductId, 1000)
            ).rejects.toThrow(ValidationError);
        });

        it('should create new cart if none exists and add item', async () => {
            const mockCartId = 'new-cart-id';

            // Mock cart check (no cart)
            const mockFrom = vi.fn()
                .mockReturnValueOnce({
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            single: vi.fn().mockResolvedValue({ data: null, error: null })
                        })
                    }),
                    insert: vi.fn().mockReturnValue({
                        select: vi.fn().mockReturnValue({
                            single: vi.fn().mockResolvedValue({
                                data: { id: mockCartId },
                                error: null
                            })
                        })
                    })
                })
                // Mock item check (no existing item)
                .mockReturnValueOnce({
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            eq: vi.fn().mockReturnValue({
                                single: vi.fn().mockResolvedValue({ data: null, error: null })
                            })
                        })
                    }),
                    insert: vi.fn().mockResolvedValue({ error: null })
                });

            (supabase.from as any) = mockFrom;

            await CartService.addToCart(mockProductId, 2);

            expect(supabase.from).toHaveBeenCalledWith('carts');
            expect(supabase.from).toHaveBeenCalledWith('cart_items');
        });

        it('should update quantity if item already exists', async () => {
            const mockCartId = 'existing-cart';
            const mockItemId = 'existing-item';

            const mockFrom = vi.fn()
                // Mock cart exists
                .mockReturnValueOnce({
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            single: vi.fn().mockResolvedValue({
                                data: { id: mockCartId },
                                error: null
                            })
                        })
                    })
                })
                // Mock existing item
                .mockReturnValueOnce({
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            eq: vi.fn().mockReturnValue({
                                single: vi.fn().mockResolvedValue({
                                    data: { id: mockItemId, quantity: 2 },
                                    error: null
                                })
                            })
                        })
                    }),
                    update: vi.fn().mockReturnValue({
                        eq: vi.fn().mockResolvedValue({ error: null })
                    })
                });

            (supabase.from as any) = mockFrom;

            await CartService.addToCart(mockProductId, 3);

            expect(supabase.from).toHaveBeenCalledWith('cart_items');
        });

        it('should throw ValidationError if total quantity exceeds 999', async () => {
            const mockCartId = 'existing-cart';
            const mockItemId = 'existing-item';

            const mockFrom = vi.fn()
                .mockReturnValueOnce({
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            single: vi.fn().mockResolvedValue({
                                data: { id: mockCartId },
                                error: null
                            })
                        })
                    })
                })
                .mockReturnValueOnce({
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            eq: vi.fn().mockReturnValue({
                                single: vi.fn().mockResolvedValue({
                                    data: { id: mockItemId, quantity: 998 },
                                    error: null
                                })
                            })
                        })
                    })
                });

            (supabase.from as any) = mockFrom;

            await expect(
                CartService.addToCart(mockProductId, 2)
            ).rejects.toThrow(ValidationError);
        });
    });

    describe('updateQuantity', () => {
        const mockItemId = '550e8400-e29b-41d4-a716-446655440001';

        it('should throw ValidationError for invalid item ID', async () => {
            await expect(
                CartService.updateQuantity('invalid-id', 5)
            ).rejects.toThrow(ValidationError);
        });

        it('should remove item if quantity is 0 or negative', async () => {
            const mockFrom = vi.fn().mockReturnValue({
                delete: vi.fn().mockReturnValue({
                    eq: vi.fn().mockResolvedValue({ error: null })
                })
            });

            (supabase.from as any) = mockFrom;

            await CartService.updateQuantity(mockItemId, 0);
            expect(supabase.from).toHaveBeenCalledWith('cart_items');
        });

        it('should update quantity for valid input', async () => {
            const mockFrom = vi.fn().mockReturnValue({
                update: vi.fn().mockReturnValue({
                    eq: vi.fn().mockResolvedValue({ error: null })
                })
            });

            (supabase.from as any) = mockFrom;

            await CartService.updateQuantity(mockItemId, 5);
            expect(supabase.from).toHaveBeenCalledWith('cart_items');
        });
    });

    describe('removeFromCart', () => {
        const mockItemId = '550e8400-e29b-41d4-a716-446655440001';

        it('should throw ValidationError for invalid item ID', async () => {
            await expect(
                CartService.removeFromCart('invalid-id')
            ).rejects.toThrow(ValidationError);
        });

        it('should remove item successfully', async () => {
            const mockFrom = vi.fn().mockReturnValue({
                delete: vi.fn().mockReturnValue({
                    eq: vi.fn().mockResolvedValue({ error: null })
                })
            });

            (supabase.from as any) = mockFrom;

            await CartService.removeFromCart(mockItemId);
            expect(supabase.from).toHaveBeenCalledWith('cart_items');
        });
    });

    describe('clearCart', () => {
        it('should return early if user not authenticated', async () => {
            (supabase.auth.getUser as any).mockResolvedValue({ data: { user: null } });

            await CartService.clearCart();

            expect(supabase.from).not.toHaveBeenCalled();
        });

        it('should clear all cart items', async () => {
            const mockCartId = 'cart-123';

            const mockFrom = vi.fn()
                .mockReturnValueOnce({
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            single: vi.fn().mockResolvedValue({
                                data: { id: mockCartId },
                                error: null
                            })
                        })
                    })
                })
                .mockReturnValueOnce({
                    delete: vi.fn().mockReturnValue({
                        eq: vi.fn().mockResolvedValue({ error: null })
                    })
                });

            (supabase.from as any) = mockFrom;

            await CartService.clearCart();

            expect(supabase.from).toHaveBeenCalledWith('carts');
            expect(supabase.from).toHaveBeenCalledWith('cart_items');
        });
    });

    describe('getCartCount', () => {
        it('should return 0 if no cart', async () => {
            (supabase.auth.getUser as any).mockResolvedValue({ data: { user: null } });

            const count = await CartService.getCartCount();
            expect(count).toBe(0);
        });

        it('should return total quantity of all items', async () => {
            const mockCart = {
                id: 'cart-1',
                user_id: 'user-123',
                items: [
                    { id: '1', quantity: 2, product_id: mockProductId, cart_id: 'cart-1', created_at: '', updated_at: '' },
                    { id: '2', quantity: 3, product_id: mockProductId, cart_id: 'cart-1', created_at: '', updated_at: '' },
                    { id: '3', quantity: 1, product_id: mockProductId, cart_id: 'cart-1', created_at: '', updated_at: '' }
                ],
                created_at: '',
                updated_at: ''
            };

            const mockFrom = vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        single: vi.fn().mockResolvedValue({ data: mockCart, error: null })
                    })
                })
            });

            (supabase.from as any) = mockFrom;

            const count = await CartService.getCartCount();
            expect(count).toBe(6); // 2 + 3 + 1
        });
    });
});
