import React from 'react';
import { MapPin, Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { MARKET_LOCATIONS, type MarketLocation } from '../../data/marketLocations';
import { SUB_CATEGORY_TAGS } from '../../data/subCategoryTags';
import { Badge } from '../ui/badge';
import { FormSkeleton } from '../ui/loading-skeleton';

interface VendorProfile {
  businessName: string;
  businessDescription: string;
  businessAddress: string;
  businessPhone: string;
  marketLocation: string;
  subCategoryTags: string[];
  businessCategory?: string;
  cacNumber?: string;
  proofOfAddressUrl?: string;
  bankAccountDetails?: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
}

interface FormErrors {
  businessName?: string;
  businessDescription?: string;
  businessAddress?: string;
  businessPhone?: string;
  marketLocation?: string;
  businessCategory?: string;
  subCategoryTags?: string;
  cacCertificate?: string;
  proofOfAddress?: string;
  bankAccountDetails?: {
    bankName?: string;
    accountNumber?: string;
    accountName?: string;
  };
}

// Constants
const MAX_SUB_CATEGORY_TAGS = 3;
const ALLOWED_FILE_TYPES = ['.pdf', '.jpg', '.jpeg', '.png'];

interface BusinessInfoStepProps {
  profileData: VendorProfile;
  formErrors: FormErrors;
  marketSuggestions: MarketLocation[];
  showMarketSuggestions: boolean;
  availableTags: any[];
  loading?: boolean;
  onProfileDataChange: (field: keyof VendorProfile, value: any) => void;
  onMarketLocationSearch: (query: string) => void;
  onSelectMarketLocation: (location: MarketLocation) => void;
  onToggleSubCategoryTag: (tagId: string) => void;
  onAddCustomSubCategory: (customTag: string) => void;
}

export const BusinessInfoStep: React.FC<BusinessInfoStepProps> = ({
  profileData,
  formErrors,
  marketSuggestions,
  showMarketSuggestions,
  availableTags,
  loading = false,
  onProfileDataChange,
  onMarketLocationSearch,
  onSelectMarketLocation,
  onToggleSubCategoryTag
}) => {
  if (loading) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Business Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FormSkeleton fields={5} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          Business Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block font-sans font-medium text-sm text-neutral-700 mb-2">
            Business Name *
          </label>
          <input
            type="text"
            value={profileData.businessName}
            onChange={(e) => onProfileDataChange('businessName', e.target.value)}
            placeholder="Enter your business name"
            className={`w-full h-10 px-3 rounded-lg border font-sans text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${
              formErrors.businessName ? 'border-red-500' : 'border-neutral-200'
            }`}
            aria-describedby={formErrors.businessName ? "business-name-error" : undefined}
            aria-invalid={!!formErrors.businessName}
          />
          {formErrors.businessName && (
            <p id="business-name-error" className="text-red-500 text-xs mt-1" role="alert">
              {formErrors.businessName}
            </p>
          )}
        </div>

        <div>
          <label className="block font-sans font-medium text-sm text-neutral-700 mb-2">
            Business Description *
          </label>
          <textarea
            value={profileData.businessDescription}
            onChange={(e) => onProfileDataChange('businessDescription', e.target.value)}
            placeholder="Describe your business..."
            rows={3}
            className={`w-full px-3 py-2 rounded-lg border font-sans text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${
              formErrors.businessDescription ? 'border-red-500' : 'border-neutral-200'
            }`}
            aria-describedby={formErrors.businessDescription ? "business-description-error" : undefined}
            aria-invalid={!!formErrors.businessDescription}
          />
          {formErrors.businessDescription && (
            <p id="business-description-error" className="text-red-500 text-xs mt-1" role="alert">
              {formErrors.businessDescription}
            </p>
          )}
        </div>

        <div>
          <label className="block font-sans font-medium text-sm text-neutral-700 mb-2">
            Business Category *
          </label>
          <select
            value={profileData.businessCategory || ''}
            onChange={(e) => onProfileDataChange('businessCategory', e.target.value)}
            className={`w-full h-10 px-3 rounded-lg border font-sans text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${
              formErrors.businessCategory ? 'border-red-500' : 'border-neutral-200'
            }`}
            aria-describedby={formErrors.businessCategory ? "business-category-error" : undefined}
            aria-invalid={!!formErrors.businessCategory}
          >
            <option value="">Select your business category</option>
            <option value="Fashion">Fashion & Clothing</option>
            <option value="Electronics">Electronics</option>
            <option value="Food">Food & Groceries</option>
            <option value="Home & Garden">Home & Garden</option>
            <option value="Books">Books & Education</option>
            <option value="Art">Art & Crafts</option>
            <option value="Health & Beauty">Health & Beauty</option>
            <option value="Sports & Recreation">Sports & Recreation</option>
            <option value="Automotive">Automotive</option>
            <option value="Other">Other</option>
          </select>
          {formErrors.businessCategory && (
            <p id="business-category-error" className="text-red-500 text-xs mt-1" role="alert">
              {formErrors.businessCategory}
            </p>
          )}
        </div>

        <div>
          <label className="block font-sans font-medium text-sm text-neutral-700 mb-2">
            Business Address *
          </label>
          <input
            type="text"
            value={profileData.businessAddress}
            onChange={(e) => onProfileDataChange('businessAddress', e.target.value)}
            placeholder="Enter your business address"
            className={`w-full h-10 px-3 rounded-lg border font-sans text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${
              formErrors.businessAddress ? 'border-red-500' : 'border-neutral-200'
            }`}
            aria-describedby={formErrors.businessAddress ? "business-address-error" : undefined}
            aria-invalid={!!formErrors.businessAddress}
          />
          {formErrors.businessAddress && (
            <p id="business-address-error" className="text-red-500 text-xs mt-1" role="alert">
              {formErrors.businessAddress}
            </p>
          )}
        </div>

        <div>
          <label className="block font-sans font-medium text-sm text-neutral-700 mb-2">
            Business Phone *
          </label>
          <input
            type="tel"
            value={profileData.businessPhone}
            onChange={(e) => onProfileDataChange('businessPhone', e.target.value)}
            placeholder="+234 xxx xxx xxxx"
            className={`w-full h-10 px-3 rounded-lg border font-sans text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${
              formErrors.businessPhone ? 'border-red-500' : 'border-neutral-200'
            }`}
            aria-describedby={formErrors.businessPhone ? "business-phone-error" : undefined}
            aria-invalid={!!formErrors.businessPhone}
          />
          {formErrors.businessPhone && (
            <p id="business-phone-error" className="text-red-500 text-xs mt-1" role="alert">
              {formErrors.businessPhone}
            </p>
          )}
        </div>

        <div className="relative">
          <label className="block font-sans font-medium text-sm text-neutral-700 mb-2">
            Market Location *
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              value={profileData.marketLocation}
              onChange={(e) => {
                onProfileDataChange('marketLocation', e.target.value);
                onMarketLocationSearch(e.target.value);
              }}
              placeholder="Select your market location"
              className={`w-full h-10 pl-10 pr-3 rounded-lg border font-sans text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                formErrors.marketLocation ? 'border-red-500' : 'border-neutral-200'
              }`}
              aria-describedby={formErrors.marketLocation ? "market-location-error" : undefined}
              aria-invalid={!!formErrors.marketLocation}
            />
          </div>

          {formErrors.marketLocation && (
            <p id="market-location-error" className="text-red-500 text-xs mt-1" role="alert">
              {formErrors.marketLocation}
            </p>
          )}

          {showMarketSuggestions && marketSuggestions.length > 0 && (
            <div
              className="absolute top-full left-0 right-0 z-10 bg-white border border-neutral-200 rounded-lg shadow-lg max-h-48 overflow-y-auto"
              role="listbox"
              aria-label="Market location suggestions"
            >
              {marketSuggestions.map((location) => (
                <button
                  key={location.id}
                  onClick={() => onSelectMarketLocation(location)}
                  className="w-full px-3 py-2 text-left hover:bg-neutral-50 font-sans text-sm text-neutral-700 border-b border-neutral-100 last:border-b-0"
                  role="option"
                  aria-selected={profileData.marketLocation === location.name}
                >
                  <div className="font-semibold">{location.name}</div>
                  <div className="text-xs text-neutral-500">{location.region}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block font-sans font-medium text-sm text-neutral-700 mb-2">
            Sub-Category Tags (Max {MAX_SUB_CATEGORY_TAGS}) *
          </label>
          <div className="flex flex-wrap gap-2 mb-3">
            {profileData.subCategoryTags.map((tagId: string) => {
              const tag = SUB_CATEGORY_TAGS.find(t => t.id === tagId);
              return tag ? (
                <Badge key={tagId} className="bg-primary-100 text-primary-700">
                  {tag.name}
                  <button
                    onClick={() => onToggleSubCategoryTag(tagId)}
                    className="ml-1 text-primary-500 hover:text-primary-700"
                    aria-label={`Remove ${tag.name} tag`}
                  >
                    ×
                  </button>
                </Badge>
              ) : null;
            })}
          </div>

          {formErrors.subCategoryTags && (
            <p className="text-red-500 text-xs mb-3" role="alert">
              {formErrors.subCategoryTags}
            </p>
          )}

          <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
            {availableTags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => onToggleSubCategoryTag(tag.id)}
                disabled={profileData.subCategoryTags.length >= MAX_SUB_CATEGORY_TAGS && !profileData.subCategoryTags.includes(tag.id)}
                className={`p-2 text-left rounded border font-sans text-xs ${
                  profileData.subCategoryTags.includes(tag.id)
                    ? 'bg-primary-100 border-primary-300 text-primary-700'
                    : profileData.subCategoryTags.length >= MAX_SUB_CATEGORY_TAGS
                    ? 'bg-neutral-50 border-neutral-200 text-neutral-400 cursor-not-allowed'
                    : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                }`}
                aria-pressed={profileData.subCategoryTags.includes(tag.id)}
                aria-label={`${profileData.subCategoryTags.includes(tag.id) ? 'Remove' : 'Add'} ${tag.name} tag`}
              >
                {tag.name}
              </button>
            ))}
          </div>

          {/* Custom subcategory input */}
          <div className="mt-3 pt-3 border-t border-neutral-200">
            <label className="block font-sans font-medium text-sm text-neutral-700 mb-2">
              Add Custom Subcategory (Optional)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter custom subcategory"
                className="flex-1 h-10 px-3 rounded-lg border border-neutral-200 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const input = e.target as HTMLInputElement;
                    const customTag = input.value.trim();
                    if (customTag && !profileData.subCategoryTags.includes(customTag)) {
                      onToggleSubCategoryTag(customTag);
                      onAddCustomSubCategory(customTag);
                      input.value = '';
                    }
                  }
                }}
              />
              <button
                type="button"
                onClick={() => {
                  const input = document.querySelector('input[placeholder="Enter custom subcategory"]') as HTMLInputElement;
                  const customTag = input?.value.trim();
                  if (customTag && !profileData.subCategoryTags.includes(customTag)) {
                    onToggleSubCategoryTag(customTag);
                    onAddCustomSubCategory(customTag);
                    input.value = '';
                  }
                }}
                className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 font-sans text-sm"
              >
                Add
              </button>
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              Custom subcategories will be added to the available list for future use
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};