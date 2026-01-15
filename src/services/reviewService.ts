/**
 * Review Service
 * Handles product reviews and ratings
 */

import { FirestoreService } from './firestore.service';
import { COLLECTIONS } from '../lib/collections';
import { Timestamp } from 'firebase/firestore';
import { notificationService } from './notificationService';

export interface Review {
    id: string;
    product_id: string;
    vendor_id: string;
    buyer_id: string;
    buyer_name: string;
    order_id: string;
    rating: number;
    title?: string;
    comment: string;
    images?: string[];
    created_at: any;
    is_verified_purchase: boolean;
}

interface CreateReviewParams {
    productId: string;
    vendorId: string;
    buyerId: string;
    buyerName: string;
    orderId: string;
    rating: number;
    title?: string;
    comment: string;
    images?: string[];
}

class ReviewService {
    /**
     * Create a new review
     */
    async createReview(params: CreateReviewParams): Promise<{ success: boolean; id?: string; error?: string }> {
        try {
            // Check if already reviewed
            const existingReviews = await FirestoreService.getDocuments<Review>(COLLECTIONS.REVIEWS, {
                filters: [
                    { field: 'product_id', operator: '==', value: params.productId },
                    { field: 'buyer_id', operator: '==', value: params.buyerId },
                    { field: 'order_id', operator: '==', value: params.orderId },
                ],
                limitCount: 1,
            });

            if (existingReviews && existingReviews.length > 0) {
                return { success: false, error: 'You have already reviewed this product for this order' };
            }

            const reviewId = `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            await FirestoreService.setDocument(COLLECTIONS.REVIEWS, reviewId, {
                id: reviewId,
                product_id: params.productId,
                vendor_id: params.vendorId,
                buyer_id: params.buyerId,
                buyer_name: params.buyerName,
                order_id: params.orderId,
                rating: params.rating,
                title: params.title || '',
                comment: params.comment,
                images: params.images || [],
                is_verified_purchase: true,
                created_at: Timestamp.now(),
            });

            // Update product average rating
            await this.updateProductRating(params.productId);

            // Get product name for notification
            const product = await FirestoreService.getDocument<any>(COLLECTIONS.PRODUCTS, params.productId);

            // Notify vendor about new review
            if (product) {
                await notificationService.notifyNewReview(
                    params.vendorId,
                    params.productId,
                    product.title || 'Product',
                    params.rating,
                    params.buyerName
                );
            }

            return { success: true, id: reviewId };
        } catch (error) {
            console.error('Error creating review:', error);
            return { success: false, error: error instanceof Error ? error.message : 'Failed to create review' };
        }
    }

    /**
     * Get reviews for a product
     */
    async getProductReviews(productId: string, limit: number = 10): Promise<Review[]> {
        try {
            const reviews = await FirestoreService.getDocuments<Review>(COLLECTIONS.REVIEWS, {
                filters: [{ field: 'product_id', operator: '==', value: productId }],
                orderByField: 'created_at',
                orderByDirection: 'desc',
                limitCount: limit,
            });

            return reviews || [];
        } catch (error) {
            console.error('Error fetching reviews:', error);
            return [];
        }
    }

    /**
     * Update product average rating
     */
    private async updateProductRating(productId: string): Promise<void> {
        try {
            const reviews = await FirestoreService.getDocuments<Review>(COLLECTIONS.REVIEWS, {
                filters: [{ field: 'product_id', operator: '==', value: productId }],
            });

            if (!reviews || reviews.length === 0) return;

            const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
            const averageRating = totalRating / reviews.length;

            await FirestoreService.updateDocument(COLLECTIONS.PRODUCTS, productId, {
                rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
                reviews_count: reviews.length,
            });
        } catch (error) {
            console.error('Error updating product rating:', error);
        }
    }

    /**
     * Check if user can review a product (has purchased and delivery confirmed)
     */
    async canUserReview(userId: string, productId: string): Promise<{ canReview: boolean; orderId?: string }> {
        try {
            // Find completed orders with this product
            const orders = await FirestoreService.getDocuments<any>(COLLECTIONS.ORDERS, {
                filters: [
                    { field: 'buyer_id', operator: '==', value: userId },
                    { field: 'status', operator: '==', value: 'delivered' },
                ],
            });

            if (!orders || orders.length === 0) {
                return { canReview: false };
            }

            // Check if any order contains this product and hasn't been reviewed
            for (const order of orders) {
                const orderItems = await FirestoreService.getDocuments<any>(COLLECTIONS.ORDER_ITEMS, {
                    filters: [
                        { field: 'order_id', operator: '==', value: order.id },
                        { field: 'product_id', operator: '==', value: productId },
                    ],
                    limitCount: 1,
                });

                if (orderItems && orderItems.length > 0) {
                    // Check if already reviewed
                    const existingReview = await FirestoreService.getDocuments<Review>(COLLECTIONS.REVIEWS, {
                        filters: [
                            { field: 'buyer_id', operator: '==', value: userId },
                            { field: 'order_id', operator: '==', value: order.id },
                            { field: 'product_id', operator: '==', value: productId },
                        ],
                        limitCount: 1,
                    });

                    if (!existingReview || existingReview.length === 0) {
                        return { canReview: true, orderId: order.id };
                    }
                }
            }

            return { canReview: false };
        } catch (error) {
            console.error('Error checking review eligibility:', error);
            return { canReview: false };
        }
    }
}

export const reviewService = new ReviewService();
