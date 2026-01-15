import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import {
  Wallet, Plus, DollarSign, AlertCircle, CheckCircle, Copy,
  ArrowUpRight, ArrowDownLeft, Clock, RefreshCw, History
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { flutterwaveService } from '../../services/flutterwaveService';
import { FirestoreService } from '../../services/firestore.service';
import { COLLECTIONS } from '../../lib/collections';

interface VendorData {
  id: string;
  business_name: string;
  wallet_balance: number;
  flutterwave_wallet_id: string | null;
  flutterwave_account_number: string | null;
  flutterwave_bank_name: string | null;
  flutterwave_account_name: string | null;
  virtual_account_number?: string | null;
  virtual_account_bank?: string | null;
}

interface PayoutAccount {
  id: string;
  bank_name: string;
  bank_code: string;
  account_number: string;
  account_name: string;
  is_default: boolean;
  is_verified: boolean;
}

interface WalletTransaction {
  id: string;
  type: 'credit' | 'debit' | 'withdrawal' | 'escrow_release' | 'order';
  amount: number;
  payment_status: string;
  description: string;
  created_at: string;
  payment_reference?: string;
}

interface EscrowTransaction {
  id: string;
  order_id: string;
  amount: number;
  status: string;
  created_at: string;
}

export const WalletScreen: React.FC = () => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [vendorData, setVendorData] = useState<VendorData | null>(null);
  const [payoutAccounts, setPayoutAccounts] = useState<PayoutAccount[]>([]);
  const [isCreatingWallet, setIsCreatingWallet] = useState(false);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copied, setCopied] = useState(false);

  // New state for transactions and escrow
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [pendingEscrow, setPendingEscrow] = useState<number>(0);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [isCreatingVirtualAccount, setIsCreatingVirtualAccount] = useState(false);

  const [newAccount, setNewAccount] = useState({
    bankCode: '',
    accountNumber: '',
    accountName: '',
  });

  useEffect(() => {
    if (user && profile?.role === 'vendor') {
      loadVendorData();
      loadPayoutAccounts();
      loadTransactions();
      loadPendingEscrow();
    }
  }, [user, profile]);

  const loadVendorData = async () => {
    if (!user) return;

    try {
      const data = await FirestoreService.getDocument<VendorData>(COLLECTIONS.VENDORS, user.uid);
      if (data) {
        setVendorData(data);
      }
    } catch (err) {
      console.error('Error loading vendor data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadPayoutAccounts = async () => {
    if (!user) return;

    try {
      const vendorData = await FirestoreService.getDocument<any>(COLLECTIONS.VENDORS, user.uid);
      if (!vendorData) return;

      const data = await FirestoreService.getDocuments<PayoutAccount>(COLLECTIONS.VENDOR_PAYOUT_ACCOUNTS, {
        filters: [{ field: 'vendor_id', operator: '==', value: vendorData.id || user.uid }],
        orderByField: 'is_default',
        orderByDirection: 'desc'
      });

      if (data) {
        setPayoutAccounts(data);
      }
    } catch (err) {
      console.error('Error loading payout accounts:', err);
    }
  };

  // Load transaction history
  const loadTransactions = async () => {
    if (!user) return;

    setIsLoadingTransactions(true);
    try {
      // Fetch transactions for this vendor
      const txData = await FirestoreService.getDocuments<WalletTransaction>('payment_transactions', {
        filters: [{ field: 'vendor_id', operator: '==', value: user.uid }],
        orderByField: 'created_at',
        orderByDirection: 'desc',
        limitCount: 20
      });

      setTransactions(txData || []);
    } catch (err) {
      console.error('Error loading transactions:', err);
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  // Load pending escrow amounts
  const loadPendingEscrow = async () => {
    if (!user) return;

    try {
      // Fetch orders with pending escrow
      const pendingOrders = await FirestoreService.getDocuments<any>(COLLECTIONS.ORDERS, {
        filters: [
          { field: 'vendor_id', operator: '==', value: user.uid },
          { field: 'payment_status', operator: '==', value: 'paid' },
          { field: 'status', operator: 'in', value: ['confirmed', 'processing', 'shipped'] }
        ]
      });

      // Calculate total pending escrow
      const totalPending = (pendingOrders || []).reduce((sum, order) => {
        return sum + (order.total_amount || 0);
      }, 0);

      setPendingEscrow(totalPending);
    } catch (err) {
      console.error('Error loading pending escrow:', err);
      setPendingEscrow(0);
    }
  };

  const handleCreateWallet = async () => {
    if (!vendorData || !user?.email) return;

    setIsCreatingWallet(true);
    setError('');
    setSuccess('');

    try {
      const result = await flutterwaveService.createVendorWallet(vendorData.id || user.uid, {
        business_name: vendorData.business_name,
        email: user.email,
        phone: profile?.phone || '',
      });

      if (result.success && result.data) {
        setSuccess('Wallet created successfully!');
        await loadVendorData();
      } else {
        setError(result.error || 'Failed to create wallet');
      }
    } catch (err) {
      setError('An error occurred while creating wallet');
    } finally {
      setIsCreatingWallet(false);
    }
  };

  const handleCreateVirtualAccount = async () => {
    if (!vendorData || !user?.email) return;

    setIsCreatingVirtualAccount(true);
    setError('');
    setSuccess('');

    try {
      const result = await flutterwaveService.createVirtualAccount(vendorData.id || user.uid, {
        email: user.email,
        business_name: vendorData.business_name,
        phone: profile?.phone,
      });

      if (result.success && result.data) {
        setSuccess('Virtual account created successfully!');
        await loadVendorData(); // Reload to get updated virtual account details
      } else {
        setError(result.error || 'Failed to create virtual account');
      }
    } catch (err) {
      setError('An error occurred while creating virtual account');
    } finally {
      setIsCreatingVirtualAccount(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Hardcoded bank list for fallback when API fails
  const NIGERIAN_BANKS: { code: string; name: string }[] = [
    { code: '044', name: 'Access Bank' },
    { code: '063', name: 'Diamond Bank' },
    { code: '050', name: 'Ecobank' },
    { code: '070', name: 'Fidelity Bank' },
    { code: '011', name: 'First Bank' },
    { code: '214', name: 'First City Monument Bank' },
    { code: '058', name: 'Guaranty Trust Bank' },
    { code: '030', name: 'Heritage Bank' },
    { code: '301', name: 'Jaiz Bank' },
    { code: '082', name: 'Keystone Bank' },
    { code: '526', name: 'Parallex Bank' },
    { code: '076', name: 'Polaris Bank' },
    { code: '101', name: 'Providus Bank' },
    { code: '221', name: 'Stanbic IBTC Bank' },
    { code: '068', name: 'Standard Chartered' },
    { code: '232', name: 'Sterling Bank' },
    { code: '100', name: 'Suntrust Bank' },
    { code: '032', name: 'Union Bank' },
    { code: '033', name: 'United Bank for Africa' },
    { code: '215', name: 'Unity Bank' },
    { code: '035', name: 'Wema Bank' },
    { code: '057', name: 'Zenith Bank' },
  ];

  const handleAddPayoutAccount = async () => {
    if (!vendorData || !newAccount.bankCode || !newAccount.accountNumber) {
      setError('Please fill in all required fields');
      return;
    }

    if (newAccount.accountNumber.length !== 10) {
      setError('Account number must be 10 digits');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Try API first, fallback to hardcoded list
      let selectedBank = null;

      try {
        const banks = await flutterwaveService.getBankList();
        selectedBank = banks.banks?.find(b => b.code === newAccount.bankCode);
      } catch (apiErr) {
        console.warn('Bank API failed, using fallback list');
      }

      // Use fallback if API didn't return the bank
      if (!selectedBank) {
        selectedBank = NIGERIAN_BANKS.find(b => b.code === newAccount.bankCode);
      }

      if (!selectedBank) {
        setError('Please select a valid bank from the dropdown');
        setLoading(false);
        return;
      }

      // Try to verify account, but don't block if verification fails
      let accountName = '';
      try {
        const resolved = await flutterwaveService.resolveAccountNumber(
          newAccount.accountNumber,
          newAccount.bankCode
        );
        if (resolved.success && resolved.accountName) {
          accountName = resolved.accountName;
        }
      } catch (verifyErr) {
        console.warn('Account verification failed, proceeding without verification');
      }

      const accountId = crypto.randomUUID();
      await FirestoreService.setDocument(COLLECTIONS.VENDOR_PAYOUT_ACCOUNTS, accountId, {
        vendor_id: user?.uid, // Use user.uid to match Firestore security rules
        bank_name: selectedBank.name,
        bank_code: newAccount.bankCode,
        account_number: newAccount.accountNumber,
        account_name: accountName || newAccount.accountNumber, // Use account number as fallback
        is_default: payoutAccounts.length === 0,
        is_verified: accountName ? true : false, // Only mark verified if we got account name
      });

      setSuccess('Payout account added successfully');
      setShowAddAccount(false);
      setNewAccount({ bankCode: '', accountNumber: '', accountName: '' });
      await loadPayoutAccounts();
    } catch (err) {
      console.error('Error adding payout account:', err);
      setError('Failed to add payout account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Withdrawal State
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [selectedAccountForWithdrawal, setSelectedAccountForWithdrawal] = useState('');
  const [isProcessingWithdrawal, setIsProcessingWithdrawal] = useState(false);

  const handleWithdrawal = async () => {
    if (!withdrawAmount || !selectedAccountForWithdrawal || !vendorData) return;

    const amount = parseFloat(withdrawAmount);
    if (amount > vendorData.wallet_balance) {
      setError('Insufficient funds');
      return;
    }

    const account = payoutAccounts.find(a => a.id === selectedAccountForWithdrawal);
    if (!account) return;

    setIsProcessingWithdrawal(true);
    setError('');

    try {
      const result = await flutterwaveService.transferToVendor(
        user!.uid,
        amount,
        account.bank_code,
        account.account_number,
        'Withdrawal from Nimex'
      );

      if (result.success) {
        setSuccess('Withdrawal initiated successfully');
        setShowWithdrawModal(false);
        setWithdrawAmount('');
        // Update balance locally (optimistic) or reload
        // In a real app, listen for webhook, but here we can just deduct locally for UI
        setVendorData(prev => prev ? ({ ...prev, wallet_balance: prev.wallet_balance - amount }) : null);
      } else {
        setError(result.error || 'Withdrawal failed');
      }
    } catch (err) {
      setError('An error occurred during withdrawal');
    } finally {
      setIsProcessingWithdrawal(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-sans text-neutral-600">Loading wallet...</p>
        </div>
      </div>
    );
  }

  if (!vendorData) {
    return (
      <div className="w-full min-h-screen bg-neutral-50 flex items-center justify-center">
        <Card>
          <CardContent className="p-12 text-center">
            <AlertCircle className="w-16 h-16 text-error mx-auto mb-4" />
            <h3 className="font-heading font-semibold text-lg text-neutral-900 mb-2">
              Vendor Account Not Found
            </h3>
            <p className="font-sans text-neutral-600">
              Unable to load your vendor information
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-neutral-50">
      <div className="max-w-7xl mx-auto px-3 md:px-6 py-4 md:py-8">
        <h1 className="font-heading font-bold text-lg md:text-3xl text-neutral-900 mb-6">
          Wallet & Financials
        </h1>

        {error && (
          <Card className="mb-6 border-error bg-error/5">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-error flex-shrink-0" />
              <p className="font-sans text-sm text-error">{error}</p>
            </CardContent>
          </Card>
        )}

        {success && (
          <Card className="mb-6 border-primary-500 bg-primary-50">
            <CardContent className="p-4 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-primary-700 flex-shrink-0" />
              <p className="font-sans text-sm text-primary-700">{success}</p>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-primary-500 to-primary-700 text-white">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="font-sans text-sm text-primary-100 mb-1">Available Balance</p>
                  <h2 className="font-heading font-bold text-3xl">
                    ₦{vendorData.wallet_balance.toLocaleString()}
                  </h2>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Wallet className="w-6 h-6" />
                </div>
              </div>
              <Button
                onClick={() => setShowWithdrawModal(true)}
                variant="outline"
                className="w-full bg-white text-primary-700 hover:bg-primary-50"
              >
                Withdraw Funds
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="font-sans text-sm text-neutral-600 mb-1">Pending in Escrow</p>
                  <h2 className="font-heading font-bold text-2xl text-amber-600">
                    ₦{pendingEscrow.toLocaleString()}
                  </h2>
                </div>
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                  <Clock className="w-6 h-6 text-amber-600" />
                </div>
              </div>
              <p className="font-sans text-xs text-neutral-500">
                Funds will be released after delivery confirmation
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Transaction History Section */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <History className="w-5 h-5 text-primary-600" />
                </div>
                <h3 className="font-heading font-semibold text-lg text-neutral-900">
                  Transaction History
                </h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { loadTransactions(); loadPendingEscrow(); }}
                disabled={isLoadingTransactions}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingTransactions ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            {isLoadingTransactions ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-8">
                <DollarSign className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                <p className="font-sans text-neutral-600">No transactions yet</p>
                <p className="font-sans text-sm text-neutral-400 mt-1">
                  Your transaction history will appear here
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-4 border border-neutral-100 rounded-lg hover:bg-neutral-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === 'withdrawal' || tx.type === 'debit'
                        ? 'bg-red-100'
                        : 'bg-green-100'
                        }`}>
                        {tx.type === 'withdrawal' || tx.type === 'debit' ? (
                          <ArrowUpRight className="w-5 h-5 text-red-600" />
                        ) : (
                          <ArrowDownLeft className="w-5 h-5 text-green-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-sans font-medium text-neutral-900">
                          {tx.description || (tx.type === 'withdrawal' ? 'Withdrawal' : 'Credit')}
                        </p>
                        <p className="font-sans text-xs text-neutral-500">
                          {new Date(tx.created_at).toLocaleDateString('en-NG', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-heading font-bold ${tx.type === 'withdrawal' || tx.type === 'debit'
                        ? 'text-red-600'
                        : 'text-green-600'
                        }`}>
                        {tx.type === 'withdrawal' || tx.type === 'debit' ? '-' : '+'}₦{tx.amount.toLocaleString()}
                      </p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${tx.payment_status === 'paid' || tx.payment_status === 'successful'
                        ? 'bg-green-100 text-green-700'
                        : tx.payment_status === 'pending'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-neutral-100 text-neutral-700'
                        }`}>
                        {tx.payment_status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {!vendorData.flutterwave_wallet_id ? (
          <Card className="mb-8">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wallet className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="font-heading font-bold text-xl text-neutral-900 mb-2">
                Create Your Digital Wallet
              </h3>
              <p className="font-sans text-neutral-600 mb-6 max-w-md mx-auto">
                Set up a Flutterwave wallet to receive payments directly from customers when orders are completed
              </p>
              <Button
                onClick={handleCreateWallet}
                disabled={isCreatingWallet}
                className="bg-primary-500 hover:bg-primary-600"
              >
                {isCreatingWallet ? 'Creating Wallet...' : 'Create Wallet Now'}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-8">
            <CardContent className="p-6">
              <h3 className="font-heading font-semibold text-lg text-neutral-900 mb-4">
                Your Digital Wallet
              </h3>
              <div className="bg-neutral-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-sans text-sm text-neutral-600">Bank Name</span>
                  <span className="font-sans font-medium text-neutral-900">
                    {vendorData.flutterwave_bank_name}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-sans text-sm text-neutral-600">Account Number</span>
                  <div className="flex items-center gap-2">
                    <span className="font-sans font-medium text-neutral-900">
                      {vendorData.flutterwave_account_number}
                    </span>
                    <button
                      onClick={() => copyToClipboard(vendorData.flutterwave_account_number || '')}
                      className="p-1.5 hover:bg-neutral-200 rounded transition-colors"
                    >
                      <Copy className="w-4 h-4 text-neutral-600" />
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-sans text-sm text-neutral-600">Account Name</span>
                  <span className="font-sans font-medium text-neutral-900">
                    {vendorData.flutterwave_account_name || vendorData.business_name}
                  </span>
                </div>
              </div>
              <p className="font-sans text-xs text-neutral-500 mt-4">
                Share this account number with customers for direct payments
              </p>
            </CardContent>
          </Card>
        )}

        {/* Virtual Account Section */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <h3 className="font-heading font-semibold text-lg text-neutral-900 mb-4">
              Virtual Bank Account
            </h3>
            <p className="font-sans text-sm text-neutral-600 mb-4">
              Get a dedicated account number for receiving direct bank transfers
            </p>

            {vendorData?.virtual_account_number ? (
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 space-y-3 border border-green-200">
                <div className="flex justify-between items-center">
                  <span className="font-sans text-sm text-neutral-600">Bank</span>
                  <span className="font-sans font-medium text-neutral-900">
                    {vendorData.virtual_account_bank || 'Wema Bank'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-sans text-sm text-neutral-600">Account Number</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-lg text-green-700">
                      {vendorData.virtual_account_number}
                    </span>
                    <button
                      onClick={() => copyToClipboard(vendorData.virtual_account_number || '')}
                      className="p-1.5 hover:bg-green-200 rounded transition-colors"
                    >
                      <Copy className="w-4 h-4 text-green-600" />
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-sans text-sm text-neutral-600">Account Name</span>
                  <span className="font-sans font-medium text-neutral-900">
                    {vendorData.business_name}
                  </span>
                </div>
                <p className="font-sans text-xs text-green-700 mt-2 pt-2 border-t border-green-200">
                  ✓ Customers can transfer directly to this account. Funds are credited automatically.
                </p>
              </div>
            ) : (
              <div className="text-center py-6 bg-neutral-50 rounded-lg border-2 border-dashed border-neutral-200">
                <Wallet className="w-10 h-10 text-neutral-400 mx-auto mb-3" />
                <p className="font-sans text-neutral-600 mb-4">
                  No virtual account yet
                </p>
                <Button
                  onClick={handleCreateVirtualAccount}
                  disabled={isCreatingVirtualAccount}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isCreatingVirtualAccount ? 'Creating...' : 'Create Virtual Account'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-heading font-semibold text-lg text-neutral-900">
                Payout Accounts
              </h3>
              <Button
                onClick={() => setShowAddAccount(true)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Account
              </Button>
            </div>

            {payoutAccounts.length === 0 ? (
              <div className="text-center py-8">
                <DollarSign className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                <p className="font-sans text-neutral-600">No payout accounts added yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {payoutAccounts.map((account) => (
                  <div
                    key={account.id}
                    className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg"
                  >
                    <div>
                      <p className="font-sans font-medium text-neutral-900">{account.bank_name}</p>
                      <p className="font-sans text-sm text-neutral-600">
                        {account.account_number} - {account.account_name}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {account.is_default && (
                        <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded">
                          Default
                        </span>
                      )}
                      {account.is_verified && (
                        <CheckCircle className="w-5 h-5 text-primary-600" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {showAddAccount && (
              <div className="mt-6 p-6 border border-neutral-200 rounded-lg bg-neutral-50">
                <h4 className="font-heading font-semibold text-neutral-900 mb-4">
                  Add Payout Account
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="font-sans text-sm text-neutral-700 mb-2 block">
                      Bank
                    </label>
                    <select
                      value={newAccount.bankCode}
                      onChange={(e) => setNewAccount({ ...newAccount, bankCode: e.target.value })}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg font-sans text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Select Bank</option>
                      <option value="044">Access Bank</option>
                      <option value="063">Diamond Bank</option>
                      <option value="050">Ecobank</option>
                      <option value="070">Fidelity Bank</option>
                      <option value="011">First Bank</option>
                      <option value="214">First City Monument Bank</option>
                      <option value="058">Guaranty Trust Bank</option>
                      <option value="030">Heritage Bank</option>
                      <option value="301">Jaiz Bank</option>
                      <option value="082">Keystone Bank</option>
                      <option value="526">Parallex Bank</option>
                      <option value="076">Polaris Bank</option>
                      <option value="101">Providus Bank</option>
                      <option value="221">Stanbic IBTC Bank</option>
                      <option value="068">Standard Chartered</option>
                      <option value="232">Sterling Bank</option>
                      <option value="100">Suntrust Bank</option>
                      <option value="032">Union Bank</option>
                      <option value="033">United Bank for Africa</option>
                      <option value="215">Unity Bank</option>
                      <option value="035">Wema Bank</option>
                      <option value="057">Zenith Bank</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-sans text-sm text-neutral-700 mb-2 block">
                      Account Number
                    </label>
                    <input
                      type="text"
                      value={newAccount.accountNumber}
                      onChange={(e) =>
                        setNewAccount({ ...newAccount, accountNumber: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg font-sans text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="0123456789"
                      maxLength={10}
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button onClick={handleAddPayoutAccount} className="flex-1">
                      Add Account
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowAddAccount(false);
                        setNewAccount({ bankCode: '', accountNumber: '', accountName: '' });
                      }}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      {/* Withdrawal Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardContent className="p-6">
              <h3 className="font-heading font-semibold text-lg text-neutral-900 mb-4">
                Withdraw Funds
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="font-sans text-sm text-neutral-700 mb-2 block">
                    Amount to Withdraw
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">₦</span>
                    <input
                      type="number"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      className="w-full pl-8 pr-4 py-2 border border-neutral-300 rounded-lg font-sans text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="0.00"
                    />
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">
                    Available: ₦{vendorData.wallet_balance.toLocaleString()}
                  </p>
                </div>

                <div>
                  <label className="font-sans text-sm text-neutral-700 mb-2 block">
                    Select Payout Account
                  </label>
                  <select
                    value={selectedAccountForWithdrawal}
                    onChange={(e) => setSelectedAccountForWithdrawal(e.target.value)}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg font-sans text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select Account</option>
                    {payoutAccounts.map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.bank_name} - {acc.account_number}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={handleWithdrawal}
                    disabled={isProcessingWithdrawal || !withdrawAmount || !selectedAccountForWithdrawal}
                    className="flex-1 bg-primary-500 hover:bg-primary-600"
                  >
                    {isProcessingWithdrawal ? 'Processing...' : 'Withdraw'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowWithdrawModal(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
