import React, { useState } from 'react';
import { Mail, X, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';

interface EmailVerificationBannerProps {
    className?: string;
}

export const EmailVerificationBanner: React.FC<EmailVerificationBannerProps> = ({ className = '' }) => {
    const { user, emailVerified, resendVerificationEmail } = useAuth();
    const [dismissed, setDismissed] = useState(false);
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');

    // Don't show if user is not logged in, email is verified, or banner is dismissed
    if (!user || emailVerified || dismissed) {
        return null;
    }

    // Don't show for Google auth users (they're auto-verified)
    if (user.providerData?.some(provider => provider?.providerId === 'google.com')) {
        return null;
    }

    const handleResend = async () => {
        setSending(true);
        setError('');

        const { error: resendError } = await resendVerificationEmail();

        setSending(false);

        if (resendError) {
            setError(resendError.message);
        } else {
            setSent(true);
            // Reset "sent" state after 5 seconds
            setTimeout(() => setSent(false), 5000);
        }
    };

    return (
        <div className={`bg-amber-50 border-b border-amber-200 px-4 py-3 ${className}`}>
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1">
                    <div className="flex-shrink-0">
                        <Mail className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm text-amber-800 font-medium">
                            Please verify your email address
                        </p>
                        <p className="text-xs text-amber-700">
                            Check your inbox ({user.email}) for a verification link.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {error && (
                        <span className="text-xs text-red-600">{error}</span>
                    )}

                    {sent ? (
                        <span className="text-xs text-green-600 font-medium">Email sent!</span>
                    ) : (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleResend}
                            disabled={sending}
                            className="text-amber-700 hover:text-amber-900 hover:bg-amber-100 text-xs"
                        >
                            {sending ? (
                                <RefreshCw className="w-4 h-4 animate-spin mr-1" />
                            ) : (
                                <RefreshCw className="w-4 h-4 mr-1" />
                            )}
                            Resend
                        </Button>
                    )}

                    <button
                        onClick={() => setDismissed(true)}
                        className="text-amber-600 hover:text-amber-800 p-1 rounded-md hover:bg-amber-100"
                        aria-label="Dismiss"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};
