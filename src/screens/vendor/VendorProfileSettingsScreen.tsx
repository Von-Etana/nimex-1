import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { MapPin, Building2, Phone, Save, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { LocationPicker } from '../../components/maps';
import { FirestoreService } from '../../services/firestore.service';
import { COLLECTIONS } from '../../lib/collections';
import { Timestamp } from 'firebase/firestore';

interface Market {
  id: string;
  name: string;
  city: string;
  state: string;
  description: string | null;
  is_active: boolean;
}

interface VendorProfile {
  id: string;
  business_name: string;
  business_description: string | null;
  business_address: string | null;
  business_phone: string | null;
  market_id: string | null;
  market_location_details: string | null;
  business_lat: number | null;
  business_lng: number | null;
  cac_number: string | null;
  cac_certificate_url: string | null;
  proof_of_address_url: string | null;
  avatar_url: string | null;
}

export const VendorProfileSettingsScreen: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    businessName: '',
    businessDescription: '',
    businessAddress: '',
    businessPhone: '',
    marketId: '',
    marketLocationDetails: '',
    businessLat: null as number | null,
    businessLng: null as number | null,
    cacNumber: '',
    cacCertificateUrl: '',
    proofOfAddressUrl: '',
    avatarUrl: '',
  });
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Fetch Markets
      const marketsData = await FirestoreService.getDocuments<Market>(COLLECTIONS.MARKETS, {
        filters: [{ field: 'is_active', operator: '==', value: true }],
        orderByField: 'name'
      });
      setMarkets(marketsData || []);

      if (user) {
        // Fetch Vendor Data
        const vendorData = await FirestoreService.getDocument<VendorProfile>(COLLECTIONS.VENDORS, user.uid);

        if (vendorData) {
          setFormData({
            businessName: vendorData.business_name || '',
            businessDescription: vendorData.business_description || '',
            businessAddress: vendorData.business_address || '',
            businessPhone: vendorData.business_phone || '',
            marketId: vendorData.market_id || '',
            marketLocationDetails: vendorData.market_location_details || '',
            businessLat: vendorData.business_lat || null,
            businessLng: vendorData.business_lng || null,
            cacNumber: vendorData.cac_number || '',
            cacCertificateUrl: vendorData.cac_certificate_url || '',
            proofOfAddressUrl: vendorData.proof_of_address_url || '',
            avatarUrl: vendorData.avatar_url || '',
          });

          if (vendorData.market_id) {
            const market = marketsData?.find((m) => m.id === vendorData.market_id);
            if (market) setSelectedMarket(market);
          }
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      if (!user) throw new Error('User not authenticated');

      const vendorPayload = {
        user_id: user.uid,
        business_name: formData.businessName,
        business_description: formData.businessDescription,
        business_address: formData.businessAddress,
        business_phone: formData.businessPhone,
        market_id: formData.marketId || null,
        market_location_details: formData.marketLocationDetails || null,
        business_lat: formData.businessLat,
        business_lng: formData.businessLng,
        avatar_url: formData.avatarUrl,
        cac_certificate_url: formData.cacCertificateUrl,
        proof_of_address_url: formData.proofOfAddressUrl,
        // No CA number update here for now unless added to form input
        updated_at: Timestamp.now(),
      };

      // Check if vendor exists
      const exists = await FirestoreService.documentExists(COLLECTIONS.VENDORS, user.uid);

      if (exists) {
        await FirestoreService.updateDocument(COLLECTIONS.VENDORS, user.uid, vendorPayload);
      } else {
        await FirestoreService.setDocument(COLLECTIONS.VENDORS, user.uid, vendorPayload);
      }

      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleMarketSelect = (market: Market) => {
    setSelectedMarket(market);
    setFormData({ ...formData, marketId: market.id });
    setSearchQuery('');
  };

  const filteredMarkets = markets.filter(
    (market) =>
      market.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      market.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      market.state.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-3 md:px-6 py-4 md:py-6 space-y-4 md:space-y-6">
      <div className="mb-4 md:mb-8">
        <h1 className="font-heading font-bold text-lg md:text-3xl text-neutral-900 mb-1 md:mb-2">
          Business Profile
        </h1>
        <p className="font-sans text-xs md:text-base text-neutral-600">
          Update your business information and market location
        </p>
      </div>

      {error && (
        <div className="p-3 md:p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="font-sans text-xs md:text-sm text-red-600">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-3 md:p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="font-sans text-xs md:text-sm text-green-600">{success}</p>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4 md:space-y-6">
        <Card>
          <CardContent className="p-4 md:p-6 space-y-4 md:space-y-6">
            <div className="flex items-center gap-2 md:gap-3 pb-3 md:pb-4 border-b border-neutral-100">
              <Building2 className="w-4 h-4 md:w-6 md:h-6 text-primary-500" />
              <h2 className="font-heading font-semibold text-sm md:text-xl text-neutral-900">
                Business Information
              </h2>
            </div>

            <div>
              <label className="block font-sans font-medium text-xs md:text-sm text-neutral-700 mb-1 md:mb-2">
                Business Name *
              </label>
              <input
                type="text"
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                required
                className="w-full h-10 md:h-12 px-3 md:px-4 rounded-lg border border-neutral-200 font-sans text-sm md:text-base text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="e.g., Adire Crafts Nigeria"
              />
            </div>

            <div>
              <label className="block font-sans font-medium text-xs md:text-sm text-neutral-700 mb-1 md:mb-2">
                Business Description
              </label>
              <textarea
                value={formData.businessDescription}
                onChange={(e) =>
                  setFormData({ ...formData, businessDescription: e.target.value })
                }
                rows={3}
                className="w-full px-3 md:px-4 py-2 md:py-3 rounded-lg border border-neutral-200 font-sans text-sm md:text-base text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                placeholder="Describe your business and products..."
              />
            </div>

            <div>
              <label className="block font-sans font-medium text-xs md:text-sm text-neutral-700 mb-1 md:mb-2">
                <Phone className="w-3 h-3 md:w-4 md:h-4 inline mr-1 md:mr-2" />
                Business Phone
              </label>
              <input
                type="tel"
                value={formData.businessPhone}
                onChange={(e) => setFormData({ ...formData, businessPhone: e.target.value })}
                className="w-full h-10 md:h-12 px-3 md:px-4 rounded-lg border border-neutral-200 font-sans text-sm md:text-base text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="+234 800 000 0000"
              />
            </div>

            <div>
              <label className="block font-sans font-medium text-xs md:text-sm text-neutral-700 mb-1 md:mb-2">
                General Business Address
              </label>
              <div className="space-y-3">
                <input
                  type="text"
                  value={formData.businessAddress}
                  onChange={(e) => setFormData({ ...formData, businessAddress: e.target.value })}
                  className="w-full h-10 md:h-12 px-3 md:px-4 rounded-lg border border-neutral-200 font-sans text-sm md:text-base text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="e.g., Ikeja, Lagos"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowLocationPicker(!showLocationPicker)}
                  className="w-full"
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  {showLocationPicker ? 'Hide Map' : 'Pick Location on Map'}
                </Button>
                {showLocationPicker && (
                  <LocationPicker
                    initialLocation={
                      formData.businessLat && formData.businessLng
                        ? {
                          lat: formData.businessLat,
                          lng: formData.businessLng,
                          address: formData.businessAddress || '',
                        }
                        : undefined
                    }
                    onLocationSelect={(location) => {
                      setFormData({
                        ...formData,
                        businessAddress: location.address,
                        businessLat: location.lat,
                        businessLng: location.lng,
                      });
                    }}
                    placeholder="Search for your business location in Nigeria"
                  />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 md:p-6 space-y-4 md:space-y-6">
            <div className="flex items-center gap-2 md:gap-3 pb-3 md:pb-4 border-b border-neutral-100">
              <Building2 className="w-4 h-4 md:w-6 md:h-6 text-primary-500" />
              <h2 className="font-heading font-semibold text-sm md:text-xl text-neutral-900">
                Documents & Branding
              </h2>
            </div>

            <div>
              <label className="block font-sans font-medium text-xs md:text-sm text-neutral-700 mb-1 md:mb-2">
                Profile Picture / Logo
              </label>
              <div className="flex items-center gap-4">
                {formData.avatarUrl && (
                  <img src={formData.avatarUrl} alt="Avatar" className="w-16 h-16 rounded-full object-cover border border-neutral-200" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file && user) {
                      try {
                        setSaving(true);
                        const { FirebaseStorageService } = await import('../../services/firebaseStorage.service');
                        const result = await FirebaseStorageService.uploadFile(file, `vendors/${user.uid}/avatars/${Date.now()}_${file.name}`);
                        if (result.url) {
                          setFormData(prev => ({ ...prev, avatarUrl: result.url || '' }));
                        }
                      } catch (err) {
                        console.error(err);
                        setError('Failed to upload avatar');
                      } finally {
                        setSaving(false);
                      }
                    }
                  }}
                  className="block w-full text-sm text-neutral-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                />
              </div>
            </div>

            <div>
              <label className="block font-sans font-medium text-xs md:text-sm text-neutral-700 mb-1 md:mb-2">
                CAC Certificate (Optional)
              </label>
              {formData.cacCertificateUrl && (
                <p className="text-xs text-green-600 mb-2">Current file uploaded.</p>
              )}
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file && user) {
                    try {
                      setSaving(true);
                      const { FirebaseStorageService } = await import('../../services/firebaseStorage.service');
                      const result = await FirebaseStorageService.uploadFile(file, `vendors/${user.uid}/cac-certificates/${Date.now()}_${file.name}`);
                      if (result.url) {
                        setFormData(prev => ({ ...prev, cacCertificateUrl: result.url || '' }));
                      }
                    } catch (err) {
                      console.error(err);
                      setError('Failed to upload CAC certificate');
                    } finally {
                      setSaving(false);
                    }
                  }
                }}
                className="block w-full text-sm text-neutral-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
              />
              <p className="text-xs text-neutral-500 mt-1">Upload via PDF or Image to request Verified Badge.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 md:p-6 space-y-4 md:space-y-6">
            <div className="flex items-center gap-2 md:gap-3 pb-3 md:pb-4 border-b border-neutral-100">
              <MapPin className="w-4 h-4 md:w-6 md:h-6 text-primary-500" />
              <div className="flex-1">
                <h2 className="font-heading font-semibold text-sm md:text-xl text-neutral-900">
                  Market Location (Optional)
                </h2>
                <p className="font-sans text-xs md:text-sm text-neutral-600 mt-0.5 md:mt-1">
                  Help customers find you
                </p>
              </div>
            </div>

            <div>
              <label className="block font-sans font-medium text-xs md:text-sm text-neutral-700 mb-1 md:mb-2">
                Search for Your Market
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 md:h-12 px-3 md:px-4 rounded-lg border border-neutral-200 font-sans text-sm md:text-base text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Search market name, city, or state..."
              />

              {searchQuery && filteredMarkets.length > 0 && (
                <div className="mt-2 max-h-48 md:max-h-64 overflow-y-auto border border-neutral-200 rounded-lg bg-white shadow-lg">
                  {filteredMarkets.slice(0, 10).map((market) => (
                    <button
                      key={market.id}
                      type="button"
                      onClick={() => handleMarketSelect(market)}
                      className="w-full px-3 md:px-4 py-2 md:py-3 text-left hover:bg-neutral-50 transition-colors border-b border-neutral-100 last:border-b-0"
                    >
                      <div className="font-sans font-medium text-sm md:text-base text-neutral-900">{market.name}</div>
                      <div className="font-sans text-xs md:text-sm text-neutral-600">
                        {market.city}, {market.state}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedMarket && (
              <div className="p-3 md:p-4 bg-primary-50 border border-primary-200 rounded-lg">
                <div className="flex items-start justify-between gap-2 md:gap-4">
                  <div className="flex-1">
                    <p className="font-sans font-semibold text-sm md:text-base text-neutral-900">
                      {selectedMarket.name}
                    </p>
                    <p className="font-sans text-xs md:text-sm text-neutral-600">
                      {selectedMarket.city}, {selectedMarket.state}
                    </p>
                    {selectedMarket.description && (
                      <p className="font-sans text-xs md:text-sm text-neutral-600 mt-1 md:mt-2">
                        {selectedMarket.description}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMarket(null);
                      setFormData({ ...formData, marketId: '', marketLocationDetails: '' });
                    }}
                    className="font-sans text-xs md:text-sm text-primary-500 hover:text-primary-600 underline"
                  >
                    Remove
                  </button>
                </div>

                <div className="mt-3 md:mt-4">
                  <label className="block font-sans font-medium text-xs md:text-sm text-neutral-700 mb-1 md:mb-2">
                    Specific Location in Market
                  </label>
                  <input
                    type="text"
                    value={formData.marketLocationDetails}
                    onChange={(e) =>
                      setFormData({ ...formData, marketLocationDetails: e.target.value })
                    }
                    className="w-full h-10 md:h-12 px-3 md:px-4 rounded-lg border border-neutral-200 font-sans text-sm md:text-base text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="e.g., Shop 45, Block B"
                  />
                  <p className="font-sans text-xs text-neutral-500 mt-1">
                    Help customers locate your shop
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-2 md:gap-4">
          <Button
            type="submit"
            disabled={saving}
            className="flex-1 h-10 md:h-12 bg-primary-500 hover:bg-primary-600 text-white font-sans font-semibold text-sm md:text-base rounded-lg flex items-center justify-center gap-1 md:gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 md:w-5 md:h-5" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};
