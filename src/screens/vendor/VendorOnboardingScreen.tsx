import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { googleMapsService } from '../../services/googleMapsService';
import { subscriptionService, SUBSCRIPTION_TIERS } from '../../services/subscriptionService';
import { MARKET_LOCATIONS, type MarketLocation } from '../../data/marketLocations';
import { SUB_CATEGORY_TAGS, type SubCategoryTag } from '../../data/subCategoryTags';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
  Upload,
  MapPin,
  Tag,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Star,
  Crown,
  Zap,
  Building2,
  FileText,
  Banknote
} from 'lucide-react';

interface VendorProfile {
  businessName: string;
  businessDescription: string;
  businessAddress: string;
  businessPhone: string;
  marketLocation: string;
  subCategoryTags: string[];
  cacNumber?: string;
  proofOfAddressUrl?: string;
  bankAccountDetails?: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
}

const VendorOnboardingScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [marketSuggestions, setMarketSuggestions] = useState<MarketLocation[]>([]);
  const [showMarketSuggestions, setShowMarketSuggestions] = useState(false);
  const [availableTags, setAvailableTags] = useState<SubCategoryTag[]>([]);
  const [selectedSubscription, setSelectedSubscription] = useState<string>('free');

  const [profileData, setProfileData] = useState<VendorProfile>({
    businessName: '',
    businessDescription: '',
    businessAddress: '',
    businessPhone: '',
    marketLocation: '',
    subCategoryTags: []
  });

  const [documents, setDocuments] = useState({
    cacCertificate: null as File | null,
    proofOfAddress: null as File | null
  });

  useEffect(() => {
    // Load available sub-category tags based on common categories
    setAvailableTags(SUB_CATEGORY_TAGS.slice(0, 20)); // Show first 20 for initial load
  }, []);

  const handleMarketLocationSearch = async (query: string) => {
    if (query.length > 2) {
      const suggestions = MARKET_LOCATIONS.filter(location =>
        location.name.toLowerCase().includes(query.toLowerCase()) ||
        location.region.toLowerCase().includes(query.toLowerCase())
      );
      setMarketSuggestions(suggestions);
      setShowMarketSuggestions(true);
    } else {
      setMarketSuggestions([]);
      setShowMarketSuggestions(false);
    }
  };

  const selectMarketLocation = (location: MarketLocation) => {
    setProfileData(prev => ({ ...prev, marketLocation: location.name }));
    setShowMarketSuggestions(false);
  };

  const toggleSubCategoryTag = (tagId: string) => {
    setProfileData(prev => {
      const currentTags = prev.subCategoryTags;
      if (currentTags.includes(tagId)) {
        return { ...prev, subCategoryTags: currentTags.filter(id => id !== tagId) };
      } else if (currentTags.length < 3) {
        return { ...prev, subCategoryTags: [...currentTags, tagId] };
      }
      return prev;
    });
  };

  const handleFileUpload = (field: 'cacCertificate' | 'proofOfAddress', file: File) => {
    setDocuments(prev => ({ ...prev, [field]: file }));
  };

  const uploadFile = async (file: File, path: string): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${path}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('vendor-documents')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('vendor-documents')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const calculateVerificationBadge = (): string => {
    let badge = 'none';

    if (documents.cacCertificate) badge = 'basic';
    if (documents.proofOfAddress) badge = 'verified';
    if (profileData.bankAccountDetails?.bankName) badge = 'premium';

    return badge;
  };

  const handleCompleteOnboarding = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Upload documents if provided
      let cacUrl, proofOfAddressUrl;
      if (documents.cacCertificate) {
        cacUrl = await uploadFile(documents.cacCertificate, 'cac-certificates');
      }
      if (documents.proofOfAddress) {
        proofOfAddressUrl = await uploadFile(documents.proofOfAddress, 'proof-of-address');
      }

      // Create vendor profile
      const vendorData = {
        user_id: user.id,
        business_name: profileData.businessName,
        business_description: profileData.businessDescription,
        business_address: profileData.businessAddress,
        business_phone: profileData.businessPhone,
        market_location: profileData.marketLocation,
        sub_category_tags: profileData.subCategoryTags,
        cac_number: profileData.cacNumber || null,
        proof_of_address_url: proofOfAddressUrl || null,
        bank_account_details: profileData.bankAccountDetails ? JSON.stringify(profileData.bankAccountDetails) : null,
        verification_badge: calculateVerificationBadge(),
        subscription_plan: selectedSubscription as any,
        subscription_status: selectedSubscription === 'free' ? 'active' : 'inactive',
        subscription_start_date: selectedSubscription === 'free' ? new Date().toISOString() : null,
        subscription_end_date: selectedSubscription === 'free' ? null : null, // Will be set after payment
        is_active: true
      };

      const { error } = await supabase
        .from('vendors')
        .insert(vendorData);

      if (error) throw error;

      // Navigate to subscription selection if not free
      if (selectedSubscription === 'free') {
        navigate('/vendor/dashboard');
      } else {
        navigate('/vendor/subscription/payment', {
          state: {
            plan: selectedSubscription,
            vendorData
          }
        });
      }
    } catch (error) {
      console.error('Error completing onboarding:', error);
      alert('Error completing onboarding. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {[1, 2, 3, 4].map((step) => (
        <div key={step} className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
            step <= currentStep
              ? 'bg-primary-500 text-white'
              : 'bg-neutral-200 text-neutral-600'
          }`}>
            {step}
          </div>
          {step < 4 && (
            <div className={`w-12 h-0.5 ${
              step < currentStep ? 'bg-primary-500' : 'bg-neutral-200'
            }`} />
          )}
        </div>
      ))}
    </div>
  );

  const renderBusinessInfoStep = () => (
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
            onChange={(e) => setProfileData(prev => ({ ...prev, businessName: e.target.value }))}
            placeholder="Enter your business name"
            className="w-full h-10 px-3 rounded-lg border border-neutral-200 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="block font-sans font-medium text-sm text-neutral-700 mb-2">
            Business Description *
          </label>
          <textarea
            value={profileData.businessDescription}
            onChange={(e) => setProfileData(prev => ({ ...prev, businessDescription: e.target.value }))}
            placeholder="Describe your business..."
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-neutral-200 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="block font-sans font-medium text-sm text-neutral-700 mb-2">
            Business Address *
          </label>
          <input
            type="text"
            value={profileData.businessAddress}
            onChange={(e) => setProfileData(prev => ({ ...prev, businessAddress: e.target.value }))}
            placeholder="Enter your business address"
            className="w-full h-10 px-3 rounded-lg border border-neutral-200 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="block font-sans font-medium text-sm text-neutral-700 mb-2">
            Business Phone *
          </label>
          <input
            type="tel"
            value={profileData.businessPhone}
            onChange={(e) => setProfileData(prev => ({ ...prev, businessPhone: e.target.value }))}
            placeholder="+234 xxx xxx xxxx"
            className="w-full h-10 px-3 rounded-lg border border-neutral-200 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
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
                setProfileData(prev => ({ ...prev, marketLocation: e.target.value }));
                handleMarketLocationSearch(e.target.value);
              }}
              placeholder="Select your market location"
              className="w-full h-10 pl-10 pr-3 rounded-lg border border-neutral-200 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {showMarketSuggestions && marketSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-10 bg-white border border-neutral-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {marketSuggestions.map((location) => (
                <button
                  key={location.id}
                  onClick={() => selectMarketLocation(location)}
                  className="w-full px-3 py-2 text-left hover:bg-neutral-50 font-sans text-sm text-neutral-700 border-b border-neutral-100 last:border-b-0"
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
            Sub-Category Tags (Max 3) *
          </label>
          <div className="flex flex-wrap gap-2 mb-3">
            {profileData.subCategoryTags.map((tagId) => {
              const tag = SUB_CATEGORY_TAGS.find(t => t.id === tagId);
              return tag ? (
                <Badge key={tagId} className="bg-primary-100 text-primary-700">
                  {tag.name}
                  <button
                    onClick={() => toggleSubCategoryTag(tagId)}
                    className="ml-1 text-primary-500 hover:text-primary-700"
                  >
                    ×
                  </button>
                </Badge>
              ) : null;
            })}
          </div>

          <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
            {availableTags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => toggleSubCategoryTag(tag.id)}
                disabled={profileData.subCategoryTags.length >= 3 && !profileData.subCategoryTags.includes(tag.id)}
                className={`p-2 text-left rounded border font-sans text-xs ${
                  profileData.subCategoryTags.includes(tag.id)
                    ? 'bg-primary-100 border-primary-300 text-primary-700'
                    : profileData.subCategoryTags.length >= 3
                    ? 'bg-neutral-50 border-neutral-200 text-neutral-400 cursor-not-allowed'
                    : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                {tag.name}
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderDocumentsStep = () => (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Verification Documents (Optional)
        </CardTitle>
        <p className="text-sm text-neutral-600">
          Upload documents to get verification badges and build trust with customers
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`p-4 rounded-lg border-2 ${
            documents.cacCertificate ? 'border-green-300 bg-green-50' : 'border-neutral-200'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-neutral-600" />
              <span className="font-semibold text-sm">CAC Certificate</span>
            </div>
            <p className="text-xs text-neutral-600 mb-3">
              Business registration certificate
            </p>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => e.target.files?.[0] && handleFileUpload('cacCertificate', e.target.files[0])}
              className="hidden"
              id="cac-upload"
            />
            <label
              htmlFor="cac-upload"
              className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-neutral-200 rounded text-xs cursor-pointer hover:bg-neutral-50"
            >
              <Upload className="w-3 h-3" />
              {documents.cacCertificate ? 'Change File' : 'Upload'}
            </label>
            {documents.cacCertificate && (
              <p className="text-xs text-green-600 mt-1">{documents.cacCertificate.name}</p>
            )}
          </div>

          <div className={`p-4 rounded-lg border-2 ${
            documents.proofOfAddress ? 'border-green-300 bg-green-50' : 'border-neutral-200'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="w-4 h-4 text-neutral-600" />
              <span className="font-semibold text-sm">Proof of Address</span>
            </div>
            <p className="text-xs text-neutral-600 mb-3">
              Utility bill or bank statement
            </p>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => e.target.files?.[0] && handleFileUpload('proofOfAddress', e.target.files[0])}
              className="hidden"
              id="address-upload"
            />
            <label
              htmlFor="address-upload"
              className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-neutral-200 rounded text-xs cursor-pointer hover:bg-neutral-50"
            >
              <Upload className="w-3 h-3" />
              {documents.proofOfAddress ? 'Change File' : 'Upload'}
            </label>
            {documents.proofOfAddress && (
              <p className="text-xs text-green-600 mt-1">{documents.proofOfAddress.name}</p>
            )}
          </div>

          <div className={`p-4 rounded-lg border-2 ${
            profileData.bankAccountDetails?.bankName ? 'border-green-300 bg-green-50' : 'border-neutral-200'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <Banknote className="w-4 h-4 text-neutral-600" />
              <span className="font-semibold text-sm">Bank Details</span>
            </div>
            <p className="text-xs text-neutral-600 mb-3">
              For payout processing
            </p>
            <button
              onClick={() => setCurrentStep(3)}
              className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-neutral-200 rounded text-xs hover:bg-neutral-50"
            >
              <CreditCard className="w-3 h-3" />
              {profileData.bankAccountDetails?.bankName ? 'Edit Details' : 'Add Details'}
            </button>
          </div>
        </div>

        <div className="bg-neutral-50 p-4 rounded-lg">
          <h4 className="font-semibold text-sm mb-2">Verification Badge Preview</h4>
          <div className="flex items-center gap-2">
            {calculateVerificationBadge() === 'none' && (
              <Badge className="bg-neutral-200 text-neutral-700">No Badge</Badge>
            )}
            {calculateVerificationBadge() === 'basic' && (
              <Badge className="bg-blue-100 text-blue-700">
                <CheckCircle className="w-3 h-3 mr-1" />
                Basic Verified
              </Badge>
            )}
            {calculateVerificationBadge() === 'verified' && (
              <Badge className="bg-green-100 text-green-700">
                <CheckCircle className="w-3 h-3 mr-1" />
                Verified
              </Badge>
            )}
            {calculateVerificationBadge() === 'premium' && (
              <Badge className="bg-purple-100 text-purple-700">
                <Crown className="w-3 h-3 mr-1" />
                Premium Verified
              </Badge>
            )}
          </div>
          <p className="text-xs text-neutral-600 mt-1">
            Upload documents to earn verification badges and build customer trust
          </p>
        </div>
      </CardContent>
    </Card>
  );

  const renderBankDetailsStep = () => (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Banknote className="w-5 h-5" />
          Bank Account Details (Optional)
        </CardTitle>
        <p className="text-sm text-neutral-600">
          Add your bank details for seamless payouts
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block font-sans font-medium text-sm text-neutral-700 mb-2">
            Bank Name
          </label>
          <input
            type="text"
            value={profileData.bankAccountDetails?.bankName || ''}
            onChange={(e) => setProfileData(prev => ({
              ...prev,
              bankAccountDetails: {
                ...prev.bankAccountDetails!,
                bankName: e.target.value
              }
            }))}
            placeholder="e.g., Access Bank, GTBank"
            className="w-full h-10 px-3 rounded-lg border border-neutral-200 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="block font-sans font-medium text-sm text-neutral-700 mb-2">
            Account Number
          </label>
          <input
            type="text"
            value={profileData.bankAccountDetails?.accountNumber || ''}
            onChange={(e) => setProfileData(prev => ({
              ...prev,
              bankAccountDetails: {
                ...prev.bankAccountDetails!,
                accountNumber: e.target.value
              }
            }))}
            placeholder="10-digit account number"
            className="w-full h-10 px-3 rounded-lg border border-neutral-200 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="block font-sans font-medium text-sm text-neutral-700 mb-2">
            Account Name
          </label>
          <input
            type="text"
            value={profileData.bankAccountDetails?.accountName || ''}
            onChange={(e) => setProfileData(prev => ({
              ...prev,
              bankAccountDetails: {
                ...prev.bankAccountDetails!,
                accountName: e.target.value
              }
            }))}
            placeholder="Account holder name"
            className="w-full h-10 px-3 rounded-lg border border-neutral-200 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </CardContent>
    </Card>
  );

  const renderSubscriptionStep = () => (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="w-5 h-5" />
          Choose Your Plan
        </CardTitle>
        <p className="text-sm text-neutral-600">
          Select a subscription plan to start selling. New vendors get 1 month free!
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {SUBSCRIPTION_TIERS.map((tier) => (
            <div
              key={tier.plan}
              onClick={() => setSelectedSubscription(tier.plan)}
              className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all ${
                selectedSubscription === tier.plan
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-neutral-200 hover:border-neutral-300'
              }`}
            >
              {tier.plan === 'free' && (
                <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-green-500 text-white">
                  Free for New Vendors
                </Badge>
              )}

              <div className="text-center mb-4">
                <h3 className="font-bold text-lg">{tier.name}</h3>
                <div className="text-2xl font-bold text-primary-600">
                  ₦{tier.price.toLocaleString()}
                </div>
                <div className="text-sm text-neutral-600">per {tier.duration} month{tier.duration > 1 ? 's' : ''}</div>
              </div>

              <ul className="space-y-1 text-sm">
                {tier.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-900 mb-1">Free Trial for New Vendors</h4>
              <p className="text-sm text-blue-700">
                All new vendors receive 1 month free access to get started. You can upgrade or continue with the free plan anytime.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 1:
        return profileData.businessName && profileData.businessDescription &&
               profileData.businessAddress && profileData.businessPhone &&
               profileData.marketLocation && profileData.subCategoryTags.length > 0;
      case 2:
      case 3:
        return true; // Optional steps
      case 4:
        return selectedSubscription !== '';
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">
            Complete Your Vendor Profile
          </h1>
          <p className="text-neutral-600">
            Set up your business profile to start selling on NIMEX
          </p>
        </div>

        {renderStepIndicator()}

        {currentStep === 1 && renderBusinessInfoStep()}
        {currentStep === 2 && renderDocumentsStep()}
        {currentStep === 3 && renderBankDetailsStep()}
        {currentStep === 4 && renderSubscriptionStep()}

        <div className="flex justify-between items-center mt-8 max-w-2xl mx-auto">
          <Button
            onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
            disabled={currentStep === 1}
            variant="outline"
          >
            Previous
          </Button>

          <div className="text-sm text-neutral-600">
            Step {currentStep} of 4
          </div>

          {currentStep < 4 ? (
            <Button
              onClick={() => setCurrentStep(prev => prev + 1)}
              disabled={!canProceedToNextStep()}
            >
              Next
            </Button>
          ) : (
            <Button
              onClick={handleCompleteOnboarding}
              disabled={loading || !canProceedToNextStep()}
              className="bg-primary-500 hover:bg-primary-600 text-white"
            >
              {loading ? 'Setting up...' : 'Complete Setup'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VendorOnboardingScreen;