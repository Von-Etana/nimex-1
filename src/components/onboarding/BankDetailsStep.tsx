import React from 'react';
import { Banknote } from 'lucide-react';
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
}): JSX.Element => {
  if (loading) {
    return (
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
            value={bankAccountDetails.bankName}
            onChange={(e) => onBankDetailsChange('bankName', e.target.value)}
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
            value={bankAccountDetails.accountNumber}
            onChange={(e) => onBankDetailsChange('accountNumber', e.target.value)}
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
            value={bankAccountDetails.accountName}
            onChange={(e) => onBankDetailsChange('accountName', e.target.value)}
            placeholder="Account holder name"
            className="w-full h-10 px-3 rounded-lg border border-neutral-200 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </CardContent>
    </Card>
  );
};