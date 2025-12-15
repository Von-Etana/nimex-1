import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FirestoreService } from '../../services/firestore.service';
import { FirebaseStorageService } from '../../services/firebaseStorage.service';
import { COLLECTIONS } from '../../lib/collections';
import { subscriptionService } from '../../services/subscriptionService';
import { referralService } from '../../services/referralService';
import { MARKET_LOCATIONS, type MarketLocation } from '../../data/marketLocations';
import { SUB_CATEGORY_TAGS, type SubCategoryTag } from '../../data/subCategoryTags';
import { Button } from '../../components/ui/button';
import { NotificationToast } from '../../components/ui/notification-toast';
import { BusinessInfoStep } from '../../components/onboarding/BusinessInfoStep';
import { DocumentsStep } from '../../components/onboarding/DocumentsStep';
import { BankDetailsStep } from '../../components/onboarding/BankDetailsStep';
import { SubscriptionStep } from '../../components/onboarding/SubscriptionStep';
import { Timestamp } from 'firebase/firestore';
import { getFriendlyErrorMessage } from '../../utils/errorHandling';

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
  avatarUrl?: string | null;
  bankAccountDetails?: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
  businessCategory?: string;
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

interface NotificationState {
  type: 'success' | 'error' | 'info';
  message: string;
  visible: boolean;
}

