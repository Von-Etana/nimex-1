import { useState, useEffect } from 'react';
import { CartService } from '../services/cartService';

export const useCart = () => {
  const [itemCount, setItemCount] = useState(0);

  const updateCartCount = async () => {
    try {
      const count = await CartService.getCartCount();
      setItemCount(count);
    } catch (error) {
      console.error('Error reading cart count:', error);
      // Don't reset to 0 on error, keep previous state or handle gracefully
    }
  };

  useEffect(() => {
    // Initial load
    updateCartCount();

    // Listen for custom cart update events
    const handleCartUpdate = () => {
      updateCartCount();
    };

    window.addEventListener('cartUpdated', handleCartUpdate);

    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, []);

  return { itemCount, updateCartCount };
};

// Helper function to trigger cart updates
export const triggerCartUpdate = () => {
  window.dispatchEvent(new Event('cartUpdated'));
};
