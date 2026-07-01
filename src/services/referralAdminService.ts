import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';

type ReferralType = 'vendor' | 'marketer';

interface ReferralActionInput {
  referralType: ReferralType;
  referralId: string;
}

interface ReferralPaymentInput extends ReferralActionInput {
  paymentMethod: string;
  referenceNumber?: string;
  notes?: string;
}

class ReferralAdminService {
  async approveReferral(input: ReferralActionInput): Promise<void> {
    const approve = httpsCallable(functions, 'approveReferralCommission');
    await approve(input);
  }

  async rejectReferral(input: ReferralActionInput & { reason?: string }): Promise<void> {
    const reject = httpsCallable(functions, 'rejectReferralCommission');
    await reject(input);
  }

  async markCommissionPaid(input: ReferralPaymentInput): Promise<void> {
    const markPaid = httpsCallable(functions, 'markReferralCommissionPaid');
    await markPaid(input);
  }
}

export const referralAdminService = new ReferralAdminService();
