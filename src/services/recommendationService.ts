import { FirestoreService } from './firestore.service';
import { COLLECTIONS } from '../lib/collections';
import { logger } from '../lib/logger';
import { Timestamp } from 'firebase/firestore';
import type { Product, Vendor, Profile } from '../types/firestore';

interface UserProfile {
  id: string;
  interests: string[];
  searchHistory: string[];
  purchaseHistory: string[];
  location?: string;
}

interface ProductRecommendation {
  product: Product;
  score: number;
  reason: string;
}

interface VendorRanking {
  vendor: Vendor;
  score: number;
  metrics: {
    totalSales: number;
    rating: number;
    responseTime: number;
    activeListings: number; // This might need to be maintained on vendor doc
  };
}

class RecommendationService {
  /**
   * Get personalized product recommendations for a user
   */
  async getPersonalizedRecommendations(userId: string, limit: number = 10): Promise<ProductRecommendation[]> {
    try {
      // Get user profile and behavior data
      const userProfile = await this.getUserProfile(userId);

      // Get trending products
      const trendingProducts = await this.getTrendingProducts();

      // Get category-based recommendations
      const categoryRecommendations = await this.getCategoryBasedRecommendations(userProfile.interests);

      // Get location-based recommendations
      const locationRecommendations = await this.getLocationBasedRecommendations(userProfile.location || undefined);

      // Combine and score recommendations
      const allRecommendations = [
        ...trendingProducts.map(p => ({ ...p, source: 'trending' })),
        ...categoryRecommendations.map(p => ({ ...p, source: 'category' })),
        ...locationRecommendations.map(p => ({ ...p, source: 'location' })),
      ];

      // Remove duplicates and calculate final scores
      const uniqueRecommendations = this.deduplicateAndScore(allRecommendations, userProfile);

      return uniqueRecommendations
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

    } catch (error) {
      logger.error('Error getting personalized recommendations:', error);
      // Fallback to trending products
      return this.getTrendingProducts(limit);
    }
  }

  /**
   * Get trending products based on view count
   */
  async getTrendingProducts(limit: number = 20): Promise<ProductRecommendation[]> {
    try {
      // Fetch products ordered by created_at (most indexes support this)
      // Then filter client-side for active status to avoid composite index requirement
      const allProducts = await FirestoreService.getDocuments<Product>(COLLECTIONS.PRODUCTS, {
        orderByField: 'created_at',
        orderByDirection: 'desc',
        limitCount: 50  // Fetch more to filter from
      });

      // Filter for active products
      const activeProducts = (allProducts || []).filter(p =>
        p.status === 'active' || p.is_active === true
      );

      // Sort by view_count client-side
      const sortedProducts = activeProducts
        .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
        .slice(0, limit);

      return sortedProducts.map(product => ({
        product,
        score: Math.min((product.view_count || 0) / 100, 1), // Normalize score
        reason: 'Trending this week'
      }));

    } catch (error) {
      logger.error('Error getting trending products:', error);
      return [];
    }
  }

  /**
   * Get top-ranked vendors
   */
  async getTopVendors(limit: number = 10): Promise<VendorRanking[]> {
    try {
      // Fetch vendors without composite filters to avoid index requirement
      const allVendors = await FirestoreService.getDocuments<Vendor>(COLLECTIONS.VENDORS, {
        limitCount: 100  // Fetch more to filter from
      });

      // Filter client-side for active vendors with active subscription
      const activeVendors = (allVendors || []).filter(vendor =>
        vendor.is_active === true && vendor.subscription_status === 'active'
      );

      const rankings: VendorRanking[] = activeVendors.map(vendor => {
        const totalSales = vendor.total_sales || 0;
        const rating = vendor.rating || 0;
        const responseTime = vendor.response_time || 24;
        const activeListings = 0; // We'd need to query products count or store it on vendor

        // Calculate vendor score
        const score = (
          (totalSales * 0.4) +
          (rating * 20 * 0.3) +
          ((24 - Math.min(responseTime, 24)) * 0.1)
        );

        return {
          vendor,
          score,
          metrics: {
            totalSales,
            rating,
            responseTime,
            activeListings
          }
        };
      });

      return rankings
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

    } catch (error) {
      logger.error('Error getting top vendors:', error);
      return [];
    }
  }

  /**
   * Track user search for future recommendations
   */
  async trackUserSearch(userId: string, searchQuery: string, category?: string, location?: string) {
    try {
      const id = `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await FirestoreService.setDocument(COLLECTIONS.USER_SEARCH_HISTORY, id, {
        user_id: userId,
        search_query: searchQuery,
        category,
        location,
        searched_at: Timestamp.now()
      });

      // Update user interests based on search patterns
      await this.updateUserInterests(userId, searchQuery, category);

    } catch (error) {
      logger.error('Error tracking user search:', error);
    }
  }

  /**
   * Track product view for analytics
   */
  async trackProductView(productId: string, userId?: string) {
    try {
      const id = `view_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await FirestoreService.setDocument(COLLECTIONS.PRODUCT_VIEWS, id, {
        product_id: productId,
        user_id: userId,
        viewed_at: Timestamp.now()
      });

      // Also increment view count on product
      // This requires a special atomic increment operation which we haven't exposed in FirestoreService yet
      // For now, we'll skip atomic increment or implement it later
      // Ideally FirestoreService should have an incrementField method

    } catch (error) {
      logger.error('Error tracking product view:', error);
    }
  }

