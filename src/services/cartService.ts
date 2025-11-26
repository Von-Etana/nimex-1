import { supabase } from '../lib/supabase';
import { Database } from '../types/database';
import { z } from 'zod';
import { logger } from '../lib/logger';

// Validation schemas
const UUIDSchema = z.string().uuid('Invalid ID format');
const QuantitySchema = z.number().int('Quantity must be a whole number').min(1, 'Quantity must be at least 1').max(999, 'Quantity cannot exceed 999');

// Custom error classes
export class CartError extends Error {
    constructor(message: string, public code: string) {
        super(message);
        this.name = 'CartError';
    }
}

export class ValidationError extends CartError {
    constructor(message: string) {
        super(message, 'VALIDATION_ERROR');
        this.name = 'ValidationError';
    }
}

export class AuthenticationError extends CartError {
    constructor() {
        super('Please sign in to manage your cart', 'AUTH_ERROR');
        this.name = 'AuthenticationError';
    }
}

export type CartItem = Database['public']['Tables']['cart_items']['Row'] & {
    product?: Database['public']['Tables']['products']['Row'];
};

export type Cart = Database['public']['Tables']['carts']['Row'] & {
    items: CartItem[];
};

export const CartService = {
    async getCart(): Promise<Cart | null> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return null;

            const { data: cart, error } = await supabase
                .from('carts')
                .select('*, items:cart_items(*, product:products(*))')
                .eq('user_id', user.id)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
                logger.error('Error fetching cart:', error);
                throw new CartError('Unable to load your cart. Please try again.', 'FETCH_ERROR');
            }

            return cart as Cart;
        } catch (error) {
            if (error instanceof CartError) throw error;
            logger.error('Unexpected error in getCart:', error);
            throw new CartError('An unexpected error occurred. Please try again.', 'UNKNOWN_ERROR');
        }
    },

    async addToCart(productId: string, quantity: number = 1): Promise<void> {
        try {
            // Validate inputs
            UUIDSchema.parse(productId);
            QuantitySchema.parse(quantity);

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new AuthenticationError();

            // 1. Get or create cart
            let { data: cart } = await supabase
                .from('carts')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (!cart) {
                const { data: newCart, error: createError } = await supabase
                    .from('carts')
                    .insert({ user_id: user.id })
                    .select('id')
                    .single();

                if (createError) {
                    logger.error('Error creating cart:', createError);
                    throw new CartError('Unable to create cart. Please try again.', 'CREATE_ERROR');
                }
                cart = newCart;
            }

            if (!cart) throw new CartError('Failed to create cart', 'CREATE_ERROR');

            // 2. Check if item exists
            const { data: existingItem } = await supabase
                .from('cart_items')
                .select('id, quantity')
                .eq('cart_id', cart.id)
                .eq('product_id', productId)
                .single();

            if (existingItem) {
                // Update quantity
                const newQuantity = existingItem.quantity + quantity;
                if (newQuantity > 999) {
                    throw new ValidationError('Cannot add more than 999 items');
                }

                const { error } = await supabase
                    .from('cart_items')
                    .update({ quantity: newQuantity })
                    .eq('id', existingItem.id);

                if (error) {
                    logger.error('Error updating cart item:', error);
                    throw new CartError('Unable to update cart. Please try again.', 'UPDATE_ERROR');
                }
            } else {
                // Insert new item
                const { error } = await supabase
                    .from('cart_items')
                    .insert({
                        cart_id: cart.id,
                        product_id: productId,
                        quantity
                    });

                if (error) {
                    logger.error('Error adding to cart:', error);
                    throw new CartError('Unable to add item to cart. Please try again.', 'INSERT_ERROR');
                }
            }
        } catch (error) {
            if (error instanceof z.ZodError) {
                throw new ValidationError(error.errors[0].message);
            }
            if (error instanceof CartError) throw error;
            logger.error('Unexpected error in addToCart:', error);
            throw new CartError('An unexpected error occurred. Please try again.', 'UNKNOWN_ERROR');
        }
    },

    async updateQuantity(itemId: string, quantity: number): Promise<void> {
        try {
            // Validate inputs
            UUIDSchema.parse(itemId);

            if (quantity <= 0) {
                await this.removeFromCart(itemId);
                return;
            }

            QuantitySchema.parse(quantity);

            const { error } = await supabase
                .from('cart_items')
                .update({ quantity })
                .eq('id', itemId);

            if (error) {
                logger.error('Error updating quantity:', error);
                throw new CartError('Unable to update quantity. Please try again.', 'UPDATE_ERROR');
            }
        } catch (error) {
            if (error instanceof z.ZodError) {
                throw new ValidationError(error.errors[0].message);
            }
            if (error instanceof CartError) throw error;
            logger.error('Unexpected error in updateQuantity:', error);
            throw new CartError('An unexpected error occurred. Please try again.', 'UNKNOWN_ERROR');
        }
    },

    async removeFromCart(itemId: string): Promise<void> {
        try {
            UUIDSchema.parse(itemId);

            const { error } = await supabase
                .from('cart_items')
                .delete()
                .eq('id', itemId);

            if (error) {
                logger.error('Error removing from cart:', error);
                throw new CartError('Unable to remove item. Please try again.', 'DELETE_ERROR');
            }
        } catch (error) {
            if (error instanceof z.ZodError) {
                throw new ValidationError(error.errors[0].message);
            }
            if (error instanceof CartError) throw error;
            logger.error('Unexpected error in removeFromCart:', error);
            throw new CartError('An unexpected error occurred. Please try again.', 'UNKNOWN_ERROR');
        }
    },

    async clearCart(): Promise<void> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: cart } = await supabase
                .from('carts')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (cart) {
                const { error } = await supabase
                    .from('cart_items')
                    .delete()
                    .eq('cart_id', cart.id);

                if (error) {
                    logger.error('Error clearing cart:', error);
                    throw new CartError('Unable to clear cart. Please try again.', 'CLEAR_ERROR');
                }
            }
        } catch (error) {
            if (error instanceof CartError) throw error;
            logger.error('Unexpected error in clearCart:', error);
            throw new CartError('An unexpected error occurred. Please try again.', 'UNKNOWN_ERROR');
        }
    },

    async getCartCount(): Promise<number> {
        const cart = await this.getCart();
        if (!cart || !cart.items) return 0;
        return cart.items.reduce((sum, item) => sum + item.quantity, 0);
    }
};
