import { supabase } from '../lib/supabase';

interface FlutterwaveWalletResponse {
  success: boolean;
  data?: {
    wallet_id: string;
    account_number: string;
    bank_name: string;
    account_name: string;
  };
  error?: string;
}

interface FlutterwaveTransferResponse {
  success: boolean;
  data?: {
    reference: string;
    status: string;
  };
  error?: string;
}

class FlutterwaveService {
  private apiKey: string;
  private apiUrl: string;
  private testMode: boolean;

  constructor() {
    this.apiKey = import.meta.env.VITE_FLUTTERWAVE_API_KEY || '';
    this.apiUrl = import.meta.env.VITE_FLUTTERWAVE_API_URL || 'https://api.flutterwave.com/v3';
    this.testMode = import.meta.env.VITE_FLUTTERWAVE_TEST_MODE === 'true';
  }

  async createVendorWallet(vendorId: string, vendorData: {
    business_name: string;
    email: string;
    phone: string;
  }): Promise<FlutterwaveWalletResponse> {
    try {
      const response = await fetch(`${this.apiUrl}/virtual-account-numbers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          email: vendorData.email,
          is_permanent: true,
          bvn: '',
          tx_ref: `NIMEX-WALLET-${vendorId}`,
          firstname: vendorData.business_name,
          lastname: 'Vendor',
          narration: `${vendorData.business_name} - NIMEX Wallet`,
        }),
      });

      const result = await response.json();

      if (result.status === 'success') {
        const { data: updateData, error: updateError } = await supabase
          .from('vendors')
          .update({
            flutterwave_wallet_id: result.data.order_ref,
            flutterwave_account_number: result.data.account_number,
            flutterwave_bank_name: result.data.bank_name,
          })
          .eq('id', vendorId);

        if (updateError) {
          console.error('Error updating vendor wallet info:', updateError);
        }

        return {
          success: true,
          data: {
            wallet_id: result.data.order_ref,
            account_number: result.data.account_number,
            bank_name: result.data.bank_name,
            account_name: result.data.account_name,
          },
        };
      }

      return {
        success: false,
        error: result.message || 'Failed to create wallet',
      };
    } catch (error) {
      console.error('Flutterwave wallet creation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getWalletBalance(walletId: string): Promise<{ success: boolean; balance?: number; error?: string }> {
    try {
      const response = await fetch(`${this.apiUrl}/virtual-account-numbers/${walletId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      const result = await response.json();

      if (result.status === 'success') {
        return {
          success: true,
          balance: result.data.balance || 0,
        };
      }

      return {
        success: false,
        error: result.message || 'Failed to fetch balance',
      };
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async transferToVendor(
    vendorId: string,
    amount: number,
    bankCode: string,
    accountNumber: string,
    accountName: string,
    narration: string
  ): Promise<FlutterwaveTransferResponse> {
    try {
      const reference = `NIMEX-PAYOUT-${vendorId}-${Date.now()}`;

      const response = await fetch(`${this.apiUrl}/transfers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          account_bank: bankCode,
          account_number: accountNumber,
          amount: amount,
          narration: narration,
          currency: 'NGN',
          reference: reference,
          callback_url: `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/flutterwave-webhook`,
          debit_currency: 'NGN',
        }),
      });

      const result = await response.json();

      if (result.status === 'success') {
        return {
          success: true,
          data: {
            reference: reference,
            status: result.data.status,
          },
        };
      }

      return {
        success: false,
        error: result.message || 'Transfer failed',
      };
    } catch (error) {
      console.error('Transfer error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async verifyTransfer(reference: string): Promise<{ success: boolean; status?: string; error?: string }> {
    try {
      const response = await fetch(`${this.apiUrl}/transfers/${reference}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      const result = await response.json();

      if (result.status === 'success') {
        return {
          success: true,
          status: result.data.status,
        };
      }

      return {
        success: false,
        error: result.message || 'Verification failed',
      };
    } catch (error) {
      console.error('Transfer verification error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getBankList(): Promise<{ success: boolean; banks?: Array<{ name: string; code: string }>; error?: string }> {
    try {
      const response = await fetch(`${this.apiUrl}/banks/NG`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      const result = await response.json();

      if (result.status === 'success') {
        return {
          success: true,
          banks: result.data,
        };
      }

      return {
        success: false,
        error: result.message || 'Failed to fetch banks',
      };
    } catch (error) {
      console.error('Error fetching bank list:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async resolveAccountNumber(
    accountNumber: string,
    bankCode: string
  ): Promise<{ success: boolean; accountName?: string; error?: string }> {
    try {
      const response = await fetch(
        `${this.apiUrl}/accounts/resolve?account_number=${accountNumber}&account_bank=${bankCode}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          },
        }
      );

      const result = await response.json();

      if (result.status === 'success') {
        return {
          success: true,
          accountName: result.data.account_name,
        };
      }

      return {
        success: false,
        error: result.message || 'Account resolution failed',
      };
    } catch (error) {
      console.error('Account resolution error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

export const flutterwaveService = new FlutterwaveService();
