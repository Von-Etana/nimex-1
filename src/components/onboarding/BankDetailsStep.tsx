import React from 'react';
import { CreditCard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { FormSkeleton } from '../ui/loading-skeleton';

interface BankDetailsStepProps {
  bankAccountDetails: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
  loading?: boolean;
  onBankDetailsChange: (field: string, value: string) => void;
}

export const BankDetailsStep: React.FC<BankDetailsStepProps> = ({
  bankAccountDetails,
  loading = false,
  onBankDetailsChange
}) => {
  if (loading) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Means of Identification (Optional)
          </CardTitle>
          <p className="text-sm text-neutral-600">
            Add your identification details for verification (Driver's License, National ID, or Voter's Card)
          </p>
        </CardHeader>
        <CardContent>
          <FormSkeleton fields={3} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Means of Identification (Optional)
        </CardTitle>
        <p className="text-sm text-neutral-600">
          Add your identification details for verification (Driver's License, National ID, or Voter's Card)
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block font-sans font-medium text-sm text-neutral-700 mb-2">
            ID Type
          </label>
          <select
            value={bankAccountDetails.bankName}
            onChange={(e) => onBankDetailsChange('bankName', e.target.value)}
            className="w-full h-10 px-3 rounded-lg border border-neutral-200 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Select ID type</option>
            <option value="drivers_license">Driver's License</option>
            <option value="national_id">National ID</option>
            <option value="voters_card">Voter's Card</option>
          </select>
        </div>

        <div>
          <label className="block font-sans font-medium text-sm text-neutral-700 mb-2">
            ID Number
          </label>
          <input
            type="text"
            value={bankAccountDetails.accountNumber}
            onChange={(e) => onBankDetailsChange('accountNumber', e.target.value)}
            placeholder="Enter your ID number"
            className="w-full h-10 px-3 rounded-lg border border-neutral-200 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="block font-sans font-medium text-sm text-neutral-700 mb-2">
            Full Name (as on ID)
          </label>
          <input
            type="text"
            value={bankAccountDetails.accountName}
            onChange={(e) => onBankDetailsChange('accountName', e.target.value)}
            placeholder="Full name as it appears on your ID"
            className="w-full h-10 px-3 rounded-lg border border-neutral-200 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </CardContent>
    </Card>
  );
};