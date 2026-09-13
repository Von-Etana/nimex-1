import { FirestoreService } from './firestore.service';
import { COLLECTIONS } from '../lib/collections';

export interface VendorLocation {
  city: string;
  state: string;
  address: string;
  lat: number | null;
  lng: number | null;
  phone: string;
  businessName: string;
}

/**
 * Resolve a vendor's pickup location from their vendor profile.
 * Falls back to extracting city/state from the free-text business_address
 * if explicit coordinates or market location are unavailable.
 */
export async function getVendorPickupLocation(vendorId: string): Promise<VendorLocation | null> {
  try {
    const vendor = await FirestoreService.getDocument<any>(COLLECTIONS.VENDORS, vendorId);
    if (!vendor) return null;

    const businessName = vendor.business_name || 'Vendor';
    const phone = vendor.business_phone || '08000000000';
    const address = vendor.business_address || '';

    // If explicit lat/lng exist, use them and try to derive city/state from address
    if (vendor.business_lat && vendor.business_lng) {
      const parsed = parseCityState(address);
      return {
        city: parsed.city || 'Ikeja',
        state: parsed.state || 'Lagos',
        address,
        lat: vendor.business_lat,
        lng: vendor.business_lng,
        phone,
        businessName,
      };
    }

    // If market is attached, use market city/state as fallback
    if (vendor.market_id) {
      const market = await FirestoreService.getDocument<any>(COLLECTIONS.MARKETS, vendor.market_id);
      if (market) {
        return {
          city: market.city || 'Ikeja',
          state: market.state || 'Lagos',
          address: address || `${market.name}, ${market.city}, ${market.state}`,
          lat: market.lat || null,
          lng: market.lng || null,
          phone,
          businessName,
        };
      }
    }

    // Last resort: parse free-text address
    const parsed = parseCityState(address);
    return {
      city: parsed.city || 'Ikeja',
      state: parsed.state || 'Lagos',
      address,
      lat: null,
      lng: null,
      phone,
      businessName,
    };
  } catch (error) {
    console.error('Error resolving vendor pickup location:', error);
    return null;
  }
}

function parseCityState(address: string): { city: string; state: string } {
  const parts = address.split(',').map(p => p.trim()).filter(Boolean);
  const state = parts[parts.length - 1] || '';
  const city = parts[parts.length - 2] || '';
  return { city, state };
}
