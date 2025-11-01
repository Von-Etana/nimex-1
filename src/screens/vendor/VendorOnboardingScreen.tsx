import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { subscriptionService } from '../../services/subscriptionService';
import { MARKET_LOCATIONS, type MarketLocation } from '../../data/marketLocations';
import { SUB_CATEGORY_TAGS, type SubCategoryTag } from '../../data/subCategoryTags';
import { Button } from '../../components/ui/button';
import { NotificationToast } from '../../components/ui/notification-toast';
import { BusinessInfoStep } from '../../components/onboarding/BusinessInfoStep';
import { DocumentsStep } from '../../components/onboarding/DocumentsStep';
import { BankDetailsStep } from '../../components/onboarding/BankDetailsStep';
import { SubscriptionStep } from '../../components/onboarding/SubscriptionStep';

// Constants
const MAX_SUB_CATEGORY_TAGS = 3;
const INITIAL_TAG_DISPLAY_COUNT = 20;
const MAX_FILE_SIZE_MB = 10;
const ALLOWED_FILE_TYPES = ['.pdf', '.jpg', '.jpeg', '.png'];

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

interface FormErrors {
  businessName?: string;
  businessDescription?: string;
  businessAddress?: string;
  businessPhone?: string;
  marketLocation?: string;
  subCategoryTags?: string;
  cacCertificate?: string;
  proofOfAddress?: string;
  bankAccountDetails?: {
    bankName?: string;
    accountNumber?: string;
    accountName?: string;
  };
}

interface NotificationState {
  type: 'success' | 'error' | 'info';
  message: string;
  visible: boolean;
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
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [notification, setNotification] = useState<NotificationState>({ type: 'info', message: '', visible: false });
  const [uploadingFiles, setUploadingFiles] = useState<{ [key: string]: boolean }>({});

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
    setAvailableTags(SUB_CATEGORY_TAGS.slice(0, INITIAL_TAG_DISPLAY_COUNT));

