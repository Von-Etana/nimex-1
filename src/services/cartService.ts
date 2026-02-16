import { FirestoreService } from './firestore.service';
import { FirebaseAuthService } from './firebaseAuth.service';
import { COLLECTIONS } from '../lib/collections';
import { logger } from '../lib/logger';
import { z } from 'zod';
import type { Cart, CartItem, CartItemWithProduct, CartWithItems, Product } from '../types/firestore';

// Validation schemas
const IDSchema = z.string().min(1, 'Invalid ID');
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

export const CartService = {
    async getCart(): Promise<CartWithItems | null> {
        try {
            const user = FirebaseAuthService.getCurrentUser();
            if (!user) return null;

            // 1. Get cart
            const carts = await FirestoreService.getDocuments<Cart>(COLLECTIONS.CARTS, {
                filters: [{ field: 'user_id', operator: '==', value: user.uid }],
                limitCount: 1
            });

            if (carts.length === 0) {
                return null;
            }

            const cart = carts[0];

            // 2. Get cart items
            const items = await FirestoreService.getDocuments<CartItem>(COLLECTIONS.CART_ITEMS, {
                filters: [{ field: 'cart_id', operator: '==', value: cart.id }]
            });

            // 3. Fetch product details for each item
            // This is an N+1 query, but for a cart (usually small number of items), it's acceptable.
            // Optimization: We could store product snapshot in cart item, but we want fresh prices.
            const itemsWithProducts: CartItemWithProduct[] = await Promise.all(
                items.map(async (item) => {
                    try {
                        const product = await FirestoreService.getDocument<Product>(COLLECTIONS.PRODUCTS, item.product_id);
                        return {
                            ...item,
                            product: product || undefined
                        };
                    } catch (error) {
                        logger.warn(`Failed to fetch product for cart item ${item.id}`, error);
                        return item;
                    }
                })
            );

            return {
                ...cart,
                items: itemsWithProducts
            };

        } catch (error) {
            if (error instanceof CartError) throw error;
            logger.error('Unexpected error in getCart:', error);
            throw new CartError('An unexpected error occurred. Please try again.', 'UNKNOWN_ERROR');
        }
    },

    async addToCart(productId: string, quantity: number = 1): Promise<void> {
        try {
            // Validate inputs
            IDSchema.parse(productId);
            QuantitySchema.parse(quantity);

            const user = FirebaseAuthService.getCurrentUser();
            if (!user) throw new AuthenticationError();

            // 1. Get or create cart
            let cartId: string;

            const carts = await FirestoreService.getDocuments<Cart>(COLLECTIONS.CARTS, {
                filters: [{ field: 'user_id', operator: '==', value: user.uid }],
                limitCount: 1
            });

            if (carts.length > 0) {
                cartId = carts[0].id;
            } else {
                // Create new cart
                // We can use user.uid as cart ID for 1:1 mapping, but let's stick to auto-ID for flexibility
                // Actually, let's use a generated ID to avoid potential issues if we ever want multiple carts
                const newCartRef = await FirestoreService.setDocument(COLLECTIONS.CARTS, `cart_${user.uid}`, {
                    user_id: user.uid
                });
                cartId = `cart_${user.uid}`;
            }

            // 2. Check if item exists
            const existingItems = await FirestoreService.getDocuments<CartItem>(COLLECTIONS.CART_ITEMS, {
                filters: [
                    { field: 'cart_id', operator: '==', value: cartId },
                    { field: 'product_id', operator: '==', value: productId }
                ],
                limitCount: 1
            });

            if (existingItems.length > 0) {
                // Update quantity
                const existingItem = existingItems[0];
                const newQuantity = existingItem.quantity + quantity;

                if (newQuantity > 999) {
                    throw new ValidationError('Cannot add more than 999 items');
                }

                await FirestoreService.updateDocument(COLLECTIONS.CART_ITEMS, existingItem.id, {
                    quantity: newQuantity
                });
            } else {
                // Insert new item
                // Generate a unique ID for the cart item
                const itemId = `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

                await FirestoreService.setDocument(COLLECTIONS.CART_ITEMS, itemId, {
                    cart_id: cartId,
                    product_id: productId,
                    quantity
                });
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
            IDSchema.parse(itemId);

            if (quantity <= 0) {
                await this.removeFromCart(itemId);
                return;
            }

            QuantitySchema.parse(quantity);

            await FirestoreService.updateDocument(COLLECTIONS.CART_ITEMS, itemId, {
                quantity
            });

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
            IDSchema.parse(itemId);

            await FirestoreService.deleteDocument(COLLECTIONS.CART_ITEMS, itemId);

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
            const user = FirebaseAuthService.getCurrentUser();
            if (!user) return;

            const carts = await FirestoreService.getDocuments<Cart>(COLLECTIONS.CARTS, {
                filters: [{ field: 'user_id', operator: '==', value: user.uid }],
                limitCount: 1
            });

            if (carts.length > 0) {
                const cartId = carts[0].id;

                // Get all items
                const items = await FirestoreService.getDocuments<CartItem>(COLLECTIONS.CART_ITEMS, {
                    filters: [{ field: 'cart_id', operator: '==', value: cartId }]
                });

                // Delete all items in batch
                if (items.length > 0) {
                    const operations = items.map(item => ({
                        type: 'delete' as const,
                        collectionName: COLLECTIONS.CART_ITEMS,
                        documentId: item.id
                    }));

                    // Batch write allows max 500 operations. If more, we need to chunk.
                    // Assuming cart size is small for now.
                    await FirestoreService.batchWrite(operations);
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
