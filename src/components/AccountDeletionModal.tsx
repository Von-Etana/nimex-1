import React, { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from './ui/button';

interface AccountDeletionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccountDeletionModal: React.FC<AccountDeletionModalProps> = ({ isOpen, onClose }) => {
  const { user, signOut } = useAuth();
  const { error: showErrorToast, success: showSuccessToast } = useToast();
  const [confirmationInput, setConfirmationInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const handleDelete = async () => {
    if (confirmationInput.trim() !== 'DELETE') {
      showErrorToast('Please type DELETE to confirm account deletion.');
      return;
    }

    if (!user) {
      showErrorToast('You must be signed in to delete your account.');
      return;
    }

    setIsDeleting(true);
    try {
      const deleteFn = httpsCallable<any, { success: boolean; message: string }>(
        functions,
        'deleteUserAccount'
      );
      const result = await deleteFn({});
      
      if (result.data?.success) {
        showSuccessToast('Your account has been deleted successfully.');
        await signOut();
        window.location.href = '/';
      } else {
        showErrorToast('Failed to delete account. Please try again.');
        setIsDeleting(false);
      }
    } catch (err: any) {
      console.error('Account deletion error:', err);
      showErrorToast(err?.message || 'Error occurred while deleting your account.');
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-neutral-200 text-left">
        <div className="flex items-center gap-3 text-red-600 mb-4">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-heading font-bold text-neutral-900">Delete Account</h3>
            <p className="text-xs text-neutral-500">This action is permanent and cannot be undone</p>
          </div>
        </div>

        <div className="space-y-3 text-sm text-neutral-600 mb-6">
          <p>
            Deleting your account will immediately:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs text-neutral-500">
            <li>Cancel any active or pending unpaid orders</li>
            <li>Close your active store listings (for vendors)</li>
            <li>Anonymize your profile and personal details</li>
            <li>Permanently revoke access to this account</li>
          </ul>
          <p className="text-xs font-semibold text-neutral-700 pt-2">
            Type <span className="text-red-600 font-mono">DELETE</span> below to confirm:
          </p>
          <input
            type="text"
            value={confirmationInput}
            onChange={(e) => setConfirmationInput(e.target.value)}
            disabled={isDeleting}
            placeholder="DELETE"
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>

        <div className="flex items-center justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
            className="font-medium"
          >
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            disabled={confirmationInput !== 'DELETE' || isDeleting}
            className="bg-red-600 hover:bg-red-700 text-white font-medium flex items-center gap-2"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete My Account'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
