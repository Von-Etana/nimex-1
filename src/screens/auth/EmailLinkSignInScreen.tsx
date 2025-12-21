import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PackageIcon, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { useAuth } from '../../contexts/AuthContext';
import { FirebaseAuthService } from '../../services/firebaseAuth.service';
import type { UserRole } from '../../types/database';

export const EmailLinkSignInScreen: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { completeEmailLinkSignIn, user, profile } = useAuth();

    const [status, setStatus] = useState<'checking' | 'prompt' | 'processing' | 'success' | 'error'>('checking');
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');

    // Get role from URL or localStorage
    const roleFromUrl = searchParams.get('role') as UserRole | null;
    const roleFromStorage = window.localStorage.getItem('roleForSignIn') as UserRole | null;
    const role = roleFromUrl || roleFromStorage || 'buyer';

    useEffect(() => {
        // Check if this is a valid email link
        const currentUrl = window.location.href;
        const isEmailLink = FirebaseAuthService.checkIsSignInWithEmailLink(currentUrl);

        if (!isEmailLink) {
            setError('Invalid or expired sign-in link');
            setStatus('error');
            return;
        }

        // Try to get email from localStorage
        const storedEmail = window.localStorage.getItem('emailForSignIn');

        if (storedEmail) {
            setEmail(storedEmail);
            // Auto-complete sign-in
            handleSignIn(storedEmail);
        } else {
            // Need to prompt for email
            setStatus('prompt');
        }
    }, []);

    // Redirect if already signed in
    useEffect(() => {
        if (user && profile && status === 'success') {
            const timer = setTimeout(() => {
                if (profile.role === 'vendor') {
                    if (profile.needsOnboarding) {
                        navigate('/vendor/onboarding');
                    } else {
                        navigate('/vendor/dashboard');
                    }
                } else if (profile.role === 'admin') {
                    navigate('/admin');
                } else {
                    navigate('/');
                }
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [user, profile, status, navigate]);

    const handleSignIn = async (emailToUse: string) => {
        setStatus('processing');
        setError('');

        const { error: signInError, isNewUser } = await completeEmailLinkSignIn(
            emailToUse,
            window.location.href,
            role
        );

        if (signInError) {
            setError(signInError.message);
            setStatus('error');
        } else {
            setStatus('success');
        }
    };

    const handleSubmitEmail = (e: React.FormEvent) => {
        e.preventDefault();
        if (email) {
            handleSignIn(email);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
                <div className="flex items-center justify-center gap-3 mb-8">
                    <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                        <PackageIcon className="w-7 h-7 text-primary-600" />
                    </div>
                    <span className="font-heading font-bold text-2xl text-neutral-900">NIMEX</span>
                </div>

                {status === 'checking' && (
                    <div className="text-center py-8">
                        <Loader2 className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" />
                        <p className="font-sans text-neutral-600">Verifying sign-in link...</p>
                    </div>
                )}

                {status === 'prompt' && (
                    <div>
                        <h1 className="font-heading font-bold text-2xl text-neutral-900 text-center mb-4">
                            Confirm Your Email
                        </h1>
                        <p className="font-sans text-neutral-600 text-center mb-6">
                            Please enter the email address you used to sign in.
                        </p>

                        <form onSubmit={handleSubmitEmail} className="space-y-4">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email"
                                required
                                className="w-full px-4 py-3 rounded-lg border border-neutral-300 font-sans focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                            <Button
                                type="submit"
                                className="w-full h-12 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg"
                            >
                                Complete Sign In
                            </Button>
                        </form>
                    </div>
                )}

                {status === 'processing' && (
                    <div className="text-center py-8">
                        <Loader2 className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" />
                        <p className="font-sans text-neutral-600">Signing you in...</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-10 h-10 text-green-600" />
                        </div>
                        <h2 className="font-heading font-bold text-xl text-neutral-900 mb-2">
                            Sign In Successful!
                        </h2>
                        <p className="font-sans text-neutral-600 mb-4">
                            Redirecting you to your dashboard...
                        </p>
                        <Loader2 className="w-6 h-6 text-primary-500 animate-spin mx-auto" />
                    </div>
                )}

                {status === 'error' && (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertCircle className="w-10 h-10 text-red-600" />
                        </div>
                        <h2 className="font-heading font-bold text-xl text-neutral-900 mb-2">
                            Sign In Failed
                        </h2>
                        <p className="font-sans text-red-600 mb-6">{error}</p>
                        <Button
                            onClick={() => navigate('/login')}
                            className="bg-primary-500 hover:bg-primary-600 text-white"
                        >
                            Go to Login
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};