    // Cleanup function for event listeners
    return () => {
      // Any cleanup logic for market suggestions dropdown
      setShowMarketSuggestions(false);
    };
  }, []);

  // Notification helper
  const showNotification = useCallback((type: NotificationState['type'], message: string) => {
    setNotification({ type, message, visible: true });
    setTimeout(() => setNotification(prev => ({ ...prev, visible: false })), 5000);
  }, []);

  // Form validation
  const validateStep = useCallback((step: number): boolean => {
    const errors: FormErrors = {};

    if (step === 1) {
      if (!profileData.businessName.trim()) {
        errors.businessName = 'Business name is required';
      }
      if (!profileData.businessDescription.trim()) {
        errors.businessDescription = 'Business description is required';
      }
      if (!profileData.businessAddress.trim()) {
        errors.businessAddress = 'Business address is required';
      }
      if (!profileData.businessPhone.trim()) {
        errors.businessPhone = 'Business phone is required';
      } else if (!/^\+?[\d\s-()]+$/.test(profileData.businessPhone)) {
        errors.businessPhone = 'Please enter a valid phone number';
      }
      if (!profileData.marketLocation.trim()) {
        errors.marketLocation = 'Market location is required';
      }
      if (profileData.subCategoryTags.length === 0) {
        errors.subCategoryTags = 'Please select at least one sub-category tag';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [profileData]);

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

  const toggleSubCategoryTag = useCallback((tagId: string) => {
    setProfileData(prev => {
      const currentTags = prev.subCategoryTags;
      if (currentTags.includes(tagId)) {
        return { ...prev, subCategoryTags: currentTags.filter(id => id !== tagId) };
      } else if (currentTags.length < MAX_SUB_CATEGORY_TAGS) {
        return { ...prev, subCategoryTags: [...currentTags, tagId] };
      }
      return prev;
    });
  }, []);

  const handleFileUpload = useCallback((field: 'cacCertificate' | 'proofOfAddress', file: File) => {
    // Validate file size
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      showNotification('error', `File size must be less than ${MAX_FILE_SIZE_MB}MB`);
      return;
    }

    // Validate file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_FILE_TYPES.includes(fileExtension)) {
      showNotification('error', `File type not allowed. Allowed types: ${ALLOWED_FILE_TYPES.join(', ')}`);
      return;
    }

    setDocuments(prev => ({ ...prev, [field]: file }));
  }, [showNotification]);

  const uploadFile = useCallback(async (file: File, path: string): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${path}/${fileName}`;

    setUploadingFiles(prev => ({ ...prev, [path]: true }));

    try {
      const { error: uploadError } = await supabase.storage
        .from('vendor-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('vendor-documents')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } finally {
      setUploadingFiles(prev => ({ ...prev, [path]: false }));
    }
  }, []);

  const calculateVerificationBadge = (): string => {
    let badge = 'none';

    if (documents.cacCertificate) badge = 'basic';
    if (documents.proofOfAddress) badge = 'verified';
    if (profileData.bankAccountDetails?.bankName) badge = 'premium';

    return badge;
  };

  const handleCompleteOnboarding = async () => {
    if (!user || !profile) return;

    // Validate current step before proceeding
    if (!validateStep(currentStep)) {
      showNotification('error', 'Please fix the errors before proceeding');
      return;
    }

    setLoading(true);
    try {
      // Upload documents in parallel for better performance
      const uploadPromises: Promise<string | undefined>[] = [];

      if (documents.cacCertificate) {
        uploadPromises.push(uploadFile(documents.cacCertificate, 'cac-certificates'));
      } else {
        uploadPromises.push(Promise.resolve(undefined));
      }

      if (documents.proofOfAddress) {
        uploadPromises.push(uploadFile(documents.proofOfAddress, 'proof-of-address'));
      } else {
        uploadPromises.push(Promise.resolve(undefined));
      }

      const [cacUrl, proofOfAddressUrl] = await Promise.allSettled(uploadPromises).then(results =>
        results.map(result => result.status === 'fulfilled' ? result.value : undefined)
      );

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

      const { data: insertedVendor, error } = await supabase
        .from('vendors')
        .insert(vendorData)
        .select('id')
        .single();

      if (error) throw error;

      const vendorId = (insertedVendor as any)?.id;
      if (!vendorId) throw new Error('Failed to create vendor record');

      // Navigate to subscription selection if not free
      if (selectedSubscription === 'free') {
        navigate('/vendor/dashboard');
      } else {
        // Initialize payment with Paystack
        const { paystackService } = await import('../../services/paystackService');
        const paymentResult = await paystackService.initializeSubscriptionPayment(
          profile.email,
          selectedSubscription,
          vendorId
        );

        if (paymentResult.success && paymentResult.data) {
          // Open payment modal
          await paystackService.loadPaystackScript();
          paystackService.openPaymentModal(
            profile.email,
            subscriptionService.getTierByPlan(selectedSubscription as any)?.price || 0,
            paymentResult.data.reference,
            async (reference) => {
              // Verify payment and update subscription
              const verification = await paystackService.verifySubscriptionPayment(reference);
              if (verification.success) {
                navigate('/vendor/dashboard');
              } else {
                showNotification('error', 'Payment verification failed. Please contact support.');
              }
            },
            () => {
              // Payment cancelled
              console.log('Payment cancelled');
            }
          );
        } else {
          showNotification('error', 'Failed to initialize payment. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error completing onboarding:', error);
      showNotification('error', 'Error completing onboarding. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8" role="progressbar" aria-valuenow={currentStep} aria-valuemin={1} aria-valuemax={4}>
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


  const canProceedToNextStep = useCallback(() => {
    return validateStep(currentStep);
  }, [currentStep, validateStep]);

  return (
    <>
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

          {currentStep === 1 && (
            <BusinessInfoStep
              profileData={profileData}
              formErrors={formErrors}
              marketSuggestions={marketSuggestions}
              showMarketSuggestions={showMarketSuggestions}
              availableTags={availableTags}
              onProfileDataChange={(field, value) => setProfileData(prev => ({ ...prev, [field]: value }))}
              onMarketLocationSearch={handleMarketLocationSearch}
              onSelectMarketLocation={selectMarketLocation}
              onToggleSubCategoryTag={toggleSubCategoryTag}
            />
          )}
          {currentStep === 2 && (
            <DocumentsStep
              documents={documents}
              profileData={profileData}
              uploadingFiles={uploadingFiles}
              onFileUpload={handleFileUpload}
              onNextStep={() => setCurrentStep(3)}
            />
          )}
          {currentStep === 3 && (
            <BankDetailsStep
              bankAccountDetails={profileData.bankAccountDetails || { bankName: '', accountNumber: '', accountName: '' }}
              onBankDetailsChange={(field, value) => setProfileData(prev => ({
                ...prev,
                bankAccountDetails: {
                  ...prev.bankAccountDetails!,
                  [field]: value
                }
              }))}
            />
          )}
          {currentStep === 4 && (
            <SubscriptionStep
              selectedSubscription={selectedSubscription}
              onSubscriptionSelect={setSelectedSubscription}
            />
          )}

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
                onClick={() => {
                  if (validateStep(currentStep)) {
                    setCurrentStep(prev => prev + 1);
                  } else {
                    showNotification('error', 'Please fix the errors before proceeding');
                  }
                }}
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

      {/* Notification Toast */}
      <NotificationToast
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        onClose={() => setNotification(prev => ({ ...prev, visible: false }))}
      />
    </>
  );
};

export default VendorOnboardingScreen;