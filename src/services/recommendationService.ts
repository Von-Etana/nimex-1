import { supabase } from '../lib/supabase';

interface UserProfile {
  id: string;
  interests: string[];
  searchHistory: string[];
  purchaseHistory: string[];
  location?: string;
}

interface ProductRecommendation {
  product: any;
  score: number;
  reason: string;
}

interface VendorRanking {
  vendor: any;
  score: number;
  metrics: {
    totalSales: number;
    rating: number;
    responseTime: number;
    activeListings: number;
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
      const locationRecommendations = await this.getLocationBasedRecommendations(userProfile.location);

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
      console.error('Error getting personalized recommendations:', error);
      // Fallback to trending products
      return this.getTrendingProducts(limit);
    }
  }

  /**
   * Get trending products based on recent activity
   */
  async getTrendingProducts(limit: number = 20): Promise<ProductRecommendation[]> {
    try {
      // Calculate trending score based on recent views, purchases, and searches
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      // Get products with recent activity
      const { data: products, error } = await supabase
        .from('products')
        .select(`
          *,
          product_views(count),
          product_searches(count),
          order_items(count)
        `)
        .eq('is_active', true)
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(limit * 2);

      if (error) throw error;

      const recommendations: ProductRecommendation[] = products.map(product => {
        const views = product.product_views?.[0]?.count || 0;
        const searches = product.product_searches?.[0]?.count || 0;
        const purchases = product.order_items?.[0]?.count || 0;

        // Calculate trending score
        const score = (views * 0.3) + (searches * 0.4) + (purchases * 0.3);

        return {
          product,
          score,
          reason: 'Trending this week'
        };
      });

      return recommendations.sort((a, b) => b.score - a.score).slice(0, limit);

    } catch (error) {
      console.error('Error getting trending products:', error);
      return [];
    }
  }

  /**
   * Get top-ranked vendors
   */
  async getTopVendors(limit: number = 10): Promise<VendorRanking[]> {
    try {
      const { data: vendors, error } = await supabase
        .from('vendors')
        .select(`
          *,
          products(count),
          orders:order_items(count),
          reviews:rating
        `)
        .eq('is_active', true)
        .eq('subscription_status', 'active')
        .limit(limit * 2);

      if (error) throw error;

      const rankings: VendorRanking[] = vendors.map(vendor => {
        const totalSales = vendor.orders?.[0]?.count || 0;
        const rating = vendor.reviews || 0;
        const activeListings = vendor.products?.[0]?.count || 0;
        const responseTime = vendor.response_time || 24; // hours

        // Calculate vendor score
        const score = (
          (totalSales * 0.4) +
          (rating * 20 * 0.3) + // Rating out of 5, multiply by 20 for scaling
          (activeListings * 0.2) +
          ((24 - Math.min(responseTime, 24)) * 0.1) // Better response time = higher score
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
      console.error('Error getting top vendors:', error);
      return [];
    }
  }

  /**
   * Track user search for future recommendations
   */
  async trackUserSearch(userId: string, searchQuery: string, category?: string, location?: string) {
    try {
      await supabase
        .from('user_search_history')
        .insert({
          user_id: userId,
          search_query: searchQuery,
          category,
          location,
          searched_at: new Date().toISOString()
        });

      // Update user interests based on search patterns
      await this.updateUserInterests(userId, searchQuery, category);

    } catch (error) {
      console.error('Error tracking user search:', error);
    }
  }

  /**
   * Track product view for analytics
   */
  async trackProductView(productId: string, userId?: string) {
    try {
      await supabase
        .from('product_views')
        .insert({
          product_id: productId,
          user_id: userId,
          viewed_at: new Date().toISOString()
        });

    } catch (error) {
      console.error('Error tracking product view:', error);
    }
  }

  /**
   * Get user profile with interests and behavior data
   */
  private async getUserProfile(userId: string): Promise<UserProfile> {
    try {
      // Get recent search history
      const { data: searchHistory } = await supabase
        .from('user_search_history')
        .select('search_query, category')
        .eq('user_id', userId)
        .order('searched_at', { ascending: false })
        .limit(20);

      // Get purchase history
      const { data: purchaseHistory } = await supabase
        .from('orders')
        .select('order_items(product_id)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('location')
        .eq('id', userId)
        .single();

      // Extract interests from search and purchase history
      const interests = this.extractInterests(searchHistory || [], purchaseHistory || []);

      return {
        id: userId,
        interests,
        searchHistory: searchHistory?.map(s => s.search_query) || [],
        purchaseHistory: purchaseHistory?.flatMap(o => o.order_items?.map((item: any) => item.product_id) || []) || [],
        location: profile?.location
      };

    } catch (error) {
      console.error('Error getting user profile:', error);
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
      const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .in('category', interests)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      return products.map(product => ({
        product,
        score: 0.8, // High score for category matches
        reason: `Matches your interest in ${product.category}`
      }));

    } catch (error) {
      console.error('Error getting category recommendations:', error);
      return [];
    }
  }

  /**
   * Get location-based recommendations
   */
  private async getLocationBasedRecommendations(location?: string): Promise<ProductRecommendation[]> {
    if (!location) return [];

    try {
      const { data: products, error } = await supabase
        .from('products')
        .select(`
          *,
          vendors(market_location)
        `)
        .eq('is_active', true)
        .eq('vendors.market_location', location)
        .order('created_at', { ascending: false })
        .limit(15);

      if (error) throw error;

      return products.map(product => ({
        product,
        score: 0.6, // Medium score for location matches
        reason: `Available in your area (${location})`
      }));

    } catch (error) {
      console.error('Error getting location recommendations:', error);
      return [];
    }
  }

  /**
   * Extract user interests from search and purchase history
   */
  private extractInterests(searchHistory: any[], purchaseHistory: any[]): string[] {
    const interests = new Set<string>();

    // Extract from search history
    searchHistory.forEach(search => {
      if (search.category) {
        interests.add(search.category);
      }
    });

    // Extract from purchase history (would need product category lookup)
    // This is simplified - in production you'd join with products table

    return Array.from(interests);
  }

  /**
   * Update user interests based on search patterns
   */
  private async updateUserInterests(userId: string, searchQuery: string, category?: string) {
    try {
      // This would update a user_interests table or similar
      // For now, we'll just log the interest
      if (category) {
        await supabase
          .from('user_interests')
          .upsert({
            user_id: userId,
            category,
            last_updated: new Date().toISOString()
          });
      }
    } catch (error) {
      console.error('Error updating user interests:', error);
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
        // Boost score based on user profile
        let finalScore = rec.score;

        // Boost if product category matches user interests
        if (userProfile.interests.includes(rec.product.category)) {
          finalScore *= 1.2;
        }

        // Boost if user recently searched for similar products
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