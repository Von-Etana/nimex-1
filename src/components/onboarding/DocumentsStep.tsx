import React from 'react';
import { FileText, Building2, Upload, CreditCard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { CheckCircle } from 'lucide-react';
import { CardSkeleton } from '../ui/loading-skeleton';

interface DocumentsStepProps {
  documents: {
    cacCertificate: File | null;
    proofOfAddress: File | null;
  };
  profileData: {
    bankAccountDetails?: {
      bankName: string;
      accountNumber: string;
      accountName: string;
    };
  };
  uploadingFiles: { [key: string]: boolean };
  loading?: boolean;
  onFileUpload: (field: 'cacCertificate' | 'proofOfAddress', file: File) => void;
  onNextStep: () => void;
}

export const DocumentsStep: React.FC<DocumentsStepProps> = ({
  documents,
  profileData,
  uploadingFiles,
  loading = false,
  onFileUpload,
  onNextStep
}) => {
  const calculateVerificationBadge = () => {
    let badge = 'none';

    // Per user request: verification badge requires CAC + Admin Approval.
    // Here we can only preview what *might* happen. 
    // Actual badge logic will be handled by the backend/admin.
    if (documents.cacCertificate) {
      badge = 'basic'; // Indicates documents uploaded, pending approval
    }

    return badge;
  };

  if (loading) {
    return (
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
        <CardContent>
          <CardSkeleton />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Verification Documents (Optional)
        </CardTitle>
        <p className="text-sm text-neutral-600">
          Upload CAC to request "Verified" badge. You can skip this and upload later in settings.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`p-4 rounded-lg border-2 ${documents.cacCertificate ? 'border-green-300 bg-green-50' : 'border-neutral-200'
            }`}>
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-neutral-600" />
              <div className="flex flex-col">
                <span className="font-semibold text-sm">CAC Certificate</span>
                <span className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider">Optional</span>
              </div>
            </div>
            <p className="text-xs text-neutral-600 mb-3">
              Required for "Verified" badge
            </p>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => e.target.files?.[0] && onFileUpload('cacCertificate', e.target.files[0])}
              className="hidden"
              id="cac-upload"
              aria-describedby="cac-upload-help"
            />
            <label
              htmlFor="cac-upload"
              className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-neutral-200 rounded text-xs cursor-pointer hover:bg-neutral-50"
            >
              <Upload className="w-3 h-3" />
              {uploadingFiles['cac-certificates'] ? 'Uploading...' : documents.cacCertificate ? 'Change File' : 'Upload'}
            </label>
            <p id="cac-upload-help" className="text-xs text-neutral-500 mt-1">
              Max 10MB. Allowed: .pdf, .jpg, .jpeg, .png
            </p>
            {documents.cacCertificate && (
              <p className="text-xs text-green-600 mt-1">{documents.cacCertificate.name}</p>
            )}
          </div>

          <div className={`p-4 rounded-lg border-2 ${documents.proofOfAddress ? 'border-green-300 bg-green-50' : 'border-neutral-200'
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
              onChange={(e) => e.target.files?.[0] && onFileUpload('proofOfAddress', e.target.files[0])}
              className="hidden"
              id="address-upload"
              aria-describedby="address-upload-help"
            />
            <label
              htmlFor="address-upload"
              className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-neutral-200 rounded text-xs cursor-pointer hover:bg-neutral-50"
            >
              <Upload className="w-3 h-3" />
              {uploadingFiles['proof-of-address'] ? 'Uploading...' : documents.proofOfAddress ? 'Change File' : 'Upload'}
            </label>
            <p id="address-upload-help" className="text-xs text-neutral-500 mt-1">
              Max 10MB. Allowed: .pdf, .jpg, .jpeg, .png
            </p>
            {documents.proofOfAddress && (
              <p className="text-xs text-green-600 mt-1">{documents.proofOfAddress.name}</p>
            )}
          </div>

          <div className={`p-4 rounded-lg border-2 ${profileData.bankAccountDetails?.bankName ? 'border-green-300 bg-green-50' : 'border-neutral-200'
            }`}>
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="w-4 h-4 text-neutral-600" />
              <span className="font-semibold text-sm">Means of Identification</span>
            </div>
            <p className="text-xs text-neutral-600 mb-3">
              Driver's License, National ID, or Voter's Card
            </p>
            <button
              onClick={onNextStep}
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
                <CheckCircle className="w-3 h-3 mr-1" />
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
};