  /**
   * Get user profile with interests and behavior data
   */
  private async getUserProfile(userId: string): Promise<UserProfile> {
    try {
      // Get recent search history
      const searchHistory = await FirestoreService.getDocuments<any>(COLLECTIONS.USER_SEARCH_HISTORY, {
        filters: [{ field: 'user_id', operator: '==', value: userId }],
        orderByField: 'searched_at',
        orderByDirection: 'desc',
        limitCount: 20
      });

      // Get purchase history (from orders)
      const orders = await FirestoreService.getDocuments<any>(COLLECTIONS.ORDERS, {
        filters: [{ field: 'buyer_id', operator: '==', value: userId }],
        orderByField: 'created_at',
        orderByDirection: 'desc',
        limitCount: 10
      });

      // Get user profile
      const profile = await FirestoreService.getDocument<Profile>(COLLECTIONS.PROFILES, userId);

      // Extract interests
      const interests = this.extractInterests(searchHistory || [], orders || []);

      return {
        id: userId,
        interests,
        searchHistory: searchHistory?.map(s => s.search_query) || [],
        purchaseHistory: [], // Complex to extract product IDs from orders without subcollection query, skipping for now
        location: profile?.location || undefined
      };

    } catch (error) {
      logger.error('Error getting user profile:', error);
      return {
        id: userId,
        interests: [],
        searchHistory: [],
        purchaseHistory: [],
      };
    }
  }

  /**
   * Get category-based recommendations
   */
  private async getCategoryBasedRecommendations(interests: string[]): Promise<ProductRecommendation[]> {
    if (interests.length === 0) return [];

    try {
      // Firestore 'in' query supports up to 10 values
      const safeInterests = interests.slice(0, 10);

      const products = await FirestoreService.getDocuments<Product>(COLLECTIONS.PRODUCTS, {
        filters: [
          { field: 'status', operator: '==', value: 'active' },
          { field: 'category_id', operator: 'in', value: safeInterests } // Assuming category_id matches interest
        ],
        limitCount: 20
      });

      return products.map(product => ({
        product,
        score: 0.8,
        reason: `Matches your interest in ${product.category_id}`
      }));

    } catch (error) {
      logger.error('Error getting category recommendations:', error);
      return [];
    }
  }

  /**
   * Get location-based recommendations
   */
  private async getLocationBasedRecommendations(location?: string): Promise<ProductRecommendation[]> {
    if (!location) return [];

    try {
      // This requires querying products where vendor.market_location == location
      // In Firestore, we can't join. We need to find vendors in location first, then their products.
      // Or denormalize location onto product.
      // For now, let's skip complex location query or assume we have 'market_location' on product (denormalized)

      // Assuming we can't easily do this without denormalization, returning empty for now
      return [];

    } catch (error) {
      logger.error('Error getting location recommendations:', error);
      return [];
    }
  }

  /**
   * Extract user interests from search and purchase history
   */
  private extractInterests(searchHistory: any[], purchaseHistory: any[]): string[] {
    const interests = new Set<string>();

    searchHistory.forEach(search => {
      if (search.category) {
        interests.add(search.category);
      }
    });

    return Array.from(interests);
  }

  /**
   * Update user interests based on search patterns
   */
  private async updateUserInterests(userId: string, searchQuery: string, category?: string) {
    try {
      if (category) {
        const id = `interest_${userId}_${category}`; // Simple ID generation
        await FirestoreService.setDocument(COLLECTIONS.USER_INTERESTS, id, {
          user_id: userId,
          category,
          last_updated: Timestamp.now()
        });
      }
    } catch (error) {
      logger.error('Error updating user interests:', error);
    }
  }

  /**
   * Remove duplicates and calculate final recommendation scores
   */
  private deduplicateAndScore(
    recommendations: any[],
    userProfile: UserProfile
  ): ProductRecommendation[] {
    const productMap = new Map<string, ProductRecommendation>();

    recommendations.forEach(rec => {
      const productId = rec.product.id;
      const existing = productMap.get(productId);

      if (!existing || rec.score > existing.score) {
        let finalScore = rec.score;

        // Boost score based on user profile
        if (userProfile.interests.includes(rec.product.category_id)) {
          finalScore *= 1.2;
        }

        if (userProfile.searchHistory.some(search =>
          rec.product.title.toLowerCase().includes(search.toLowerCase()) ||
          rec.product.description?.toLowerCase().includes(search.toLowerCase())
        )) {
          finalScore *= 1.1;
        }

        productMap.set(productId, {
          product: rec.product,
          score: finalScore,
          reason: rec.reason
        });
      }
    });

    return Array.from(productMap.values());
  }
}

export const recommendationService = new RecommendationService();
export type { ProductRecommendation, VendorRanking, UserProfile };