export const VendorOnboardingScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [searchParams] = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [referralData, setReferralData] = useState<{
    code: string;
    type: 'vendor' | 'marketer' | null;
    referrerId: string | null;
  }>({ code: '', type: null, referrerId: null });
  const [marketSuggestions, setMarketSuggestions] = useState<MarketLocation[]>([]);
  const [showMarketSuggestions, setShowMarketSuggestions] = useState(false);
  const [availableTags, setAvailableTags] = useState<SubCategoryTag[]>([]);
  const [selectedSubscription, setSelectedSubscription] = useState<string>('monthly');
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
    proofOfAddress: null as File | null,
    avatar: null as File | null
  });

  useEffect(() => {
    // Load available sub-category tags based on common categories
    setAvailableTags(SUB_CATEGORY_TAGS.slice(0, INITIAL_TAG_DISPLAY_COUNT));

    // Check for referral code in URL
    const refCode = searchParams.get('ref');
    if (refCode) {
      (async () => {
        try {
          const validation = await referralService.validateReferralCode(refCode);
          if (validation.valid && validation.referrerId) {
            setReferralData({
              code: refCode,
              type: validation.type,
              referrerId: validation.referrerId,
            });
          }
        } catch (error) {
          console.error('Error validating referral code:', error);
        }
      })();
    }

    // Handle browser back/forward navigation for mobile
    const handleBrowserNavigation = (event: PopStateEvent) => {
      // Prevent navigation away from onboarding flow
      if (currentStep > 1) {
        event.preventDefault();
        setCurrentStep(prev => Math.max(1, prev - 1));
        // Push current state back to prevent further back navigation
        window.history.pushState(null, '', window.location.pathname);
      } else {
        // Allow navigation away if on first step
        return;
      }
    };

    // Push initial state to enable back button handling
    window.history.pushState(null, '', window.location.pathname);

    // Listen for browser navigation events
    window.addEventListener('popstate', handleBrowserNavigation);

    // Cleanup function for event listeners
    return () => {
      window.removeEventListener('popstate', handleBrowserNavigation);
      setShowMarketSuggestions(false);
    };
  }, [currentStep]);

  // Notification helper
  const showNotification = useCallback((type: NotificationState['type'], message: string) => {
    setNotification({ type, message, visible: true });
    setTimeout(() => setNotification(prev => ({ ...prev, visible: false })), 5000);
  }, []);

  // Form validation - memoized to prevent infinite re-renders
  const { isStepValid, stepErrors } = React.useMemo(() => {
    const errors: FormErrors = {};

    if (currentStep === 1) {
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
      if (!profileData.businessCategory?.trim()) {
        errors.businessCategory = 'Business category is required';
      }
      if (profileData.subCategoryTags.length === 0) {
        errors.subCategoryTags = 'Please select at least one sub-category tag';
      }
    }

    if (currentStep === 2) {
      // Require at least one document for basic verification, or specific ones?
      // Let's enforce CAC for 'basic' and Proof of Address for 'verified'.
      // For now, let's require at least CAC certificate to ensure legitimate businesses.
      // If the user hasn't uploaded CAC, we show an error.
      // if (!documents.cacCertificate) {
      //   errors.cacCertificate = 'CAC Certificate is required';
      // }
      if (!documents.proofOfAddress) {
        errors.proofOfAddress = 'Proof of Address is required';
      }
    }

    if (currentStep === 3) {
      if (!profileData.bankAccountDetails?.bankName) {
        errors.bankAccountDetails = { ...errors.bankAccountDetails, bankName: 'Bank name is required' };
      }
      if (!profileData.bankAccountDetails?.accountNumber) {
        errors.bankAccountDetails = { ...errors.bankAccountDetails, accountNumber: 'Account number is required' };
      }
      if (!profileData.bankAccountDetails?.accountName) {
        errors.bankAccountDetails = { ...errors.bankAccountDetails, accountName: 'Account name is required' };
      }
    }

    return {
      isStepValid: Object.keys(errors).length === 0,
      stepErrors: errors
    };
  }, [currentStep, profileData]);

  // Update form errors when validation changes
  React.useEffect(() => {
    setFormErrors(stepErrors);
  }, [stepErrors]);

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
    if (!user?.uid) throw new Error('User not authenticated');

    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    // Use path matching storage.rules: vendors/{vendorId}/...
    const fullPath = `vendors/${user.uid}/${path}/${fileName}`;

    setUploadingFiles(prev => ({ ...prev, [path]: true }));

    try {
      const result = await FirebaseStorageService.uploadFile(file, fullPath);

      if (result.error) throw result.error;
      if (!result.url) throw new Error('Upload failed: No URL returned');

      return result.url;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    } finally {
      setUploadingFiles(prev => ({ ...prev, [path]: false }));
    }
  }, [user?.uid]);

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
    if (!isStepValid) {
      showNotification('error', 'Please fix the errors before proceeding');
      return;
    }

    setLoading(true);

    // ... imports ...

    // ... (inside component)

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

      if (documents.avatar) {
        uploadPromises.push(uploadFile(documents.avatar, 'avatars'));
      } else {
        uploadPromises.push(Promise.resolve(undefined));
      }

      const [cacUrl, proofOfAddressUrl, avatarUrl] = await Promise.allSettled(uploadPromises).then(results =>
        results.map(result => result.status === 'fulfilled' ? result.value : undefined)
      );

      // Create vendor profile
      const vendorData = {
        user_id: user.uid, // Use user.uid for Firebase
        business_name: profileData.businessName,
        business_description: profileData.businessDescription,
        business_address: profileData.businessAddress,
        business_phone: profileData.businessPhone,
        market_location: profileData.marketLocation,
        sub_category_tags: profileData.subCategoryTags,
        cac_number: profileData.cacNumber || null,
        cac_certificate_url: cacUrl || null,
        proof_of_address_url: proofOfAddressUrl || null,
        avatar_url: avatarUrl || null,
        bank_account_details: profileData.bankAccountDetails ? JSON.stringify(profileData.bankAccountDetails) : null,
        subscription_plan: selectedSubscription as any,
        subscription_status: 'inactive', // Will be set to active after payment
        subscription_start_date: null,
        subscription_end_date: null, // Will be set after payment
        is_active: true
      };

      // Check if vendor document already exists
      const existingVendor = await FirestoreService.getDocument(COLLECTIONS.VENDORS, user.uid);

      if (existingVendor) {
        // Update existing vendor - don't modify protected fields (wallet_balance, verification_status, verification_badge, total_sales)
        await FirestoreService.updateDocument(COLLECTIONS.VENDORS, user.uid, vendorData);
      } else {
        // Create new vendor with all required fields including protected ones
        const newVendorData = {
          ...vendorData,
          verification_badge: calculateVerificationBadge(),
          verification_status: 'pending',
          wallet_balance: 0,
          total_sales: 0,
          rating: 0,
          response_time: 0,
          referral_code: null,
          total_referrals: 0,
          referred_by_vendor_id: null,
          referred_by_marketer_id: null
        };
        await FirestoreService.setDocument(COLLECTIONS.VENDORS, user.uid, newVendorData);
      }

      const vendorId = user.uid;

      // Handle referral tracking if referral code was used
      if (referralData.code && referralData.type && referralData.referrerId) {
        const commissionSettings = await referralService.getCommissionSettings();
        const commissionAmount = referralData.type === 'vendor'
          ? commissionSettings.vendorReferralAmount
          : commissionSettings.marketerReferralAmount;

        if (referralData.type === 'vendor') {
          await referralService.createVendorReferral(
            referralData.referrerId,
            vendorId,
            referralData.code,
            commissionAmount
          );
        } else if (referralData.type === 'marketer') {
          await referralService.createMarketerReferral(
            referralData.referrerId,
            vendorId,
            referralData.code,
            commissionAmount
          );
        }
      }

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
    } catch (error) {
      console.error('Error completing onboarding:', error);
      showNotification('error', getFriendlyErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8" role="progressbar" aria-valuenow={currentStep} aria-valuemin={1} aria-valuemax={4}>
      {[1, 2, 3, 4].map((step) => (
        <div key={step} className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${step <= currentStep
            ? 'bg-primary-500 text-white'
            : 'bg-neutral-200 text-neutral-600'
            }`}>
            {step}
          </div>
          {step < 4 && (
            <div className={`w-12 h-0.5 ${step < currentStep ? 'bg-primary-500' : 'bg-neutral-200'
              }`} />
          )}
        </div>
      ))}
    </div>
  );


  const canProceedToNextStep = useCallback(() => {
    return isStepValid;
  }, [isStepValid]);

  return (
    <>
      <div className="min-h-screen bg-neutral-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-heading font-bold text-neutral-900 mb-2">
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
              onAvatarSelect={(file) => setDocuments(prev => ({ ...prev, avatar: file }))}
              onMarketLocationSearch={handleMarketLocationSearch}
              onSelectMarketLocation={selectMarketLocation}
              onToggleSubCategoryTag={toggleSubCategoryTag}
              onAddCustomSubCategory={(customTag) => {
                // Add custom tag to the global list if it doesn't exist
                const existingTag = SUB_CATEGORY_TAGS.find(tag => tag.name.toLowerCase() === customTag.toLowerCase());
                if (!existingTag) {
                  // In a real app, this would be saved to the database
                  // For now, we'll just add it to the local state
                  const newTag = {
                    id: `custom_${Date.now()}`,
                    name: customTag,
                    category: profileData.businessCategory || 'Other'
                  };
                  setAvailableTags(prev => [...prev, newTag]);
                }
              }}
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
                  if (isStepValid) {
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