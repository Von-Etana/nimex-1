import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PackageIcon, ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { FirebaseAuthService } from '../../services/firebaseAuth.service';
import { getFriendlyErrorMessage } from '../../utils/errorHandling';

export const ForgotPasswordScreen: React.FC = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const { error: resetError } = await FirebaseAuthService.sendPasswordReset(email);

        if (resetError) {
            setError(getFriendlyErrorMessage(resetError));
            setLoading(false);
        } else {
            setSuccess(true);
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-white flex flex-col md:flex-row">
                <div className="md:w-1/2 bg-gradient-to-br from-primary-500 to-primary-700 p-8 md:p-12 flex flex-col justify-center items-center text-white">
                    <div className="max-w-md w-full">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur">
                                <PackageIcon className="w-10 h-10 text-white" />
                            </div>
                            <span className="font-heading font-bold text-4xl">NIMEX</span>
                        </div>

                        <h1 className="font-heading font-bold text-3xl md:text-4xl mb-4">
                            Check Your Email
                        </h1>

                        <p className="font-sans text-lg opacity-90 leading-body">
                            We've sent password reset instructions to your email address.
                        </p>
                    </div>
                </div>

                <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
                    <div className="max-w-md w-full mx-auto text-center">
                        <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-10 h-10 text-success" />
                        </div>

                        <h2 className="font-heading font-bold text-3xl text-neutral-900 mb-4">
                            Email Sent!
                        </h2>

                        <p className="font-sans text-neutral-600 mb-8">
                            We've sent a password reset link to <strong>{email}</strong>.
                            Please check your inbox and follow the instructions to reset your password.
                        </p>

                        <p className="font-sans text-sm text-neutral-500 mb-8">
                            Didn't receive the email? Check your spam folder or try again.
                        </p>

                        <div className="space-y-4">
                            <Button
                                onClick={() => setSuccess(false)}
                                variant="outline"
                                className="w-full h-12 border-neutral-200 hover:bg-neutral-50 font-sans font-medium rounded-lg"
                            >
                                Try Again
                            </Button>

                            <Link to="/login">
                                <Button
                                    className="w-full h-12 bg-primary-500 hover:bg-primary-600 text-white font-sans font-semibold rounded-lg"
                                >
                                    Back to Sign In
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white flex flex-col md:flex-row">
            <div className="md:w-1/2 bg-gradient-to-br from-primary-500 to-primary-700 p-8 md:p-12 flex flex-col justify-center items-center text-white">
                <div className="max-w-md w-full">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur">
                            <PackageIcon className="w-10 h-10 text-white" />
                        </div>
                        <span className="font-heading font-bold text-4xl">NIMEX</span>
                    </div>

                    <h1 className="font-heading font-bold text-3xl md:text-4xl mb-4">
                        Reset Your Password
                    </h1>

                    <p className="font-sans text-lg opacity-90 leading-body">
                        Enter your email address and we'll send you instructions to reset your password.
                    </p>

                    <div className="mt-12 space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur">
                                <span className="text-2xl">📧</span>
                            </div>
                            <div>
                                <h3 className="font-heading font-semibold text-lg">Check Your Email</h3>
                                <p className="font-sans text-sm opacity-80">We'll send a reset link to your inbox</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur">
                                <span className="text-2xl">🔒</span>
                            </div>
                            <div>
                                <h3 className="font-heading font-semibold text-lg">Create New Password</h3>
                                <p className="font-sans text-sm opacity-80">Choose a strong, secure password</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
                <div className="max-w-md w-full mx-auto">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-8 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span className="font-sans">Back</span>
                    </button>

                    <h2 className="font-heading font-bold text-3xl text-neutral-900 mb-2">
                        Forgot Password?
                    </h2>
                    <p className="font-sans text-neutral-600 mb-8">
                        No worries! Enter your email and we'll send you reset instructions.
                    </p>

                    {error && (
                        <div className="mb-6 p-4 bg-error/10 border border-error rounded-lg">
                            <p className="font-sans text-sm text-error">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block font-sans font-medium text-neutral-700 mb-2">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full h-12 pl-12 pr-4 rounded-lg border border-neutral-200 font-sans text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    placeholder="your.email@example.com"
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading || !email}
                            className="w-full h-12 bg-primary-500 hover:bg-primary-600 text-white font-sans font-semibold rounded-lg"
                        >
                            {loading ? 'Sending...' : 'Send Reset Link'}
                        </Button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="font-sans text-neutral-600">
                            Remember your password?{' '}
                            <Link to="/login" className="font-semibold text-primary-500 hover:text-primary-600">
                                Sign In
                            </Link>
                        </p>
                    </div>

                    <div className="mt-8 pt-8 border-t border-neutral-100">
                        <p className="font-sans text-sm text-neutral-500 text-center">
                            Need help?{' '}
                            <Link to="/support" className="text-primary-500 hover:underline">
                                Contact Support
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
